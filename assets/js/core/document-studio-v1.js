const WORKER_ORIGIN = 'https://ai-local-government-assistant.sayampreecha.workers.dev';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_LOCAL_TEXT = 180_000;
const SENSITIVE_PATTERNS = [
  /\b\d(?:[ -]?\d){12}\b/g,
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
  /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g,
  /(?:password|passwd|api\s*key|secret|token|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/gi,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /(?:ข้อมูลลับของราชการ|ชั้นความลับ|ลับมาก|ลับที่สุด)\s*[:：-]?\s*[^,;\n]{1,120}/gi,
  /(?:HN|AN|เลขผู้ป่วย|รหัสผู้ป่วย)\s*[:：-]?\s*[A-Za-z0-9/-]{3,30}/gi
];

const MODE_LABELS = Object.freeze({
  report: 'รายงานทั่วไป',
  meeting: 'สรุปรายงานการประชุม',
  slides: 'สไลด์นำเสนอ'
});

function endpoint(path) {
  if (location.hostname.endsWith('workers.dev')) return `${location.origin}${path}`;
  return `${WORKER_ORIGIN}${path}`;
}

function hasSensitive(text) {
  return SENSITIVE_PATTERNS.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(String(text || ''));
  });
}

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

function safeFileBase(value) {
  return String(value || 'govprompt-document')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim()
    .slice(0, 80) || 'govprompt-document';
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function readTextFile(file) {
  const text = await file.text();
  return { text: text.slice(0, MAX_LOCAL_TEXT), truncated: text.length > MAX_LOCAL_TEXT, provider: 'browser-local' };
}

function decodeXmlText(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return [...doc.getElementsByTagNameNS('*', 't')].map(node => node.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
}

function readU16(view, offset) { return view.getUint16(offset, true); }
function readU32(view, offset) { return view.getUint32(offset, true); }

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== 'function') throw new Error('เบราว์เซอร์นี้ยังอ่าน PPTX แบบภายในเครื่องไม่ได้');
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzipSelected(file, matcher) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let offset = Math.max(0, bytes.length - 65557); offset <= bytes.length - 22; offset += 1) {
    if (readU32(view, offset) === 0x06054b50) eocd = offset;
  }
  if (eocd < 0) throw new Error('โครงสร้างไฟล์ PPTX ไม่ถูกต้อง');
  const count = readU16(view, eocd + 10);
  let cursor = readU32(view, eocd + 16);
  const decoder = new TextDecoder();
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    if (readU32(view, cursor) !== 0x02014b50) break;
    const method = readU16(view, cursor + 10);
    const compressedSize = readU32(view, cursor + 20);
    const nameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    const commentLength = readU16(view, cursor + 32);
    const localOffset = readU32(view, cursor + 42);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    if (matcher(name)) {
      const localNameLength = readU16(view, localOffset + 26);
      const localExtraLength = readU16(view, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      let plain;
      if (method === 0) plain = compressed;
      else if (method === 8) plain = await inflateRaw(compressed);
      else throw new Error(`PPTX ใช้วิธีบีบอัดที่ยังไม่รองรับ (${method})`);
      entries.push({ name, text: decoder.decode(plain) });
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function readPptxLocal(file) {
  const entries = await unzipSelected(file, name => /^ppt\/slides\/slide\d+\.xml$/i.test(name));
  entries.sort((a, b) => Number(a.name.match(/slide(\d+)/i)?.[1] || 0) - Number(b.name.match(/slide(\d+)/i)?.[1] || 0));
  if (!entries.length) throw new Error('ไม่พบสไลด์ที่อ่านได้ในไฟล์ PPTX');
  const blocks = entries.map((entry, index) => `## Slide ${index + 1}\n${decodeXmlText(entry.text)}`);
  const text = blocks.join('\n\n');
  return { text: text.slice(0, MAX_LOCAL_TEXT), truncated: text.length > MAX_LOCAL_TEXT, provider: 'browser-pptx' };
}

async function convertViaWorker(file) {
  const form = new FormData();
  form.append('file', file, file.name);
  form.append('privacyConfirmed', 'yes');
  const response = await fetch(endpoint('/api/document-studio/convert'), { method: 'POST', body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error === 'SENSITIVE_DOCUMENT_BLOCKED'
    ? 'ตรวจพบข้อมูลอ่อนไหว/ข้อมูลลับในเอกสาร กรุณาปกปิดข้อมูลก่อนใช้ Document Studio'
    : body.message || body.error || `อ่านไฟล์ไม่สำเร็จ (${response.status})`);
  return { text: String(body.markdown || ''), truncated: Boolean(body.truncated), provider: body.provider || 'cloudflare-markdown' };
}

async function extractFile(file) {
  const ext = `.${String(file.name || '').split('.').pop().toLowerCase()}`;
  if (file.size > MAX_FILE_BYTES) throw new Error('ไฟล์ใหญ่เกิน 10 MB');
  if (['.txt', '.md', '.csv'].includes(ext)) return readTextFile(file);
  if (ext === '.pptx') {
    try { return await convertViaWorker(file); }
    catch (error) {
      try { return await readPptxLocal(file); } catch { throw error; }
    }
  }
  return convertViaWorker(file);
}

async function composeDocument({ mode, text, instruction, filename }) {
  if (hasSensitive(text)) throw new Error('ตรวจพบข้อมูลอ่อนไหว/ข้อมูลลับ กรุณาปกปิดก่อนให้ AI จัดเอกสาร');
  const response = await fetch(endpoint('/api/document-studio/compose'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      mode,
      text: String(text || '').slice(0, MAX_LOCAL_TEXT),
      instruction: String(instruction || '').slice(0, 1200),
      filename: String(filename || '').slice(0, 180),
      privacyConfirmed: true
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || `จัดเอกสารไม่สำเร็จ (${response.status})`);
  return body.document;
}

function normalizeDoc(document, fallbackTitle = 'เอกสาร GovPrompt') {
  const doc = document && typeof document === 'object' ? document : {};
  return {
    title: String(doc.title || fallbackTitle).trim(),
    summary: String(doc.summary || '').trim(),
    sections: Array.isArray(doc.sections) ? doc.sections.map(section => ({
      heading: String(section?.heading || '').trim(),
      paragraphs: Array.isArray(section?.paragraphs) ? section.paragraphs.map(String).filter(Boolean) : [],
      bullets: Array.isArray(section?.bullets) ? section.bullets.map(String).filter(Boolean) : []
    })).filter(section => section.heading || section.paragraphs.length || section.bullets.length) : [],
    actionItems: Array.isArray(doc.actionItems) ? doc.actionItems.map(item => ({
      task: String(item?.task || '').trim(),
      owner: String(item?.owner || '').trim(),
      due: String(item?.due || '').trim()
    })).filter(item => item.task || item.owner || item.due) : [],
    slides: Array.isArray(doc.slides) ? doc.slides.map(slide => ({
      title: String(slide?.title || '').trim(),
      bullets: Array.isArray(slide?.bullets) ? slide.bullets.map(String).filter(Boolean).slice(0, 6) : []
    })).filter(slide => slide.title || slide.bullets.length) : []
  };
}

function textFromDoc(doc) {
  const lines = [doc.title, doc.summary];
  doc.sections.forEach(section => {
    if (section.heading) lines.push('', section.heading);
    section.paragraphs.forEach(value => lines.push(value));
    section.bullets.forEach(value => lines.push(`• ${value}`));
  });
  if (doc.actionItems.length) {
    lines.push('', 'รายการดำเนินการ');
    doc.actionItems.forEach(item => lines.push(`• ${item.task}${item.owner ? ` — ${item.owner}` : ''}${item.due ? ` — ${item.due}` : ''}`));
  }
  return lines.filter(Boolean).join('\n');
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16le(value) { return new Uint8Array([value & 255, (value >>> 8) & 255]); }
function u32le(value) { return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]); }
function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  parts.forEach(part => { out.set(part, offset); offset += part.length; });
  return out;
}
const utf8 = value => new TextEncoder().encode(String(value));

function createZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = utf8(file.name);
    const data = file.data instanceof Uint8Array ? file.data : utf8(file.data);
    const crc = crc32(data);
    const local = concatBytes([
      u32le(0x04034b50), u16le(20), u16le(0x0800), u16le(0), u16le(0), u16le(0),
      u32le(crc), u32le(data.length), u32le(data.length), u16le(name.length), u16le(0), name, data
    ]);
    locals.push(local);
    const central = concatBytes([
      u32le(0x02014b50), u16le(20), u16le(20), u16le(0x0800), u16le(0), u16le(0), u16le(0),
      u32le(crc), u32le(data.length), u32le(data.length), u16le(name.length), u16le(0), u16le(0),
      u16le(0), u16le(0), u32le(0), u32le(offset), name
    ]);
    centrals.push(central);
    offset += local.length;
  }
  const centralBytes = concatBytes(centrals);
  const end = concatBytes([
    u32le(0x06054b50), u16le(0), u16le(0), u16le(files.length), u16le(files.length),
    u32le(centralBytes.length), u32le(offset), u16le(0)
  ]);
  return new Blob([concatBytes([...locals, centralBytes, end])], { type: 'application/zip' });
}

function makeDocx(doc) {
  const paragraphs = [];
  const p = (text, style = '') => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:rPr><w:lang w:val="th-TH"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  paragraphs.push(p(doc.title, 'Title'));
  if (doc.summary) paragraphs.push(p(doc.summary));
  doc.sections.forEach(section => {
    if (section.heading) paragraphs.push(p(section.heading, 'Heading1'));
    section.paragraphs.forEach(value => paragraphs.push(p(value)));
    section.bullets.forEach(value => paragraphs.push(p(`• ${value}`)));
  });
  if (doc.actionItems.length) {
    paragraphs.push(p('รายการดำเนินการ', 'Heading1'));
    doc.actionItems.forEach(item => paragraphs.push(p(`• ${item.task}${item.owner ? ` | ผู้รับผิดชอบ: ${item.owner}` : ''}${item.due ? ` | กำหนด: ${item.due}` : ''}`)));
  }
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="32"/><w:lang w:val="th-TH"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style></w:styles>`;
  return createZip([
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: 'word/document.xml', data: documentXml },
    { name: 'word/styles.xml', data: styles },
    { name: 'word/_rels/document.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` }
  ]);
}

function fallbackSlides(doc) {
  if (doc.slides.length) return doc.slides;
  const slides = [{ title: doc.title, bullets: doc.summary ? [doc.summary] : [] }];
  doc.sections.forEach(section => slides.push({
    title: section.heading || 'สาระสำคัญ',
    bullets: [...section.bullets, ...section.paragraphs].filter(Boolean).slice(0, 5)
  }));
  if (doc.actionItems.length) slides.push({
    title: 'รายการดำเนินการ',
    bullets: doc.actionItems.map(item => `${item.task}${item.owner ? ` — ${item.owner}` : ''}${item.due ? ` — ${item.due}` : ''}`).slice(0, 6)
  });
  return slides.slice(0, 30);
}

function makePptx(doc) {
  const slides = fallbackSlides(doc);
  const files = [];
  const contentOverrides = slides.map((_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('');
  files.push({ name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${contentOverrides}</Types>` });
  files.push({ name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>` });
  files.push({ name: 'ppt/presentation.xml', data: `<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>` });
  files.push({ name: 'ppt/_rels/presentation.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('')}</Relationships>` });
  files.push({ name: 'ppt/slideMasters/slideMaster1.xml', data: `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId2"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>` });
  files.push({ name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>` });
  files.push({ name: 'ppt/slideLayouts/slideLayout1.xml', data: `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld></p:sldLayout>` });
  files.push({ name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>` });
  files.push({ name: 'ppt/theme/theme1.xml', data: `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="GovPrompt"><a:themeElements><a:clrScheme name="GovPrompt"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="12372A"/></a:dk2><a:lt2><a:srgbClr val="F3F7F5"/></a:lt2><a:accent1><a:srgbClr val="12372A"/></a:accent1><a:accent2><a:srgbClr val="2D6A4F"/></a:accent2><a:accent3><a:srgbClr val="40916C"/></a:accent3><a:accent4><a:srgbClr val="74C69D"/></a:accent4><a:accent5><a:srgbClr val="95D5B2"/></a:accent5><a:accent6><a:srgbClr val="B7E4C7"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="GovPrompt"><a:majorFont><a:latin typeface="Aptos Display"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="GovPrompt"><a:fillStyleLst/><a:lnStyleLst/><a:effectStyleLst/><a:bgFillStyleLst/></a:fmtScheme></a:themeElements></a:theme>` });
  const shape = (id, name, x, y, cx, cy, paragraphs, fontSize, bold = false) => `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${escapeXml(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paragraphs.map(text => `<a:p><a:r><a:rPr lang="th-TH" sz="${fontSize}"${bold ? ' b="1"' : ''}/><a:t>${escapeXml(text)}</a:t></a:r><a:endParaRPr lang="th-TH"/></a:p>`).join('')}</p:txBody></p:sp>`;
  slides.forEach((slide, i) => {
    const body = (slide.bullets.length ? slide.bullets : ['']).map(text => `• ${text}`);
    files.push({ name: `ppt/slides/slide${i + 1}.xml`, data: `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shape(2, 'Title', 700000, 450000, 10800000, 1000000, [slide.title || doc.title], 3000, true)}${shape(3, 'Body', 900000, 1600000, 10400000, 4500000, body, 2100, false)}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>` });
    files.push({ name: `ppt/slides/_rels/slide${i + 1}.xml.rels`, data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>` });
  });
  return createZip(files);
}

function segmentWords(text) {
  try {
    if (Intl.Segmenter) return [...new Intl.Segmenter('th', { granularity: 'word' }).segment(text)].map(item => item.segment);
  } catch {}
  return String(text).split(/(\s+)/);
}

function wrapCanvasText(ctx, text, maxWidth) {
  const parts = segmentWords(String(text || ''));
  const lines = [];
  let line = '';
  for (const part of parts) {
    const candidate = line + part;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line.trimEnd());
      line = part.trimStart();
    } else line = candidate;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.length ? lines : [''];
}

async function renderPdfPages(doc) {
  const width = 1240, height = 1754, margin = 100, maxWidth = width - margin * 2;
  const pages = [];
  let canvas, ctx, y;
  function newPage() {
    canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#111'; y = margin;
    pages.push(canvas);
  }
  function ensure(space) { if (y + space > height - margin) newPage(); }
  function draw(text, size = 26, bold = false, gap = 12) {
    ctx.font = `${bold ? '700' : '400'} ${size}px sans-serif`;
    const lines = wrapCanvasText(ctx, text, maxWidth);
    const lineHeight = Math.round(size * 1.55);
    lines.forEach(line => { ensure(lineHeight); ctx.fillText(line, margin, y); y += lineHeight; });
    y += gap;
  }
  newPage();
  draw(doc.title, 44, true, 22);
  if (doc.summary) draw(doc.summary, 27, false, 20);
  doc.sections.forEach(section => {
    if (section.heading) draw(section.heading, 32, true, 12);
    section.paragraphs.forEach(value => draw(value));
    section.bullets.forEach(value => draw(`• ${value}`));
  });
  if (doc.actionItems.length) {
    draw('รายการดำเนินการ', 32, true, 12);
    doc.actionItems.forEach(item => draw(`• ${item.task}${item.owner ? ` | ${item.owner}` : ''}${item.due ? ` | ${item.due}` : ''}`));
  }
  return pages.slice(0, 30);
}

async function canvasJpeg(canvas) {
  const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('สร้างภาพ PDF ไม่สำเร็จ')), 'image/jpeg', 0.88));
  return new Uint8Array(await blob.arrayBuffer());
}

const ascii = value => new TextEncoder().encode(value);

async function makePdf(doc) {
  const canvases = await renderPdfPages(doc);
  const images = [];
  for (const canvas of canvases) images.push({ width: canvas.width, height: canvas.height, bytes: await canvasJpeg(canvas) });
  const objects = [];
  const pageRefs = images.map((_, index) => 3 + index * 3);
  objects[1] = ascii('<< /Type /Catalog /Pages 2 0 R >>');
  objects[2] = ascii(`<< /Type /Pages /Count ${images.length} /Kids [${pageRefs.map(id => `${id} 0 R`).join(' ')}] >>`);
  images.forEach((image, index) => {
    const pageId = 3 + index * 3, imageId = pageId + 1, contentId = pageId + 2;
    objects[pageId] = ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects[imageId] = concatBytes([ascii(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`), image.bytes, ascii('\nendstream')]);
    const content = ascii('q 595 0 0 842 0 0 cm /Im0 Do Q');
    objects[contentId] = concatBytes([ascii(`<< /Length ${content.length} >>\nstream\n`), content, ascii('\nendstream')]);
  });
  const parts = [ascii('%PDF-1.4\n')];
  const offsets = [0];
  let offset = parts[0].length;
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = offset;
    const object = concatBytes([ascii(`${id} 0 obj\n`), objects[id], ascii('\nendobj\n')]);
    parts.push(object); offset += object.length;
  }
  const xrefOffset = offset;
  const xref = [`xref\n0 ${objects.length}\n`, '0000000000 65535 f \n'];
  for (let id = 1; id < objects.length; id += 1) xref.push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  xref.push(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  parts.push(ascii(xref.join('')));
  return new Blob([concatBytes(parts)], { type: 'application/pdf' });
}

function installStyles() {
  if (document.getElementById('gp-document-studio-style')) return;
  const style = document.createElement('style');
  style.id = 'gp-document-studio-style';
  style.textContent = `
    .gp-docstudio{position:fixed;inset:0;z-index:10000;background:rgba(10,20,16,.55);display:grid;place-items:center;padding:16px}
    .gp-docstudio[hidden]{display:none}.gp-docstudio-card{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.25)}
    .gp-docstudio-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.gp-docstudio h2{margin:0;color:#12372a}.gp-docstudio .sub{margin:.3rem 0 1rem;color:#4b6258}
    .gp-docstudio-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.gp-docstudio label{font-weight:800;color:#12372a}.gp-docstudio input,.gp-docstudio select,.gp-docstudio textarea{width:100%;box-sizing:border-box;margin-top:6px;padding:10px 12px;border:1px solid #cbd8d2;border-radius:12px;font:inherit}
    .gp-docstudio textarea{min-height:90px;resize:vertical}.gp-docstudio .wide{grid-column:1/-1}.gp-docstudio-privacy{display:flex!important;gap:8px;align-items:flex-start;font-weight:600!important;color:#394b43!important}.gp-docstudio-privacy input{width:auto;margin-top:3px}
    .gp-docstudio-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.gp-docstudio button{border:1px solid #b9ccc2;background:#fff;color:#12372a;border-radius:999px;padding:9px 14px;font-weight:800;cursor:pointer}.gp-docstudio button.primary{background:#12372a;color:#fff}.gp-docstudio button:disabled{opacity:.45;cursor:not-allowed}
    .gp-docstudio-status{margin-top:14px;padding:10px 12px;border-radius:12px;background:#f3f7f5;white-space:pre-wrap}.gp-docstudio-preview{margin-top:12px;border:1px solid #dbe6e0;border-radius:14px;padding:14px;background:#fff;white-space:pre-wrap;max-height:320px;overflow:auto}
    .gp-docstudio-downloads{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.gp-docstudio-close{font-size:22px;line-height:1;padding:4px 10px!important}
    @media(max-width:620px){.gp-docstudio-grid{grid-template-columns:1fr}.gp-docstudio .wide{grid-column:auto}.gp-docstudio-card{padding:16px}}
  `;
  document.head.append(style);
}

function buildOverlay() {
  installStyles();
  let overlay = document.getElementById('gpDocumentStudio');
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'gpDocumentStudio';
  overlay.className = 'gp-docstudio';
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="gp-docstudio-card" role="dialog" aria-modal="true" aria-labelledby="gpDocStudioTitle">
      <div class="gp-docstudio-head"><div><h2 id="gpDocStudioTitle">📄 Document Studio</h2><p class="sub">แนบไฟล์ → GP อ่าน → AI จัดโครงสร้าง → ดาวน์โหลด Word / PDF / PowerPoint</p></div><button class="gp-docstudio-close" type="button" data-close aria-label="ปิด">×</button></div>
      <div class="gp-docstudio-grid">
        <label class="wide">เอกสาร<input type="file" data-file accept=".pdf,.docx,.xlsx,.xls,.xlsm,.xlsb,.csv,.txt,.md,.html,.htm,.xml,.odt,.ods,.numbers,.jpg,.jpeg,.png,.webp,.svg,.gif,.bmp,.pptx"></label>
        <label>รูปแบบ<select data-mode><option value="report">รายงานทั่วไป</option><option value="meeting">สรุปรายงานประชุม</option><option value="slides">สไลด์นำเสนอ</option></select></label>
        <label>ชื่อไฟล์ผลลัพธ์<input type="text" data-output-name placeholder="govprompt-document"></label>
        <label class="wide">คำสั่งเพิ่มเติม (ถ้ามี)<textarea data-instruction placeholder="เช่น จัดเป็นภาษาราชการ กระชับ 1–2 หน้า หรือเน้นประเด็นเสนอผู้บริหาร"></textarea></label>
        <label class="wide gp-docstudio-privacy"><input type="checkbox" data-privacy> <span>ฉันยืนยันว่าเอกสารนี้ไม่มีข้อมูลลับของราชการ รหัสผ่าน/กุญแจ API หรือข้อมูลส่วนบุคคลที่ไม่จำเป็น และยินยอมให้ส่งไฟล์ไปประมวลผลผ่าน Cloudflare Workers AI</span></label>
      </div>
      <div class="gp-docstudio-actions"><button class="primary" type="button" data-run>อ่านและจัดหน้า</button><button type="button" data-close>ยกเลิก</button></div>
      <div class="gp-docstudio-status" data-status hidden></div>
      <pre class="gp-docstudio-preview" data-preview hidden></pre>
      <div class="gp-docstudio-downloads" data-downloads hidden>
        <button type="button" data-download="docx">⬇️ Word (.docx)</button>
        <button type="button" data-download="pdf">⬇️ PDF</button>
        <button type="button" data-download="pptx">⬇️ PowerPoint (.pptx)</button>
      </div>
    </section>`;
  document.body.append(overlay);
  return overlay;
}

let currentDoc = null;
let currentBase = 'govprompt-document';

function openStudio() {
  const overlay = buildOverlay();
  overlay.hidden = false;
  overlay.querySelector('[data-file]')?.focus();
}

function closeStudio() {
  const overlay = document.getElementById('gpDocumentStudio');
  if (overlay) overlay.hidden = true;
}

async function runStudio(overlay) {
  const file = overlay.querySelector('[data-file]')?.files?.[0];
  const mode = overlay.querySelector('[data-mode]')?.value || 'report';
  const instruction = overlay.querySelector('[data-instruction]')?.value || '';
  const privacy = Boolean(overlay.querySelector('[data-privacy]')?.checked);
  const status = overlay.querySelector('[data-status]');
  const preview = overlay.querySelector('[data-preview]');
  const downloads = overlay.querySelector('[data-downloads]');
  const run = overlay.querySelector('[data-run]');
  if (!file) { status.hidden = false; status.textContent = 'กรุณาเลือกไฟล์ก่อน'; return; }
  if (!privacy) { status.hidden = false; status.textContent = 'กรุณายืนยัน Privacy Checkpoint ก่อนส่งเอกสารไปประมวลผล'; return; }
  run.disabled = true; downloads.hidden = true; preview.hidden = true; status.hidden = false;
  try {
    status.textContent = `1/3 กำลังอ่าน ${file.name}…`;
    const extracted = await extractFile(file);
    if (!extracted.text.trim()) throw new Error('ไม่พบข้อความที่อ่านได้จากเอกสาร');
    if (hasSensitive(extracted.text)) throw new Error('ตรวจพบข้อมูลอ่อนไหว/ข้อมูลลับ กรุณาปกปิดก่อนใช้ Document Studio');
    status.textContent = `2/3 อ่านเอกสารแล้ว${extracted.truncated ? ' (เนื้อหายาว จึงจำกัดส่วนที่ใช้วิเคราะห์)' : ''}\nกำลังให้ AI จัดเป็น ${MODE_LABELS[mode]}…`;
    const composed = await composeDocument({ mode, text: extracted.text, instruction, filename: file.name });
    currentDoc = normalizeDoc(composed, safeFileBase(file.name));
    currentBase = safeFileBase(overlay.querySelector('[data-output-name]')?.value || file.name);
    preview.textContent = textFromDoc(currentDoc);
    preview.hidden = false; downloads.hidden = false;
    status.textContent = `3/3 เสร็จแล้ว ✅ อ่านด้วย ${extracted.provider} และจัดโครงสร้างด้วย Workers AI\nตรวจทานข้อเท็จจริงก่อนนำไปใช้ราชการ`;
  } catch (error) {
    currentDoc = null;
    status.textContent = `ไม่สำเร็จ: ${error?.message || error}`;
  } finally {
    run.disabled = false;
  }
}

async function downloadCurrent(kind) {
  if (!currentDoc) return;
  if (kind === 'docx') {
    const zip = makeDocx(currentDoc);
    triggerDownload(new Blob([await zip.arrayBuffer()], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `${currentBase}.docx`);
    return;
  }
  if (kind === 'pptx') {
    const zip = makePptx(currentDoc);
    triggerDownload(new Blob([await zip.arrayBuffer()], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), `${currentBase}.pptx`);
    return;
  }
  if (kind === 'pdf') triggerDownload(await makePdf(currentDoc), `${currentBase}.pdf`);
}

document.addEventListener('click', event => {
  const quick = event.target.closest?.('.quick-actions button');
  if (quick && String(quick.textContent || '').trim() === 'จัดหน้าเอกสาร') {
    event.preventDefault();
    event.stopImmediatePropagation();
    openStudio();
    return;
  }
  const overlay = event.target.closest?.('#gpDocumentStudio');
  if (!overlay) return;
  if (event.target.closest('[data-close]')) { closeStudio(); return; }
  if (event.target.closest('[data-run]')) { void runStudio(overlay); return; }
  const download = event.target.closest('[data-download]');
  if (download) void downloadCurrent(download.dataset.download);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !document.getElementById('gpDocumentStudio')?.hidden) closeStudio();
});

window.GovPromptDocumentStudio = Object.freeze({ open: openStudio });
