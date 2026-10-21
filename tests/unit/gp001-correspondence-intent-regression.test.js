import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const window = { GovPromptCore: {} };
const sandbox = { window, console, location: { pathname: '/' } };
vm.createContext(sandbox);
for (const file of [
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/output-router.js'
]) vm.runInContext(readFileSync(file, 'utf8'), sandbox, { filename: file });

const cases = [
  ['ร่างหนังสือตอบ สตง. เรื่องการเบิกจ่ายเงิน', 'GP001', 'official-document'],
  ['จัดทำหนังสือหารือจังหวัดเกี่ยวกับถนนชำรุดและข้อกฎหมาย', 'GP001', 'official-document'],
  ['ช่วยร่างหนังสือตอบร้องเรียนถนนพังและการตรวจรับ', 'GP001', 'official-document'],
  ['เขียนหนังสือชี้แจงข้อทักท้วงของ สตง. เกี่ยวกับอำนาจ', 'GP001', 'official-document'],
  ['ร่างบันทึกข้อความรายงานปัญหาถนนให้ผู้บริหาร', 'GP001', 'official-document'],
  ['ตรวจแบบรูปรายการถนน ค.ส.ล. และคำนวณปริมาณ', 'GP007', null],
  ['ถอด BOQ งานก่อสร้างถนน', 'GP007', null],
  ['จัดทำ TOR งานก่อสร้างถนน', 'GP003', null],
  ['วิเคราะห์ข้อกฎหมายเกี่ยวกับอำนาจของจังหวัด', 'GP002', null],
  ['ตรวจสอบภายในเรื่องการเบิกจ่าย', 'GP010', null],
  ['วิเคราะห์หนังสือเวียนว่ามีผลใช้บังคับหรือไม่', 'GP002', null]
];
for (const [question, moduleId, output] of cases) {
  test(question, () => {
    const route = window.GovPromptCore.routeRequest(question);
    assert.equal(route.primaryModule, moduleId);
    if (output) assert.equal(window.GovPromptCore.routeOutput(question, { moduleId: route.primaryModule }).format, output);
  });
}
