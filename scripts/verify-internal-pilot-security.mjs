import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [index, trust, privacyGuard, home, worker, wrangler] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('trust.html', 'utf8'),
  readFile('assets/js/core/privacy-guard.js', 'utf8'),
  readFile('assets/js/home-v3.js', 'utf8'),
  readFile('src/search-worker.js', 'utf8'),
  readFile('wrangler.jsonc', 'utf8')
]);

assert.match(index, /Internal Pilot/);
assert.match(index, /ห้ามใส่ข้อมูลลับหรือข้อมูลส่วนบุคคลที่ไม่จำเป็น/);
assert.match(index, /GovPromptThailandAI/);
assert.match(trust, /Internal Pilot/);
assert.match(trust, /Tavily/);
assert.match(privacyGuard, /sanitizeExternalContent/);
assert.match(privacyGuard, /sanitizeAttachmentName/);
assert.match(privacyGuard, /externalRequestSent: false/);
assert.match(home, /sanitizeAttachmentName/);
assert.match(home, /sanitizeExternalContent/);
assert.match(home, /attachments = \[\]/);
assert.match(worker, /SENSITIVE_QUERY_BLOCKED/);
assert.match(worker, /ORIGIN_NOT_ALLOWED/);
assert.match(worker, /RATE_LIMITED/);
assert.match(worker, /REQUEST_TOO_LARGE/);
assert.match(worker, /include_answer: false/);
assert.match(worker, /include_raw_content: false/);
assert.match(wrangler, /OFFICIAL_SEARCH_RATE_LIMITER/);
assert.match(wrangler, /TAVILY_API_KEY/);
assert.match(wrangler, /head_sampling_rate/);

console.log('GovPrompt Internal Pilot security gate: PASS');
