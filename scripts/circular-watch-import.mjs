#!/usr/bin/env node
// Manual, offline staging only. This tool NEVER publishes to the public registry.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { validateReviewQueue, validateDocumentEvidence } from './circular-watch-source-gate.mjs';
const context = { window: {}, URL };
runInNewContext(readFileSync(new URL('../assets/js/core/circular-watch-registry.js', import.meta.url), 'utf8'), context);
const { createCircularRegistry, stageReviewQueue } = context.window.GovPromptCore.CircularWatch;
const args = process.argv.slice(2);
const value = name => { const i = args.indexOf(name); return i < 0 ? '' : args[i + 1] || ''; };
const input = value('--input');
const output = value('--output') || 'artifacts/circular-watch/review-queue.json';
const manifest = value('--registry') || 'knowledge/circulars/index.json';
if (!input || args.includes('--publish')) {
  console.error('Usage: node scripts/circular-watch-import.mjs --input file.json [--output staging.json] [--registry knowledge/circulars/index.json] [--original original.pdf]');
  console.error('Only creates a local review queue. Publishing requires a separate reviewed GitHub PR.');
  process.exit(2);
}
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
try {
  const inputBytes = await readFile(input);
  if (inputBytes.length > 5 * 1024 * 1024) throw new TypeError('Input exceeds 5 MB');
  const incoming = JSON.parse(inputBytes.toString('utf8'));
  const raw = Array.isArray(incoming) ? incoming : incoming.records || incoming.entries?.map(e => e.record);
  if (!Array.isArray(raw) || raw.length > 5000) throw new TypeError('Expected <=5000 records');
  const existing = JSON.parse(await readFile(manifest, 'utf8'));
  if (!Array.isArray(existing.records) || (existing.shards?.length)) throw new TypeError('Use a complete flattened registry; partial shard comparison is blocked');
  const original = value('--original');
  if (original) {
    if (raw.length !== 1) throw new TypeError('--original requires exactly one candidate');
    const bytes = await readFile(original);
    if (bytes.length > 20 * 1024 * 1024 || bytes.subarray(0,5).toString() !== '%PDF-') throw new TypeError('Expected original PDF <=20 MB');
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (raw[0].documentSha256 && raw[0].documentSha256 !== digest) throw new TypeError('Original document hash mismatch');
    raw[0] = {...raw[0], documentSha256: digest};
  }
  const queue = stageReviewQueue(raw, existing.records);
  const entries = queue.entries.map(entry => ({...entry, documentEvidenceGate: validateDocumentEvidence(entry.record)}));
  const gate = validateReviewQueue({ purpose: 'LOCAL_REVIEW_ONLY', publishable: false, entries });
  const summary = Object.fromEntries(['NEW','UNCHANGED','CHANGED_REVIEW_REQUIRED'].map(x => [x, entries.filter(e => e.change === x).length]));
  const staged = {
    ...queue,
    warning: 'Do not publish without independent official source and human review',
    inputDigestSha256: hash(raw), summary, entries,
    officialSourceGate: { pass: gate.pass, decision: gate.decision, errors: gate.errors },
    documentEvidenceSummary: { readyForIndependentReview: entries.filter(e => e.documentEvidenceGate.pass).length, blocked: entries.filter(e => !e.documentEvidenceGate.pass).length }
  };
  const target = resolve(output);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(staged, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ output: target, summary, officialSourceGate: gate.pass ? 'STAGED_ONLY' : 'DECISION_LOCK', published: false }));
} catch (error) {
  console.error('Import blocked:', error.message);
  process.exitCode = 1;
}
