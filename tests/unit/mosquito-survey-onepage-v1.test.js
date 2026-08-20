import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadTool() {
  const sandbox = { window: {} };
  const source = await readFile('assets/js/features/mosquito-survey-onepage-v1.js', 'utf8');
  vm.runInNewContext(source, sandbox, { filename: 'mosquito-survey-onepage-v1.js' });
  return sandbox.window.GovPromptMosquitoOnepage;
}

test('calculates Chiang Yuen HI and CI totals exactly', async () => {
  const tool = await loadTool();
  const hi = tool.parseHI(`
หมู่ 1 | บ้านหนองศิริราษฎ์หมากหญ้า | 40 | 5
หมู่ 2 | บ้านโนนงิ้ว | 40 | 3
หมู่ 3 | บ้านเชียงยืน | 40 | 6
หมู่ 4 | บ้านเชียงยืน | 40 | 3
หมู่ 5 | บ้านเชียงยืน | 40 | 4
หมู่ 6 | บ้านโคกสูง | 40 | 2
หมู่ 7 | บ้านหนองมะเม้า | 40 | 1
หมู่ 9 | บ้านหนองแวง | 40 | 8
หมู่ 10 | บ้านหนองศิริราษฎ์ | 40 | 7
หมู่ 11 | บ้านเหล่าศรีเชียงเหนือ | 40 | 7
หมู่ 12 | บ้านโนนหินแห่ | 40 | 4
หมู่ 13 | บ้านหนองโปร่ง | 40 | 3
หมู่ 14 | บ้านโคกสูง | 40 | 2
หมู่ 15 | บ้านโคกสูง | 40 | 7
หมู่ 16 | บ้านเชียงยืน | 40 | 8
หมู่ 17 | บ้านสร้างแก้ว | 40 | 6
หมู่ 18 | บ้านเชียงยืน | 40 | 5
หมู่ 19 | บ้านเชียงยืน | 40 | 9
`);
  const ci = tool.parseCI(`
วัดนิคมสะอาด หมู่ 6 | 15 | 1
วัดกลางเชียงยืน หมู่ 18 | 22 | 4
วัดปัจจิมเชียงยืน หมู่ 3 | 32 | 6
`);

  assert.deepEqual([...hi.errors], []);
  assert.deepEqual([...ci.errors], []);
  const hiSummary = tool.summarize(hi.rows);
  const ciSummary = tool.summarize(ci.rows);
  assert.equal(hiSummary.surveyed, 720);
  assert.equal(hiSummary.found, 90);
  assert.equal(tool.fmt(hiSummary.rate), '12.50%');
  assert.equal(hiSummary.max.villageNo, 19);
  assert.equal(tool.fmt(hiSummary.max.rate), '22.50%');
  assert.equal(ciSummary.surveyed, 69);
  assert.equal(ciSummary.found, 11);
  assert.equal(tool.fmt(ciSummary.rate), '15.94%');
  assert.equal(ciSummary.max.place, 'วัดปัจจิมเชียงยืน หมู่ 3');
  assert.equal(tool.fmt(ciSummary.max.rate), '18.75%');
});

test('accepts natural Thai survey lines and rejects impossible counts', async () => {
  const tool = await loadTool();
  const hi = tool.parseHI('หมู่ที่ 1 บ้านตัวอย่าง สำรวจ 40 หลังคาเรือน พบ 5 หลังคาเรือน');
  const ci = tool.parseCI('วัดตัวอย่างหมู่ 1 สำรวจ 20 ภาชนะ พบ 3 ภาชนะ');
  assert.equal(hi.rows.length, 1);
  assert.equal(ci.rows.length, 1);
  assert.equal(tool.fmt(hi.rows[0].rate), '12.50%');
  assert.equal(tool.fmt(ci.rows[0].rate), '15.00%');

  const invalid = tool.parseHI('หมู่ 1 | บ้านผิดข้อมูล | 10 | 12');
  assert.equal(invalid.rows.length, 0);
  assert.equal(invalid.errors.length, 1);
});

test('prompt is reusable and blocks invented official details', async () => {
  const tool = await loadTool();
  const hi = tool.parseHI('หมู่ 1 | บ้านตัวอย่าง | 40 | 5');
  const ci = tool.parseCI('วัดตัวอย่าง | 20 | 3');
  const prompt = tool.buildPrompt({
    agency: 'รพ.สต.ตัวอย่าง',
    area: 'ตำบลตัวอย่าง',
    period: 'มิถุนายน 2569',
    theme: 'เขียว ขาว ฟ้า',
    logoName: 'logo.png'
  }, hi.rows, ci.rows);

  assert.match(prompt, /รพ\.สต\.ตัวอย่าง/);
  assert.match(prompt, /logo\.png/);
  assert.match(prompt, /12\.50%/);
  assert.match(prompt, /15\.00%/);
  assert.match(prompt, /ห้ามสร้างหรือเติมเบอร์โทร เว็บไซต์ ที่อยู่ สโลแกน ตราราชการ/);
  assert.match(prompt, /ห้ามเพิ่มข้อมูลผู้ป่วยหรือข้อมูลส่วนบุคคล/);
});
