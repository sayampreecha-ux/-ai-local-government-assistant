import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [index, trust, privacyNotice, terms, privacyGuard, home, worker, wrangler] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('trust.html', 'utf8'),
  readFile('privacy-notice.html', 'utf8'),
  readFile('terms.html', 'utf8'),
  readFile('assets/js/core/privacy-guard.js', 'utf8'),
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
assert.doesNotMatch(index, /hits\.sh/i, 'Public Beta home must not call third-party visitor counter');
assert.doesNotMatch(index, /google-analytics|googletagmanager|facebook\.com\/tr|hotjar|clarity\.ms/i, 'Public Beta home must not embed behavioral analytics trackers');

assert.match(trust, /Public Beta/);
assert.match(trust, /ไม่ส่ง Prompt หรือไฟล์ไปยัง ChatGPT\/Gemini อัตโนมัติ/);
assert.match(trust, /third-party visitor counter/);
assert.match(privacyNotice, /PUBLIC BETA/);
assert.match(privacyNotice, /ไม่ฝังตัวนับผู้เข้าชมจากบุคคลที่สาม/);
assert.match(privacyNotice, /ไม่ส่ง Prompt ไปยัง ChatGPT หรือ Gemini โดยอัตโนมัติ/);
assert.match(terms, /ไม่ใช่ระบบราชการทางการ/);
assert.match(terms, /ผู้ใช้เป็นผู้ตัดสินใจส่งข้อมูลต่อเอง/);

assert.match(privacyGuard, /sanitizeExternalContent/);
assert.match(privacyGuard, /sanitizeAttachmentName/);
assert.match(privacyGuard, /externalRequestSent: false/);
assert.match(privacyGuard, /\\bAN\\b/);
assert.match(privacyGuard, /\\bHN\\b/);
assert.match(privacyGuard, /ข้อมูลสุขภาพ/);
assert.match(privacyGuard, /ความคิดเห็นทางการเมือง/);
assert.match(privacyGuard, /ประวัติอาชญากรรม/);
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
const homePos = index.indexOf('assets/js/home-v3.js');
assert.ok(guardPos > -1 && homePos > -1 && guardPos < homePos, 'Privacy Guard must load before Home workflow');

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

console.log('GovPrompt Public Beta privacy/security gate: PASS');
