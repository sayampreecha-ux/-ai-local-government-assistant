import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadCore() {
  const sandbox = { window: {}, URL, Date, Intl, console, globalThis: {} };
  for (const file of [
    'assets/js/core/source-intelligence.js',
    'assets/js/core/freshness-engine.js',
    'assets/js/core/official-source-registry.js',
    'assets/js/core/citation-engine.js',
    'assets/js/core/official-search-connector.js'
  ]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
  return sandbox.window.GovPromptCore;
}

const cases = [
  ['เบิกค่าเดินทางไปราชการได้อะไรบ้าง','ค่าใช้จ่ายในการเดินทางไปราชการ','ประกาศจัดซื้อจัดจ้าง'],
  ['เบิกค่าเครื่องบินได้ไหม','ค่าโดยสารเครื่องบิน','TOR'],
  ['เบิกค่าโรงแรมได้ไหม','ค่าเช่าที่พัก','ประกาศจัดซื้อ'],
  ['รถเสียระหว่างไปราชการทำอย่างไร','ซ่อมรถราชการ','TOR เช่ารถ'],
  ['ค่าซ่อมรถราชการเบิกได้ไหม','ค่าซ่อมรถราชการ','ค่าเดินทาง'],
  ['ตรวจ TOR ถนน','TOR งานก่อสร้างถนน','ค่าเดินทางไปราชการ'],
  ['ตรวจ TOR จ้างที่ปรึกษา','TOR จ้างที่ปรึกษา','เงินบำรุง'],
  ['ซื้อคอมใช้วิธีไหน','จัดซื้อคอมพิวเตอร์','ค่าเดินทาง'],
  ['จัดซื้ออาหารโรงเรียน','จัดซื้ออาหารโรงเรียน','เบี้ยเลี้ยง'],
  ['เงินบำรุงซื้อวัสดุได้ไหม','การใช้จ่ายเงินบำรุง','TOR'],
  ['รพ.สต.ทำโครงการได้ไหม','อำนาจหน้าที่ รพ.สต. โครงการสาธารณสุข','ประกาศจัดซื้อ'],
  ['ขาดราชการ 16 วันทำไง','วินัย ขาดราชการ','TOR'],
  ['โอนย้ายข้าราชการท้องถิ่น','โอนย้าย ข้าราชการส่วนท้องถิ่น','ค่าเดินทาง'],
  ['เปิดประชุมสภาท้องถิ่น','สมัยประชุมสภาท้องถิ่น','TOR'],
  ['ญัตติงบประมาณทำอย่างไร','ญัตติ งบประมาณ สภาท้องถิ่น','จัดซื้อจัดจ้าง'],
  ['โอนงบทำอย่างไร','โอนงบประมาณ องค์กรปกครองส่วนท้องถิ่น','TOR'],
  ['ตรวจการเบิกเงิน','ตรวจสอบภายใน การเบิกจ่าย','ข่าวประชาสัมพันธ์'],
  ['ถนนพังตรวจรับอย่างไร','มาตรฐานงานทาง ตรวจรับ ถนน','ค่าเดินทาง'],
  ['ร่างหนังสือถึงผู้ว่า','หนังสือราชการ งานสารบรรณ','TOR'],
  ['โพสต์ข่าวประชาสัมพันธ์','ข่าวประชาสัมพันธ์ภาครัฐ','ระเบียบค่าเดินทาง']
];

function officialResult(title, snippet, id) {
  return { title, snippet, url:`https://www.dla.go.th/doc/${id}`, sourceTier:'primary', sourcePriority:100 };
}

test('search ranking v2 benchmark prefers intent-aligned evidence across 20 common local-government queries', async () => {
  const core = await loadCore();
  assert.equal(typeof core.rankOfficialSearchResults, 'function');
  for (const [query, good, bad] of cases) {
    const plan = core.createOfficialSearchPlan(query);
    const ranked = core.rankOfficialSearchResults([
      officialResult(bad, `${bad} เอกสารราชการ`, 'bad'),
      officialResult(good, `${good} หลักเกณฑ์และแนวทางราชการ`, 'good')
    ], plan);
    assert.equal(ranked.length, 2, query);
    assert.equal(ranked[0].title, good, `${query}: irrelevant evidence outranked intent-aligned evidence`);
    assert.ok(ranked[0].queryRelevance >= ranked[1].queryRelevance, `${query}: score ordering invalid`);
  }
});
