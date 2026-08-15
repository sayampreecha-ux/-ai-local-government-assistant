export const BUDGET_OFFICE_EXPORT_VERSION = '1.0';

const encoder = new TextEncoder();
const xml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const finite = value => Number.isFinite(Number(value));
const money = value => finite(value) ? Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '';
const safeName = value => String(value ?? '').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_').slice(0, 80) || 'budget';

let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}
function crc32(bytes) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of bytes) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(value) { return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff); }
function u32(value) { return Uint8Array.of(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff); }
function concat(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

function zipStore(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc),
      u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
    ]);
    locals.push(local);
    centrals.push(concat([
      u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0), u32(crc),
      u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]));
    offset += local.length;
  }
  const central = concat(centrals);
  const eocd = concat([u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(offset), u16(0)]);
  return concat([...locals, central, eocd]);
}

function columnName(index) {
  let n = index + 1;
  let out = '';
  while (n > 0) { const r = (n - 1) % 26; out = String.fromCharCode(65 + r) + out; n = Math.floor((n - 1) / 26); }
  return out;
}
function cell(value, row, col) {
  const ref = `${columnName(col)}${row}`;
  if (finite(value) && typeof value !== 'boolean' && String(value).trim() !== '') return `<c r="${ref}" s="2"><v>${Number(value)}</v></c>`;
  return `<c r="${ref}" t="inlineStr" s="1"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}
function sheetXml(rows) {
  const body = rows.map((values, r) => `<row r="${r + 1}">${values.map((value, c) => cell(value, r + 1, c)).join('')}</row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData>${body}</sheetData></worksheet>`;
}

function officeData(artifact) {
  const content = artifact?.content || {};
  const totals = content.budgetTotals || {};
  const revenue = Array.isArray(totals.revenueItems) ? totals.revenueItems : [];
  const expense = Array.isArray(totals.expenseItems) ? totals.expenseItems : [];
  const projects = Array.isArray(content.projectRequests) && content.projectRequests.length ? content.projectRequests : (Array.isArray(content.targetYearPlan?.projects) ? content.targetYearPlan.projects : []);
  const sources = Array.isArray(content.sourceRegister) ? content.sourceRegister : [];
  const risks = Array.isArray(content.budgetRiskReview?.findings) ? content.budgetRiskReview.findings : [];
  return { content, totals, revenue, expense, projects, sources, risks };
}

function workbookEntries(artifact) {
  const { content, revenue, expense, projects, sources, risks } = officeData(artifact);
  const sheets = [
    ['สรุป', [
      ['ร่างงบประมาณรายจ่าย (Working Draft)'],
      ['หน่วยงาน', content.organizationName || ''],
      ['ปีงบประมาณ', content.targetBudgetYear || ''],
      ['รายรับรวม', content.revenueTotal ?? ''],
      ['รายจ่ายรวม', content.expenseTotal ?? ''],
      ['ผลต่าง', content.difference ?? ''],
      ['มีตัวเลขประมาณการ', content.hasEstimates ? 'มี — ต้องยืนยันก่อนเสนอ final' : 'ไม่พบ'],
      ['สถานะ', 'ร่างสำหรับตรวจสอบภายใน — AI ไม่ใช่ผู้อนุมัติงบประมาณ']
    ]],
    ['รายรับ', [['รหัส', 'รายการ', 'จำนวนเงิน (บาท)', 'สถานะ'], ...revenue.map(row => [row.key || '', row.label || row.key || '', row.amount ?? '', row.status || ''])]],
    ['รายจ่าย', [['รหัส', 'รายการ', 'จำนวนเงิน (บาท)', 'สถานะ'], ...expense.map(row => [row.key || '', row.label || row.key || '', row.amount ?? '', row.status || ''])]],
    ['โครงการ', [['ลำดับ', 'ชื่อโครงการ', 'วงเงิน', 'ความพร้อม', 'ลำดับความสำคัญ'], ...projects.map((row, i) => [i + 1, row.name || row.title || '', row.amount ?? '', row.readiness || 'unverified', row.priority || 'Reserve'])]],
    ['ความเสี่ยง', [['รหัส', 'ระดับ', 'สถานะ', 'รายละเอียด'], ...risks.map(row => [row.code || '', row.severity || '', row.status || '', row.message || ''])]],
    ['แหล่งข้อมูล', [['หลักฐาน', 'เอกสาร', 'หน่วยงาน', 'URL', 'วันที่', 'อ่านเนื้อหาแล้ว'], ...sources.map(row => [row.evidenceKey || '', row.documentTitle || '', row.sourceName || '', row.sourceUrl || '', row.documentDate || '', row.contentReadAndVerified ? 'ใช่' : 'ไม่'])]]
  ];
  const workbookSheets = sheets.map((sheet, i) => `<sheet name="${xml(sheet[0].slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('');
  const rels = sheets.map((sheet, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('');
  return [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>` },
    ...sheets.map((sheet, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(sheet[1]) }))
  ];
}

function wParagraph(value, bold = false) {
  return `<w:p><w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${xml(value)}</w:t></w:r></w:p>`;
}
function wTable(rows) {
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${rows.map(row => `<w:tr>${row.map(value => `<w:tc><w:p><w:r><w:t>${xml(value)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;
}
function docxEntries(artifact) {
  const { content, revenue, expense, projects, sources, risks } = officeData(artifact);
  const body = [
    wParagraph('ร่างงบประมาณรายจ่ายประจำปี (Working Draft)', true),
    wParagraph(`${content.organizationName || ''} ปีงบประมาณ ${content.targetBudgetYear || ''}`, true),
    wParagraph(`รายรับรวม ${money(content.revenueTotal)} บาท · รายจ่ายรวม ${money(content.expenseTotal)} บาท · ผลต่าง ${money(content.difference)} บาท`),
    wParagraph(content.hasEstimates ? 'สถานะ: มีตัวเลขประมาณการ ต้องยืนยันหลักฐานก่อนเสนอร่างขั้นสุดท้าย' : 'สถานะ: ไม่พบตัวเลขที่ติดป้ายประมาณการ'),
    wParagraph('ประมาณการรายรับ', true),
    wTable([['รายการ','จำนวนเงิน (บาท)','สถานะ'], ...revenue.map(row => [row.label || row.key || '', money(row.amount), row.status || ''])]),
    wParagraph('ประมาณการรายจ่าย', true),
    wTable([['รายการ','จำนวนเงิน (บาท)','สถานะ'], ...expense.map(row => [row.label || row.key || '', money(row.amount), row.status || ''])]),
    wParagraph('โครงการจากแผน/คำขอเบื้องต้น', true),
    wTable([['ลำดับ','ชื่อโครงการ','วงเงิน','ความพร้อม'], ...projects.slice(0, 300).map((row,i) => [i+1, row.name || row.title || '', money(row.amount), row.readiness || 'unverified'])]),
    risks.length ? wParagraph('ประเด็นความเสี่ยง', true) : '',
    risks.length ? wTable([['รหัส','ระดับ','รายละเอียด'], ...risks.map(row => [row.code || '', row.severity || '', row.message || ''])]) : '',
    wParagraph('แหล่งข้อมูล', true),
    wTable([['เอกสาร','หน่วยงาน','วันที่','อ่านเนื้อหา'], ...sources.map(row => [row.documentTitle || row.evidenceKey || '', row.sourceName || '', row.documentDate || '', row.contentReadAndVerified ? 'แล้ว' : 'metadata'])]),
    wParagraph('หมายเหตุ: เอกสารนี้เป็นร่างเพื่อการตรวจสอบภายใน AI ไม่ใช่ผู้อนุมัติงบประมาณ และต้องผ่านการตรวจ/รับรองของผู้มีอำนาจก่อนใช้งานขั้นสุดท้าย')
  ].filter(Boolean).join('');
  return [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: 'word/document.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>` }
  ];
}

export function buildBudgetXlsxBlob(artifact) {
  return new Blob([zipStore(workbookEntries(artifact))], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
export function buildBudgetDocxBlob(artifact) {
  return new Blob([zipStore(docxEntries(artifact))], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
export function budgetOfficeFilename(artifact, extension) {
  const content = artifact?.content || {};
  return `${safeName(content.organizationName || 'งบประมาณ')}_${safeName(content.targetBudgetYear || 'ปีงบประมาณ')}_WorkingDraft.${extension}`;
}
export function downloadBlob(blob, filename) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return false;
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
  return true;
}
export function downloadBudgetOfficeFile(artifact, format = 'xlsx') {
  if (!artifact || artifact.key !== 'budget-structured-export' || artifact.status !== 'ready') return false;
  if (format === 'docx') return downloadBlob(buildBudgetDocxBlob(artifact), budgetOfficeFilename(artifact, 'docx'));
  return downloadBlob(buildBudgetXlsxBlob(artifact), budgetOfficeFilename(artifact, 'xlsx'));
}

export { zipStore };
export default Object.freeze({ version: BUDGET_OFFICE_EXPORT_VERSION, buildBudgetXlsxBlob, buildBudgetDocxBlob, downloadBudgetOfficeFile, budgetOfficeFilename });
