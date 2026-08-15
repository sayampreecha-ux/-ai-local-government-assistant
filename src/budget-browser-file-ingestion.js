export const BUDGET_BROWSER_FILE_INGESTION_VERSION = '1.0';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = Object.freeze(['pdf', 'xlsx', 'xls', 'csv', 'docx', 'json']);
const PURPOSES = Object.freeze({
  baselineBudget: Object.freeze({ labels: ['งบเดิม', 'ข้อบัญญัติงบประมาณ', 'baseline'] }),
  personnelObligations: Object.freeze({ labels: ['บุคลากร', 'เงินเดือน', 'personnel'] }),
  budgetTotals: Object.freeze({ labels: ['รายรับรายจ่าย', 'ยอดงบ', 'budget totals'] })
});

const text = value => String(value ?? '').trim();
const extensionOf = name => text(name).toLowerCase().split('.').pop();

export async function sha256Hex(arrayBuffer) {
  if (!globalThis.crypto?.subtle) throw new Error('crypto-subtle-unavailable');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function classifyBudgetFilePurpose(name = '') {
  const normalized = text(name).toLowerCase();
  for (const [key, definition] of Object.entries(PURPOSES)) {
    if (definition.labels.some(label => normalized.includes(label.toLowerCase()))) return key;
  }
  return null;
}

export async function prepareBudgetBrowserFile(file, { purpose = null, observedAt = new Date().toISOString() } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') return Object.freeze({ status: 'rejected', errors: Object.freeze(['file:required']) });
  const errors = [];
  const ext = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) errors.push('file:type-not-allowed');
  if (!Number.isFinite(Number(file.size)) || Number(file.size) <= 0) errors.push('file:empty');
  if (Number(file.size) > MAX_FILE_BYTES) errors.push('file:too-large');
  const resolvedPurpose = purpose || classifyBudgetFilePurpose(file.name);
  if (!resolvedPurpose || !PURPOSES[resolvedPurpose]) errors.push('purpose:confirmation-required');
  if (errors.length) return Object.freeze({ status: 'rejected', errors: Object.freeze(errors) });

  const buffer = await file.arrayBuffer();
  const contentHash = await sha256Hex(buffer);
  return Object.freeze({
    status: 'ready-for-parser',
    purpose: resolvedPurpose,
    file: Object.freeze({
      safeRef: `browser-upload:${contentHash.slice(0, 16)}.${ext}`,
      extension: ext,
      mimeType: text(file.type),
      size: Number(file.size),
      contentHash,
      observedAt
    }),
    governance: Object.freeze({
      rawFilenameRetained: false,
      rawBytesReturned: false,
      localHashBeforeIngestion: true,
      parserMustProduceStructuredData: true,
      humanPurposeConfirmationRequiredWhenAmbiguous: true
    })
  });
}

export { MAX_FILE_BYTES, ALLOWED_EXTENSIONS, PURPOSES as BUDGET_FILE_PURPOSES };
