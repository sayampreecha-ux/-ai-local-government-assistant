import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const sample = { id: 'test-1', documentTitle: 'Synthetic only', documentNumber: 'TEST/001',
  issuingAgency: 'Test Agency', sourceUrl: 'https://example.go.th/sample',
  documentDate: '2026-10-01', status: 'unknown', reviewStatus: 'pending' };
test('manual import writes local review queue but never publishes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gp-circular-'));
  const input = join(dir, 'in.json'), output = join(dir, 'staging.json'), manifest = join(dir, 'registry.json');
  writeFileSync(input, JSON.stringify({ records: [sample] }));
  writeFileSync(manifest, JSON.stringify({ schemaVersion:'1.0', records: [] }));
  const r = spawnSync(process.execPath, ['scripts/circular-watch-import.mjs','--input',input,'--output',output,'--registry',manifest], {encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const result = JSON.parse(readFileSync(output,'utf8'));
  assert.equal(result.publishable,false);
  assert.equal(result.summary.NEW,1);
  assert.equal(result.officialSourceGate.pass,false);
  assert.equal(result.officialSourceGate.decision,'DECISION_LOCK');
  assert.equal(JSON.parse(readFileSync(manifest,'utf8')).records.length,0);
});
test('manual import refuses implicit publish and duplicates', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gp-circular-'));
  const input = join(dir,'in.json');
  writeFileSync(input, JSON.stringify([sample,sample]));
  const r = spawnSync(process.execPath, ['scripts/circular-watch-import.mjs','--input',input,'--output',join(dir,'out.json')], {encoding:'utf8'});
  assert.notEqual(r.status,0);
  const pub = spawnSync(process.execPath, ['scripts/circular-watch-import.mjs','--input',input,'--publish'], {encoding:'utf8'});
  assert.notEqual(pub.status,0);
});
test('CLI hashes actual PDF bytes, rejects mismatch and refuses partial shard comparisons', () => {
  const dir=mkdtempSync(join(tmpdir(),'gp-hash-'));
  const input=join(dir,'in.json'), pdf=join(dir,'original.pdf'), output=join(dir,'queue.json'), manifest=join(dir,'index.json');
  const record={...sample,sourceUrl:'https://www.dla.go.th/test.pdf'};
  writeFileSync(input,JSON.stringify([record]));writeFileSync(pdf,'%PDF-1.4\nSynthetic test bytes only\n%%EOF');
  writeFileSync(manifest,JSON.stringify({records:[],shards:[]}));
  const run=()=>spawnSync(process.execPath,['scripts/circular-watch-import.mjs','--input',input,'--output',output,'--registry',manifest,'--original',pdf],{encoding:'utf8'});
  assert.equal(run().status,0);
  const q=JSON.parse(readFileSync(output,'utf8'));
  assert.match(q.entries[0].record.documentSha256,/^[a-f0-9]{64}$/);
  assert.equal(q.entries[0].lifecycle,'DISCOVERED');
  assert.notEqual(run().status,0,'must not overwrite evidence');
  writeFileSync(input,JSON.stringify([{...record,documentSha256:'a'.repeat(64)}]));
  assert.match(run().stderr,/hash mismatch/);
  writeFileSync(manifest,JSON.stringify({records:[],shards:[{path:'year.json'}]}));
  assert.match(run().stderr,/partial shard/);
});
