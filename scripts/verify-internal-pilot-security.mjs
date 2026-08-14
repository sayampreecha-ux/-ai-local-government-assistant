import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [index, trust, privacyNotice, terms, privacyGuard, submitGuard, home, worker, wrangler] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('trust.html', 'utf8'),
  readFile('privacy-notice.html', 'utf8'),
  readFile('terms.html', 'utf8'),
  readFile('assets/js/core/privacy-guard.js', 'utf8'),
  readFile('assets/js/core/privacy-submit-guard.js', 'utf8'),
  readFile('assets/js/home-v3.js', 'utf8'),
  readFile('src/search-worker.js', 'utf8'),
  readFile('wrangler.jsonc', 'utf8')
]);

assert.match(index, /Public Beta/);
assert.match(index, /ใช้งานฟรี/);
assert.match(index, /ห้ามใส่ข้อมูลลับหรือข้อมูลส่วนบุคคลที่ไม่จำเป็น/);
assert.match(index, /GovPromptThailandAI/);
assert.match(index, /privacy-notice\.html/);
assert.match(index, /terms\.html/);
assert.doesNotMatch(index, /hits\.sh/i);
assert.doesNotMatch(index, /google-analytics|googletagmanager|facebook\.com\/tr|hotjar|clarity\.ms/i);
assert.match(trust, /Public Beta/);
assert.match(privacyNotice, /PUBLIC BETA/);
assert.match(terms, /ไม่ใช่ระบบราชการทางการ/);

assert.match(privacyGuard, /sanitizeExternalContent/);
assert.match(privacyGuard, /sanitizeAttachmentName/);
assert.match(privacyGuard, /externalRequestSent: false/);
assert.match(privacyGuard, /\\bAN\\b/);
assert.match(privacyGuard, /\\bHN\\b/);
assert.match(privacyGuard, /ข้อมูลสุขภาพ/);
assert.match(privacyGuard, /ความคิดเห็นทางการเมือง/);
assert.match(privacyGuard, /ประวัติอาชญากรรม/);
assert.match(submitGuard, /event\.stopImmediatePropagation\(\)/);
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

const guardPos = index.indexOf('assets/js/core/privacy-guard.js');
const submitGuardPos = index.indexOf('assets/js/core/privacy-submit-guard.js');
const homePos = index.indexOf('assets/js/home-v3.js');
assert.ok(guardPos > -1 && submitGuardPos > guardPos && homePos > submitGuardPos, 'Privacy guards must load before Home workflow');

const privacySandbox = {
  window: {},
  document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelector() { return null; } },
  console
};
vm.runInNewContext(privacyGuard, privacySandbox);
const privacyCore = privacySandbox.window.GovPromptCore;

const answerFirst = 'ตอบแบบ Answer First: สรุปคำตอบที่ใช้ตัดสินใจได้ก่อน';
const answerResult = privacyCore.sanitizeExternalContent(answerFirst);
assert.equal(answerResult.safeText, answerFirst);
assert.equal(answerResult.changed, false);
assert.equal(answerResult.blocked, false);

const thaiId = privacyCore.sanitizeExternalContent('โครงการบัตรประชาชนเลขที่3560039645712');
assert.equal(thaiId.changed, true, 'Thai ID must be redacted before processing');
assert.doesNotMatch(thaiId.safeText, /3560039645712/);
assert.match(thaiId.safeText, /ปกปิดเลขประจำตัว/);

for (const sample of [
  'ผู้ป่วยมีผลเลือดผิดปกติ',
  'ข้อมูลศาสนา พุทธ',
  'ความคิดเห็นทางการเมืองของบุคคล',
  'ประวัติอาชญากรรมของนาย ก',
  'ข้อมูลพันธุกรรม DNA',
  'ข้อมูลชีวมิติ ลายนิ้วมือ',
  'รสนิยมทางเพศของบุคคล',
  'สมาชิกสหภาพแรงงาน'
]) {
  const result = privacyCore.sanitizeExternalContent(sample);
  assert.equal(result.blocked, true, `Sensitive data must fail closed: ${sample}`);
}

const anResult = privacyCore.sanitizeExternalContent('AN: ABC123');
assert.equal(anResult.changed, true);
assert.match(anResult.safeText, /รหัสผู้ป่วย \[ปกปิด\]/);
const hnResult = privacyCore.sanitizeExternalContent('HN 123456');
assert.equal(hnResult.changed, true);
assert.match(hnResult.safeText, /รหัสผู้ป่วย \[ปกปิด\]/);

console.log('GovPrompt Public Beta privacy/security gate: PASS');
