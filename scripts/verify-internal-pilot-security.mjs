import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

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
assert.match(privacyGuard, /\\bAN\\b/);
assert.match(privacyGuard, /\\bHN\\b/);
assert.match(home, /sanitizeAttachmentName/);
assert.match(home, /sanitizeExternalContent/);
assert.match(home, /attachments = \[\]/);
assert.match(worker, /SENSITIVE_QUERY_BLOCKED/);
assert.match(worker, /ORIGIN_NOT_ALLOWED/);
assert.match(worker, /RATE_LIMITED/);
assert.match(worker, /REQUEST_TOO_LARGE/);
assert.match(worker, /OFFICIAL_SEARCH_RATE_LIMITER/);
assert.match(worker, /RATE_LIMIT_BINDING_MISSING/);
assert.match(worker, /RATE_LIMIT_CHECK_FAILED/);
assert.match(worker, /include_answer: false/);
assert.match(worker, /include_raw_content: false/);
assert.match(wrangler, /TAVILY_API_KEY/);
assert.match(wrangler, /head_sampling_rate/);

const privacySandbox = {
  window: {},
  document: {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; }
  },
  console
};
vm.runInNewContext(privacyGuard, privacySandbox);
const privacyCore = privacySandbox.window.GovPromptCore;

const answerFirst = 'ตอบแบบ Answer First: สรุปคำตอบที่ใช้ตัดสินใจได้ก่อน';
const answerResult = privacyCore.sanitizeExternalContent(answerFirst);
assert.equal(answerResult.safeText, answerFirst, 'Answer First must never be mistaken for AN patient ID');
assert.equal(answerResult.changed, false, 'Answer First must pass Privacy Guard unchanged');

const anResult = privacyCore.sanitizeExternalContent('AN: ABC123');
assert.equal(anResult.changed, true, 'standalone AN patient ID must still be redacted');
assert.match(anResult.safeText, /รหัสผู้ป่วย \[ปกปิด\]/);

const hnResult = privacyCore.sanitizeExternalContent('HN 123456');
assert.equal(hnResult.changed, true, 'standalone HN patient ID must still be redacted');
assert.match(hnResult.safeText, /รหัสผู้ป่วย \[ปกปิด\]/);

console.log('GovPrompt Internal Pilot security gate: PASS');
