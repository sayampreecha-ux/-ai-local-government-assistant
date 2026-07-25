import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SESSION_SECRET='member-session-secret-'.padEnd(64,'x');
process.env.ADMIN_SESSION_SECRET='admin-session-secret-'.padEnd(64,'y');
process.env.ADMIN_SECRET='admin-password-for-tests';
process.env.IP_HASH_SECRET='ip-hash-secret-'.padEnd(64,'z');
const security=await import('../lib/security.mjs');

test('normalizeCode removes spaces and uppercases',()=>assert.equal(security.normalizeCode(' gp222-ab 12 '),'GP222-AB12'));
test('default access code follows Starter format',()=>{const code=security.generateAccessCode();assert.match(code,/^GP222-[A-HJ-NP-Z2-9]{8}$/);assert.equal(security.maskCode(code).startsWith('GP222-'),true);});
test('package access code supports custom prefix',()=>assert.match(security.generateAccessCode('GP599'),/^GP599-[A-HJ-NP-Z2-9]{8}$/));
test('hashCode is stable and does not expose source',()=>{const code='GP222-ABCDEFGH';const hash=security.hashCode(code);assert.equal(hash,security.hashCode(code));assert.notEqual(hash,code);assert.match(hash,/^[a-f0-9]{64}$/);});
test('member session verifies only as member',()=>{const token=security.signSession({codeId:'123',exp:Date.now()+60000});assert.equal(security.verifySession(token)?.codeId,'123');assert.equal(security.verifySession(token,'admin'),null);});
test('admin session verifies only as admin',()=>{const token=security.signSession({role:'admin',exp:Date.now()+60000},'admin');assert.equal(security.verifySession(token,'admin')?.role,'admin');assert.equal(security.verifySession(token),null);});
test('proof session has separate kind',()=>{const token=security.signSession({requestRef:'REQ-1',exp:Date.now()+60000},'proof');assert.equal(security.verifySession(token,'proof')?.requestRef,'REQ-1');assert.equal(security.verifySession(token),null);});
test('expired and tampered sessions are rejected',()=>{const expired=security.signSession({exp:Date.now()-1});assert.equal(security.verifySession(expired),null);const valid=security.signSession({exp:Date.now()+60000});assert.equal(security.verifySession(`${valid}x`),null);});
test('admin secret comparison works',()=>{assert.equal(security.verifyAdminSecret('admin-password-for-tests'),true);assert.equal(security.verifyAdminSecret('wrong'),false);});
test('cleanText strips controls and enforces length',()=>assert.equal(security.cleanText('A\u0000B\nC',4),'A B'));
test('request reference has date and random suffix',()=>assert.match(security.generateRequestRef(),/^REQ-\d{6}-[A-F0-9]{6}$/));


test("envFlag understands safe boolean values", () => {
  const before = process.env.SALES_ENABLED;
  process.env.SALES_ENABLED = "true";
  assert.equal(security.envFlag("SALES_ENABLED"), true);
  process.env.SALES_ENABLED = "false";
  assert.equal(security.envFlag("SALES_ENABLED"), false);
  if (before === undefined) delete process.env.SALES_ENABLED; else process.env.SALES_ENABLED = before;
});
