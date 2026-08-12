import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadRouter() {
  const sandbox = { window: {}, location: { pathname: '/' } };
  for (const file of [
    'assets/js/core/shared-context.js',
    'assets/js/core/prompt-registry.js',
    'assets/js/core/transaction-router.js',
    'assets/js/core/router-regression-overrides.js',
    'assets/js/core/hybrid-intent-classifier.js'
  ]) {
    vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
  }
  return sandbox.window.GovPromptCore;
}

const cases = [
  ['ช่วยร่างหนังสือแจ้งกำหนดลงพื้นที่ตรวจงาน', 'GP001'],
  ['ร่างหนังสือหารือการทำ MOU ระหว่าง อบจ. กับเทศบาล', 'GP001'],
  ['ช่วยร่าง TOR จัดซื้อโดรนดับไฟป่า งบ 1.6 ล้าน', 'GP003'],
  ['ตรวจ TOR นี้ว่ามีความเสี่ยงล็อกสเปกไหม', 'GP003'],
  ['วิธีเฉพาะเจาะจงวงเงิน 497,000 บาททำได้ไหม', 'GP003'],
  ['ไม่มีผู้ยื่น e-bidding ครั้งแรก ต้องทำอย่างไรต่อ', 'GP003'],
  ['เดินทางไปราชการ เบิกค่าแท็กซี่ได้ไหม', 'GP005'],
  ['เบี้ยเลี้ยงค้างคืนคิดยังไง', 'GP005'],
  ['เงินบำรุง รพ.สต. ใช้จัดอบรมผู้สูงอายุได้ไหม', 'GP008'],
  ['ช่วยทำโครงการส่งเสริมอาชีพเกษตรกร', 'GP004'],
  ['ช่วยเขียนหลักการและเหตุผลโครงการทำปุ๋ยอินทรีย์', 'GP004'],
  ['ก.กลางมีอำนาจยกเลิกบัญชีสอบแข่งขันหรือไม่', 'GP002'],
  ['ข้าราชการถูกเพิกถอนคำสั่งบรรจุ จะทำอย่างไร', 'GP006'],
  ['บ้านพักข้าราชการไม่อยู่อาศัยจริง ให้ออกได้ไหม', 'GP006'],
  ['ถนนของ อบจ. น้ำท่วมขาด จะซ่อมฉุกเฉิน 5 แสนทำอย่างไร', 'GP007'],
  ['ตรวจรับถนนแล้วความหนาแน่นดินไม่ผ่าน ต้องทำอย่างไร', 'GP007'],
  ['สภา อบจ. ขอเปิดประชุมวิสามัญต้องดำเนินการอย่างไร', 'GP013'],
  ['ร่างคำกล่าวรายงานพิธีเปิดอบรมเกษตรกร', 'GP011'],
  ['ช่วยทำโพสต์ Facebook ประชาสัมพันธ์โครงการ AI', 'GP012'],
  ['ผมมีไฟล์ TOR ช่วยตรวจให้หน่อย', 'GP003']
];

test('router handles 20 realistic Thai local-government queries', async () => {
  const { routeRequest } = await loadRouter();
  const failures = [];

  for (const [request, expected] of cases) {
    const routed = routeRequest(request, { multiModule: true });
    if (routed.primaryModule !== expected) {
      failures.push({ request, expected, actual: routed.primaryModule, modules: routed.modules, confidence: routed.confidence });
    }
  }

  assert.equal(
    failures.length,
    0,
    `Router mismatches:\n${JSON.stringify(failures, null, 2)}`
  );
});
