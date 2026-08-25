import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const frontendPath = 'assets/js/core/document-studio-v1.js';
const workerPath = 'src/search-worker-v2.js';

async function text(path) { return readFile(path, 'utf8'); }

for (const path of [frontendPath, workerPath]) {
  test(`${path} passes syntax check`, () => {
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
}

test('frontend provides the complete in-app document workflow', async () => {
  const source = await text(frontendPath);
  assert.match(source, /Document Studio/);
  assert.match(source, /จัดหน้าเอกสาร/);
  assert.match(source, /\/api\/document-studio\/convert/);
  assert.match(source, /\/api\/document-studio\/compose/);
  assert.match(source, /Word \(\.docx\)/);
  assert.match(source, /PowerPoint \(\.pptx\)/);
  assert.match(source, /data-download="pdf"/);
  assert.match(source, /Privacy Checkpoint/);
  assert.match(source, /Cloudflare Workers AI/);
  assert.match(source, /SENSITIVE_PATTERNS/);
  assert.match(source, /DecompressionStream/);
  assert.match(source, /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/);
  assert.match(source, /application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation/);
});

test('worker converts documents and composes structured output with Workers AI', async () => {
  const source = await text(workerPath);
  assert.match(source, /env\.AI\.toMarkdown/);
  assert.match(source, /env\.AI\.run/);
  assert.match(source, /@cf\/meta\/llama-3\.3-70b-instruct-fp8-fast/);
  assert.match(source, /\/api\/document-studio\/convert/);
  assert.match(source, /\/api\/document-studio\/compose/);
  assert.match(source, /PRIVACY_CONFIRMATION_REQUIRED/);
  assert.match(source, /SENSITIVE_DOCUMENT_BLOCKED/);
  assert.match(source, /promptInjectionTreatedAsDocumentData/);
  assert.match(source, /humanReviewRequired: true/);
  assert.match(source, /MAX_DOCUMENT_BYTES = 10 \* 1024 \* 1024/);
});

test('wrangler binds Workers AI and build ships the browser module', async () => {
  const wrangler = await text('wrangler.jsonc');
  const build = await text('scripts/build-static.mjs');
  assert.match(wrangler, /"ai"\s*:\s*\{[\s\S]*"binding"\s*:\s*"AI"/);
  assert.match(build, /document-studio-v1\.js/);
  assert.match(build, /Document Studio release script missing/);
});
