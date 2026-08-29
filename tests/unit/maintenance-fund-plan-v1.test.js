import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadApi() {
  const source = await readFile('assets/js/features/maintenance-fund-plan-v1.js', 'utf8');
  const context = {
    window: {}, console,
    document: { readyState: 'loading', addEventListener() {} },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    Intl, Date, Math, Number, String, Object, Array, JSON, Blob: class {}, URL: {}, setTimeout() {}
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { api: context.window.GovPromptMaintenanceFundPlan, source };
}

test('maintenance fund planner uses 11 DLA categories and 12 fiscal months', async () => {
  const { api } = await loadApi();
  assert.ok(api);
  assert.equal(api.CATEGORIES.length, 11);
  assert.equal(api.MONTHS.length, 12);
  assert.equal(api.CATEGORIES[0].label, 'ค่ายาและเวชภัณฑ์');
  assert.equal(api.CATEGORIES[4].label, 'ค่าครุภัณฑ์ ที่ดินและสิ่งก่อสร้าง');
  assert.equal(api.CATEGORIES[7].label, 'ค่าจ้างลูกจ้างชั่วคราว');
  assert.equal(api.CATEGORIES[10].label, 'ค่าใช้จ่ายอื่นที่จำเป็นที่เกี่ยวข้องกับการสาธารณสุข');
});

test('planner summarizes plan, commitments, actuals and forecast closing balance', async () => {
  const { api } = await loadApi();
  const plan = api.normalizePlan({
    facility: 'รพ.สต.ทดสอบ', fiscalYear: '2570', openingBalance: '300000', existingCommitments: '20000', reserveAmount: '30000',
    incomes: [
      { id:'i1', source:'ค่าบริการ', amount:'150000', month:'oct', restriction:'' },
      { id:'i2', source:'จัดสรร', amount:'50000', month:'jan', restriction:'ใช้ตามวัตถุประสงค์' }
    ],
    expenses: [
      { id:'e1', category:2, item:'วัสดุ', fundingSource:'maintenance', amount:'100000', month:'nov', committed:'70000', actual:'60000', procurementPlan:true },
      { id:'e2', category:7, item:'ไฟฟ้า', fundingSource:'maintenance', amount:'40000', month:'dec', committed:'40000', actual:'30000' },
      { id:'e3', category:2, item:'วัสดุจากงบ อปท.', fundingSource:'local', amount:'90000', month:'feb' }
    ]
  });
  const s = api.summarize(plan);
  assert.equal(s.opening, 300000);
  assert.equal(s.income, 200000);
  assert.equal(s.plannedMaintenance, 140000);
  assert.equal(s.plannedLocal, 90000);
  assert.equal(s.committed, 110000);
  assert.equal(s.actual, 90000);
  assert.equal(s.availableForPlan, 450000);
  assert.equal(s.forecastClosing, 310000);
});

test('rule engine blocks key audit risks without pretending to approve', async () => {
  const { api } = await loadApi();
  const plan = api.normalizePlan({
    facility:'สอน.ทดสอบ', fiscalYear:'2570', openingBalance:'100000', existingCommitments:'0', reserveAmount:'0', status:'announced',
    incomes:[], audit:{},
    expenses:[
      { id:'c1', category:5, item:'ครุภัณฑ์', fundingSource:'maintenance', amount:'80000', month:'oct', councilApproved:false, procurementPlan:false },
      { id:'t1', category:8, item:'ลูกจ้างชั่วคราว', fundingSource:'maintenance', amount:'60000', month:'nov', linkedTempStaff:false },
      { id:'o1', category:11, item:'ค่าใช้จ่ายอื่น', fundingSource:'maintenance', amount:'20000', month:'dec', justification:'' }
    ]
  });
  const v = api.validatePlan(plan);
  assert.equal(v.severity, 'red');
  const codes = v.alerts.map(item => item.code);
  assert.ok(codes.some(code => code.startsWith('fund-negative')));
  assert.ok(codes.some(code => code.startsWith('capital-council')));
  assert.ok(codes.some(code => code.startsWith('procurement')));
  assert.ok(codes.some(code => code.startsWith('tempstaff')));
  assert.ok(codes.some(code => code.startsWith('other-justification')));
  assert.ok(codes.includes('approved-plan-proof'));
});

test('official matrix separates local budget and maintenance fund and keeps monthly totals', async () => {
  const { api } = await loadApi();
  const matrix = api.buildOfficialMatrix({
    expenses:[
      { id:'a', category:2, item:'A', fundingSource:'maintenance', amount:'100', month:'oct' },
      { id:'b', category:2, item:'B', fundingSource:'local', amount:'200', month:'nov' },
      { id:'c', category:2, item:'C', fundingSource:'maintenance', amount:'50', month:'oct' }
    ]
  });
  const materials = matrix.find(row => row.category === 2);
  assert.equal(materials.maintenanceTotal, 150);
  assert.equal(materials.localTotal, 200);
  assert.equal(materials.months.oct, 150);
  assert.equal(materials.months.nov, 200);
  assert.equal(materials.total, 350);
});

test('feature keeps latest-rule checks, privacy and official sources visible', async () => {
  const { api, source } = await loadApi();
  const page = await readFile('maintenance-fund-plan.html', 'utf8');
  const catalog = await readFile('assets/js/ui/assistant-catalog-accordion-v1.js', 'utf8');
  const mic = await readFile('assets/js/mic.js', 'utf8');
  assert.ok(api.OFFICIAL_SOURCES.some(item => item.url.includes('ratchakitcha.soc.go.th')));
  assert.ok(api.OFFICIAL_SOURCES.some(item => item.url.includes('dla.go.th')));
  assert.match(source, /ตรวจระเบียบ\/หนังสือสั่งการฉบับล่าสุด/);
  assert.match(page, /ไม่ใช่การอนุมัติ/);
  assert.match(page, /ห้ามกรอกชื่อผู้ป่วย/);
  assert.match(source, /ไม่ควรกรอกข้อมูลผู้ป่วย/);
  assert.match(page, /id="maintenanceFundApp"/);
  assert.match(catalog, /แผนและติดตามเงินบำรุง รพ\.สต\.\/สอน\./);
  assert.match(catalog, /maintenance-fund-plan\.html/);
  assert.match(mic, /assistant-catalog-accordion-v1\.js\?v=1\.0\.4/);
});