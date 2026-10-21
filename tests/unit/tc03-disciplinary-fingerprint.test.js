import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const sandbox = { window: {} };
vm.runInNewContext(readFileSync('assets/js/core/prompt-orchestrator.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

const scenarios = [
  ['TC01', 'ป.ป.ช. ชี้มูลวินัย อบจ. เหตุเกิดวันที่ 12 มกราคม 2565 คำวินิจฉัยศาลรัฐธรรมนูญที่ 14/2569', 'อบจ.', '12 มกราคม 2565', '14/2569'],
  ['TC02', 'ป.ป.ช. ไต่สวนวินัย เทศบาล เริ่มไต่สวนวันที่ 5 พฤษภาคม 2566 คำวินิจฉัยศาลรัฐธรรมนูญที่ 9/2568', 'เทศบาล', '5 พฤษภาคม 2566', '9/2568'],
  ['TC03', 'ป.ป.ช. ชี้มูลวินัย อบต. เกิดเหตุวันที่ 20 มีนาคม 2564 คำวินิจฉัยศาลรัฐธรรมนูญที่ 3/2567', 'อบต.', '20 มีนาคม 2564', '3/2567'],
  ['TC04', 'ป.ป.ช. ไต่สวนวินัย เทศบาล พ้นราชการ วันที่ 12 สิงหาคม 2567 คำวินิจฉัยศาลรัฐธรรมนูญที่ 9/2568', 'เทศบาล', '12 สิงหาคม 2567', '9/2568'],
  ['TC05', 'ป.ป.ช. ชี้มูลวินัย อบจ. เมื่อวันที่ 4 เมษายน 2563 คำวินิจฉัยศาลรัฐธรรมนูญที่ 14/2569', 'อบจ.', '4 เมษายน 2563', '14/2569'],
  ['TC06', 'ป.ป.ช. ไต่สวนวินัย อบต. คำวินิจฉัยศาลรัฐธรรมนูญที่ 14/2569', 'อบต.', null, '14/2569']
];

for (const [id, question, org, eventDate, judgment] of scenarios) {
  test(`${id}: organization, event date, judgment and evidence lock`, () => {
    const gate = core.buildCasePrecedentGate(question);
    assert.equal(gate.required, true);
    assert.equal(gate.fingerprint.organization, org);
    if (eventDate) assert.ok(gate.fingerprint.date_context.includes(eventDate), gate.fingerprint.date_context);
    else assert.equal(gate.fingerprint.date_context, '[ต้องระบุวันที่เกิดข้อเท็จจริง]');
    assert.ok(gate.searchQueries.some(query => query.includes(judgment)));
    assert.equal(gate.decisionLock, 'ON');
    assert.notEqual(gate.qualityStatus, 'VERIFIED');
  });
}

test('TC03 no hardcoded judgment in a case without judgment reference', () => {
  const gate = core.buildCasePrecedentGate('ป.ป.ช. ไต่สวนวินัย เทศบาล เหตุเกิดวันที่ 1 มกราคม 2565');
  assert.ok(gate.searchQueries.every(query => !query.includes('14/2569')));
  assert.equal(gate.decisionLock, 'ON');
});
