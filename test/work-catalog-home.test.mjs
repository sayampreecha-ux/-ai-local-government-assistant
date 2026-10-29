import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');

test('home preserves twelve core categories plus the revenue category without another-work opener', () => {
  const orderBlock = source.match(/const CATALOG_ORDER = Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
  const ids = [...orderBlock.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(ids, [
    'pr', 'records', 'audit', 'finance', 'revenue', 'planning', 'procurement',
    'hr', 'executive', 'engineering', 'health', 'education', 'council'
  ]);
  assert.match(source, /งานจัดเก็บรายได้มีตัวอย่างคำถาม 8 เรื่อง/);
  assert.match(source, /quickActions\.replaceChildren\(buildCatalog\(\)\)/);
  assert.doesNotMatch(source, /data-work-catalog-open|งานอื่น ๆ/);
});

test('one-page catalog covers core local-government domains', () => {
  for (const title of [
    'บริหารและผู้บริหาร', 'สารบรรณและหนังสือราชการ', 'แผน โครงการ และงบประมาณ',
    'พัสดุและจัดซื้อจัดจ้าง', 'การเงิน การคลัง และเบิกจ่าย', 'งานบุคคล',
    'งานช่างและวิศวกรรม', 'สภาท้องถิ่น', 'สาธารณสุขและ รพ.สต.',
    'การศึกษา เยาวชน และการอบรม', 'ประชาสัมพันธ์และสื่อสาร', 'กฎหมาย ระเบียบ และตรวจสอบ'
  ]) assert.match(source, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /ค้นและวิเคราะห์กฎหมาย \/ ระเบียบ/);
  assert.match(source, /section\.dataset\.categoryId = category\.id/);
});

test('catalog selections open the dedicated result route without bypassing the Home runner', () => {
  assert.match(source, /button\.dataset\.prompt = task\.prompt/);
  assert.match(source, /openResultPage\(button\.dataset\.tortIntent === 'true' \? 'งานความรับผิดทางละเมิดของเจ้าหน้าที่ อปท\.' : prompt/);
  assert.match(source, /sessionStorage\.setItem\(RESULT_PROMPT_KEY, value\)/);
  assert.match(source, /window\.location\.assign\(target\.toString\(\)\)/);
  assert.doesNotMatch(source, /submitPrompt\s*\(/);
});

test('work catalog adds no durable persistence or network channel', () => {
  assert.doesNotMatch(source, /\b(localStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(source, /\b(fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon)\b/);
});

test('catalog is mobile and accessibility aware', () => {
  assert.match(source, /button\.type = 'button'/);
  assert.match(source, /@media\(max-width:620px\)/);
  assert.match(source, /work-catalog-heading/);
});

// Exercise the existing production verifier's catalog assertions without starting a browser.
const productionVerifier = readFileSync('scripts/verify-public-health-home-production-e2e.mjs', 'utf8');
const catalogAssertions = productionVerifier.slice(
  productionVerifier.indexOf('const expectedHomeCategories ='), productionVerifier.indexOf('const frontend ='));
const { assertHomeCategories, expectedHomeCategories } = new Function('assert',
  catalogAssertions + '\nreturn { assertHomeCategories, expectedHomeCategories };')(assert);

test('production catalog proof matches approved source IDs, names and order', () => {
  const order = source.match(/const CATALOG_ORDER = Object\.freeze\(\[([\s\S]*?)\]\);/)[1];
  const catalog = source.match(/const WORK_CATALOG = Object\.freeze\(\[([\s\S]*?)\n  \]\);/)[1];
  const actual = new Function(
    'const order=['+order+']; const catalog=['+catalog+']; return order.map(id => ({id, title:catalog.find(c => c.id===id).title}));')();
  assertHomeCategories(actual);
  assert.equal(actual.length, 13);
  assert.ok(productionVerifier.includes("catalog.locator('.work-catalog-group:not([data-assistance-route])').evaluateAll"));
  assert.ok(productionVerifier.includes('assertHomeCategories(homeCategories)'));
  assert.match(source, /renderCategory\(categories\.get\('assistance'\), 0\)/);
});

test('production catalog proof rejects missing, extra, duplicate, reordered and renamed categories', () => {
  const copy = () => expectedHomeCategories.map(category => ({...category}));
  const missing = copy(); missing.splice(4,1);
  const extra = copy(); extra.push({id:'unexpected', title:'Unexpected'});
  const duplicate = copy(); duplicate[4] = {...duplicate[3]};
  const reordered = copy(); [reordered[0],reordered[1]] = [reordered[1],reordered[0]];
  const renamed = copy(); renamed[4].title += ' changed';
  for (const [name, actual] of Object.entries({missing,extra,duplicate,reordered,renamed}))
    assert.throws(() => assertHomeCategories(actual), {name:'AssertionError'}, name+' must block production proof');
});


test('single legal-category tort Level-1 button preserves HR discipline entry and 13 categories', () => {
  const audit = source.split("id: 'audit', title: 'กฎหมาย ระเบียบ และตรวจสอบ'")[1]?.split("\n      ])\n    })")[0] || '';
  const hr = source.split("id: 'hr', title: 'งานบุคคล'")[1]?.split("id: 'engineering'")[0] || '';
  assert.match(audit, /label: '⚖️ งานความรับผิดทางละเมิด', tortIntent: true, prompt:/);
  assert.doesNotMatch(audit, /fillOnly: true/);
  assert.equal((source.match(/label: '⚖️ งานความรับผิดทางละเมิด'/g) || []).length, 1);
  assert.match(hr, /label: '⚖️ วินัย \/ ละเมิด'/);
  assert.match(hr, /label: 'งานวินัย', disciplineIntent: true/);
  assert.match(hr, /label: 'งานความรับผิดทางละเมิด', tortIntent: true/);
  assert.doesNotMatch(hr, /label: '⚖️ งานความรับผิดทางละเมิด'/);
  assert.match(audit, /งานความรับผิดทางละเมิดของเจ้าหน้าที่ อปท. \(ทุกประเภทเหตุ\)/);
  assert.match(audit, /โปรดให้ผู้ใช้เล่าเหตุการณ์จริง/);
  assert.doesNotMatch(audit, /กรณีรถราชการชนหรือเสียหายระหว่าง/);
  assert.match(audit, /ร่างเอกสารงานละเมิดระดับ 1 ทั้ง 7 ส่วน/);
  assert.match(audit, /UNVERIFIED/);
  assert.match(audit, /Decision Lock ว66\/ว141/);
  assert.match(audit, /ปกปิดข้อมูลส่วนบุคคล/);
  assert.match(source, /button\.dataset\.prompt = task\.prompt/);
  assert.match(source, /openResultPage\(button\.dataset\.tortIntent === 'true' \? 'งานความรับผิดทางละเมิดของเจ้าหน้าที่ อปท\.' : prompt/);
});

test('tort action reuses live Level-1 handoff guard without changing the composer', () => {
  const home = readFileSync('assets/js/home-v3.js', 'utf8');
  assert.match(home, /function completeTortLevel1Handoff\(prompt, request\)/);
  assert.match(home, /GP_TORT_LEVEL1_HANDOFF_V1/);
  assert.match(home, /ห้ามออกคำสั่งเรียกชดใช้/);
  assert.match(home, /ว66\/ว141/);
  assert.match(home, /promptBundle\.prompt, originalRequest/);
});


test('tort Level-1 safety acceptance locks unverified appointment, inquiry and false file claims', () => {
  const home = readFileSync('assets/js/home-v3.js', 'utf8');
  const start = home.indexOf('function completeTortLevel1Handoff(');
  const end = home.indexOf('function completeDocumentHandoff(', start);
  assert.ok(start >= 0 && end > start);
  const contract = home.slice(start, end);
  for (const required of [
    'SAFETY ACCEPTANCE ส่วนที่ 4',
    'ก่อนเสนอการดำเนินการตามขั้นตอนของกฎหมายต่อไป',
    'SAFETY ACCEPTANCE ส่วนที่ 5',
    'แบบข้อมูลประกอบการพิจารณาจัดทำคำสั่งแต่งตั้งคณะกรรมการ',
    'Authority Gate ยังไม่ VERIFIED',
    'ห้ามแสดงรูปแบบคำสั่ง',
    'SAFETY ACCEPTANCE ส่วนที่ 6',
    '[ยังไม่ได้ดำเนินการ]',
    'FALSE FILE COMPLETION GUARD',
    'ไฟล์/ลิงก์ที่ตรวจสอบได้',
    'FINAL NEGATIVE REVIEW',
    'Decision Lock:',
    'Human Review',
  ]) assert.ok(contract.includes(required), 'missing tort safety contract: '+required);
  assert.match(home, /input\.value = tortIntent \? '' : pendingPrompt/);
  assert.match(home, /explicitTortIntent \? 'งานความรับผิดทางละเมิดของเจ้าหน้าที่ อปท\./);
});


test('explicit tort quick action pins the full legal module route, not only transaction type', () => {
  const home = readFileSync('assets/js/home-v3.js', 'utf8');
  const routeBlock = home.match(/const route = explicitTort \? Object\.freeze\(\{([\s\S]*?)\}\) : detectedRoute;/)?.[1] || '';
  assert.ok(routeBlock, 'explicit tort route override missing');
  for (const expected of [
    "moduleId: 'GP002'",
    "moduleId === 'GP002'",
    "transactionType: 'legal'",
    "modules: Object.freeze(['GP002'])",
    "reason: 'explicit-legal-tort-quick-action'"
  ]) assert.ok(routeBlock.includes(expected), 'missing explicit legal route property: ' + expected);
  assert.match(home, /const detectedRoute = core\.routeTransaction\(context\)/);
  assert.match(home, /const route = explicitTort \?/);
  assert.match(home, /: detectedRoute;/);
});

test('explicit tort output is a seven-part document without changing generic legal analysis', () => {
  const output = readFileSync('assets/js/core/output-router.js', 'utf8');
  assert.match(output, /route\?\.reason === 'explicit-legal-tort-quick-action'/);
  assert.match(output, /id: 'tort-level1-document'/);
  assert.match(output, /format: 'official-document'/);
  assert.match(output, /Authority UNVERIFIED/);
  assert.match(output, /if \(\['GP002', 'GP003'/);
});

test('tort handoff includes a complete official retrieval question and preserves reported rear-end collision', () => {
  const home = readFileSync('assets/js/home-v3.js', 'utf8');
  const start = home.indexOf('function completeTortLevel1Handoff(');
  const end = home.indexOf('function completeDocumentHandoff(', start);
  const contract = home.slice(start, end);
  for (const term of ['RETRIEVAL QUERY', 'การสอบข้อเท็จจริง', 'การซ่อมรถราชการ', 'ความเสียหายของรถคู่กรณี', 'อำนาจแต่งตั้งคณะกรรมการ', 'ชนท้าย', 'เฉี่ยวชน', 'Decision Lock']) {
    assert.ok(contract.includes(term), 'missing tort handoff term: ' + term);
  }
});

test('official source planning receives the legal module from the active transaction route', () => {
  const home = readFileSync('assets/js/home-v3.js', 'utf8');
  const connector = readFileSync('assets/js/core/official-search-connector.js', 'utf8');
  assert.match(home, /officialSearchConnector\.search\(text, \{ module: route\?\.moduleId, count: 10, requireFreshness: true \}\)/);
  assert.match(connector, /GP002: 'กฎหมาย ระเบียบ หนังสือสั่งการ ฐานอำนาจ/);
  assert.match(connector, /originalQuery,/);
  assert.match(connector, /routedModules: module \? \[module\] : \[\]/);
});

test('tort release contract: ten executable output and search scenarios', async () => {
  const vm = await import('node:vm');
  const window = { GovPromptCore: {} };
  const context = vm.createContext({ window });
  vm.runInContext(readFileSync('assets/js/core/output-router.js', 'utf8'), context);
  vm.runInContext(readFileSync('assets/js/core/official-search-connector.js', 'utf8'), context);
  const route = { moduleId: 'GP002', reason: 'explicit-legal-tort-quick-action' };
  const genericLegal = { moduleId: 'GP002', reason: 'ordinary-legal-question' };
  const samples = [
    'รถราชการชนท้ายรถคู่กรณีระหว่างไปปฏิบัติราชการ',
    'สอบละเมิดกรณีรถราชการเสียหาย',
    'ขอขั้นตอนซ่อมรถราชการ',
    'ตรวจสอบความเสียหายของรถคู่กรณี',
    'ใครมีอำนาจแต่งตั้งคณะกรรมการสอบละเมิด',
    'แบบรายงานสอบสวนยังไม่มีพยานหลักฐาน',
    'คำสั่งมอบหมายหน้าที่ขับรถรอตรวจสอบ',
    'บันทึกตำรวจระบุประมาทแต่ยังไม่ตรวจเอกสาร',
    'ตรวจสอบ ว66/ว141 และ Decision Lock',
    'ขอข้อกฎหมายที่ใช้บังคับก่อนดำเนินการ'
  ];
  for (const [index, question] of samples.entries()) {
    const output = window.GovPromptCore.routeOutput(question, route, { facts: question });
    assert.equal(output.id, 'tort-level1-document', 'output case ' + (index+1));
    assert.equal(output.format, 'official-document');
    assert.ok(output.instructions.some(s => s.includes('7 ส่วน')));
    assert.ok(output.instructions.some(s => s.includes('Authority UNVERIFIED')));
    const plan = window.GovPromptCore.createOfficialSearchPlan(question, { module: route.moduleId });
    assert.equal(plan.originalQuery, question, 'original question case ' + (index+1));
    assert.equal(plan.routedModules[0], 'GP002');
    assert.ok(plan.query.includes(question), 'untruncated original case ' + (index+1));
    assert.ok(plan.query.includes('ฐานอำนาจ'), 'official legal hint case ' + (index+1));
    assert.ok(!plan.query.includes('จัดซื้อจัดจ้าง พัสดุภาครัฐ'), 'no procurement hint case ' + (index+1));
  }
  assert.notEqual(window.GovPromptCore.routeOutput('ขอวิเคราะห์ข้อกฎหมายทั่วไป', genericLegal, {}).id, 'tort-level1-document');
  const procurement = window.GovPromptCore.createOfficialSearchPlan('ขอจัดซื้อวัสดุ', { module: 'GP003' });
  assert.ok(procurement.query.includes('จัดซื้อจัดจ้าง พัสดุภาครัฐ'));
});

test('HR discipline/tort menu uses existing choice flow without adding a category', () => {
  assert.match(source, /label: '⚖️ วินัย \/ ละเมิด'/);
  assert.match(source, /label: 'งานวินัย'/);
  assert.match(source, /label: 'งานความรับผิดทางละเมิด'/);
  const hrBlock = source.split("id: 'hr', title: 'งานบุคคล'")[1]?.split("id: 'engineering'")[0] || '';
  assert.match(hrBlock, /choices: Object\.freeze\(\[/);
  assert.match(source, /function openTaskChoices\(button\)/);
  assert.match(source, /button\.dataset\.taskChoices = JSON\.stringify\(task\.choices\)/);
  assert.match(hrBlock, /disciplineIntent: true/);
  assert.match(hrBlock, /tortIntent: true/);
  assert.match(source, /item\.dataset\.tortIntent = 'true'/);
  assert.match(source, /item\.dataset\.disciplineIntent = 'true'/);
});
