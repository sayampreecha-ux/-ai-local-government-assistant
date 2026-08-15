import { parseBaselineBudgetDocument } from './budget-official-document-parser.js';

export const BUDGET_BROWSER_FILE_PARSER_VERSION = '1.0';
const decoder = new TextDecoder('utf-8');
const text = value => String(value ?? '').trim();
const xmlDecode = value => String(value ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const finite = value => Number.isFinite(Number(value));

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { values.push(value.trim()); value = ''; }
    else value += ch;
  }
  values.push(value.trim());
  return values;
}
function csvToText(raw) { return String(raw).split(/\r?\n/).filter(Boolean).map(line => parseCsvLine(line).join(' | ')).join('\n'); }

function readU16(bytes, offset) { return bytes[offset] | (bytes[offset + 1] << 8); }
function readU32(bytes, offset) { return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0; }
async function inflateRaw(data) {
  if (typeof DecompressionStream === 'undefined') throw new Error('deflate-parser-unavailable');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipEntries(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const files = new Map();
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    const signature = readU32(bytes, offset);
    if (signature !== 0x04034b50) break;
    const flags = readU16(bytes, offset + 6);
    const method = readU16(bytes, offset + 8);
    const compressedSize = readU32(bytes, offset + 18);
    const nameLength = readU16(bytes, offset + 26);
    const extraLength = readU16(bytes, offset + 28);
    if (flags & 0x0008) throw new Error('zip-data-descriptor-not-supported');
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = await inflateRaw(compressed);
    else throw new Error(`zip-compression-${method}-not-supported`);
    files.set(name, data);
    offset = dataStart + compressedSize;
  }
  return files;
}

function sharedStrings(xmlText) {
  return [...String(xmlText).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(match => {
    const values = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(item => xmlDecode(item[1]));
    return values.join('');
  });
}
function xlsxSheetToText(sheetXml, strings) {
  const rows = [];
  for (const rowMatch of String(sheetXml).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] || '';
      const inline = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1];
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
      let value = inline != null ? xmlDecode(inline) : xmlDecode(raw);
      if (type === 's' && /^\d+$/.test(raw)) value = strings[Number(raw)] ?? raw;
      cells.push(value);
    }
    if (cells.some(value => text(value))) rows.push(cells.join(' | '));
  }
  return rows.join('\n');
}

async function xlsxToText(buffer) {
  const files = await unzipEntries(buffer);
  const strings = files.has('xl/sharedStrings.xml') ? sharedStrings(decoder.decode(files.get('xl/sharedStrings.xml'))) : [];
  const sheet = files.get('xl/worksheets/sheet1.xml') || [...files.entries()].find(([name]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))?.[1];
  if (!sheet) throw new Error('xlsx-sheet-not-found');
  return xlsxSheetToText(decoder.decode(sheet), strings);
}
async function docxToText(buffer) {
  const files = await unzipEntries(buffer);
  const documentXml = files.get('word/document.xml');
  if (!documentXml) throw new Error('docx-document-not-found');
  return decoder.decode(documentXml)
    .replace(/<w:tab\/?\s*>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\/?\s*>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n').map(xmlDecode).map(text).filter(Boolean).join('\n');
}

function personnelFromText(raw) {
  const candidates = [];
  for (const line of String(raw).split(/\r?\n/)) {
    if (!/(งบบุคลากร|เงินเดือน|ค่าจ้าง|ค่าตอบแทนบุคลากร|ภาระบุคลากร)/i.test(line)) continue;
    const numbers = [...line.matchAll(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?/g)].map(match => Number(match[0].replace(/,/g, ''))).filter(Number.isFinite);
    if (numbers.length) candidates.push(Math.max(...numbers));
  }
  const total = candidates.length ? Math.max(...candidates) : null;
  return total == null ? null : { total, basis: 'deterministic-upload-parse' };
}

function structuredFromText(raw, purpose, targetYear = null) {
  const baseline = parseBaselineBudgetDocument(raw, { targetYear });
  if (purpose === 'baselineBudget') return baseline.valid ? baseline.data : null;
  if (purpose === 'personnelObligations') return personnelFromText(raw);
  if (purpose === 'budgetTotals') {
    if (!baseline.valid || !finite(baseline.data.total)) return null;
    return {
      revenueTotal: Number(baseline.data.total),
      expenseTotal: Number(baseline.data.total),
      revenueItems: (baseline.data.revenueItems || []).map(row => ({ ...row, status: 'verified' })),
      expenseItems: (baseline.data.expenseItems || []).map(row => ({ ...row, status: 'verified' }))
    };
  }
  return null;
}

export async function parseBudgetBrowserFile(file, prepared, { targetYear = null } = {}) {
  if (!file || !prepared || prepared.status !== 'ready-for-parser') return Object.freeze({ status: 'rejected', data: null, errors: Object.freeze(['prepared-file:required']) });
  const ext = prepared.file.extension;
  let rawText = '';
  let data = null;
  try {
    const buffer = await file.arrayBuffer();
    if (ext === 'json') {
      const parsed = JSON.parse(decoder.decode(buffer));
      data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    } else if (ext === 'csv') rawText = csvToText(decoder.decode(buffer));
    else if (ext === 'xlsx' || ext === 'xls') rawText = ext === 'xlsx' ? await xlsxToText(buffer) : '';
    else if (ext === 'docx') rawText = await docxToText(buffer);
    else if (ext === 'pdf') return Object.freeze({ status: 'blocked-local-pdf-parser', data: null, errors: Object.freeze(['pdf:use-official-reader-or-structured-file']) });
    if (!data && rawText) data = structuredFromText(rawText, prepared.purpose, targetYear);
  } catch (error) {
    return Object.freeze({ status: 'blocked-file-parse', data: null, errors: Object.freeze([text(error?.message || 'parse-error')]) });
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return Object.freeze({ status: 'blocked-unstructured-file', data: null, errors: Object.freeze(['structured-budget-data:not-found']) });
  return Object.freeze({
    status: 'ready', data: Object.freeze(data), errors: Object.freeze([]),
    governance: Object.freeze({ deterministicLocalParse: true, rawBytesReturned: false, filenameRetained: false, parserVersion: BUDGET_BROWSER_FILE_PARSER_VERSION })
  });
}

export { unzipEntries, xlsxToText, docxToText, csvToText };
export default parseBudgetBrowserFile;
