#!/usr/bin/env node
// Manual, offline staging only. This tool NEVER publishes to the public registry.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { validateReviewQueue } from './circular-watch-source-gate.mjs';
const context = { window: {}, URL };
runInNewContext(readFileSync(new URL('../assets/js/core/circular-watch-registry.js', import.meta.url), 'utf8'), context);
const { createCircularRegistry } = context.window.GovPromptCore.CircularWatch;
const args = process.argv.slice(2);
const value = name => { const i = args.indexOf(name); return i < 0 ? '' : args[i + 1] || ''; };
const input = value('--input');
const output = value('--output') || 'artifacts/circular-watch/review-queue.json';
const manifest = value('--registry') || 'knowledge/circulars/index.json';
if (!input || args.includes('--publish')) {
  console.error('Usage: node scripts/circular-watch-import.mjs --input file.json [--output staging.json] [--registry knowledge/circulars/index.json]');
  console.error('Only creates a local review queue. Publishing requires a separate reviewed GitHub PR.');
  process.exit(2);
}
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
try {
  const incoming = JSON.parse(await readFile(input, 'utf8'));
  const raw = Array.isArray(incoming) ? incoming : incoming.records;
  if (!Array.isArray(raw) || raw.length > 5000) throw new TypeError('Expected <=5000 records');
  const candidates = createCircularRegistry(raw).records;
  const existing = JSON.parse(await readFile(manifest, 'utf8'));
  if (!Array.isArray(existing.records)) throw new TypeError('Invalid existing manifest');
  const current = createCircularRegistry(existing.records);
  const byIdentity = new Map(current.records.map(r => [[r.issuingAgency, r.documentNumber].join('|'), r]));
  const entries = candidates.map(record => {
    const old = byIdentity.get([record.issuingAgency, record.documentNumber].join('|'));
    const change = !old ? 'NEW' : hash(old) === hash(record) ? 'UNCHANGED' : 'CHANGED_REVIEW_REQUIRED';
    return { change, documentId: record.id, record };
  });
  const gate = validateReviewQueue({ purpose: 'LOCAL_REVIEW_ONLY', publishable: false, entries });
  const summary = Object.fromEntries(['NEW','UNCHANGED','CHANGED_REVIEW_REQUIRED'].map(x => [x, entries.filter(e => e.change === x).length]));
  const staged = {
    schemaVersion: '1.0', purpose: 'LOCAL_REVIEW_ONLY', publishable: false,
    warning: 'Do not publish without independent official source and human review',
    inputDigestSha256: hash(raw), summary, entries,
    officialSourceGate: { pass: gate.pass, decision: gate.decision, errors: gate.errors }
  };
  const target = resolve(output);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(staged, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ output: target, summary, officialSourceGate: gate.pass ? 'STAGED_ONLY' : 'DECISION_LOCK', published: false }));
} catch (error) {
  console.error('Import blocked:', error.message);
  process.exitCode = 1;
}
