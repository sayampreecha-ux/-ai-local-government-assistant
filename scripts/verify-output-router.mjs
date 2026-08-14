import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sandbox = { console }
sandbox.window = sandbox
sandbox.globalThis = sandbox
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path.join(root, 'assets/js/core/output-router.js'), 'utf8'), sandbox, { filename: 'output-router.js' })

const routeOutput = sandbox.GovPromptCore?.routeOutput
assert.equal(typeof routeOutput, 'function', 'routeOutput must be exposed')

const cases = [
  ['เอารายชื่อพวกนี้ทำเป็นตาราง', 'table'],
  ['แปลงข้อมูลนี้เป็น CSV', 'csv'],
  ['ส่งออกข้อมูลเป็น JSON', 'json'],
  ['สรุปรายงานนี้ให้ผู้บริหาร 1 หน้า', 'executive_summary'],
  ['แปลงขั้นตอนนี้เป็น checklist', 'checklist'],
  ['ช่วยเปรียบเทียบเอกสารสองฉบับนี้', 'comparison'],
  ['ช่วยร่างหนังสือขอความอนุเคราะห์', 'official_document'],
  ['ช่วยร่าง TOR ซื้อคอมพิวเตอร์', 'tor'],
  ['ช่วยเขียนโครงการส่งเสริมสุขภาพ', 'project'],
  ['ทำโพสต์ Facebook ประชาสัมพันธ์โครงการ', 'public_content'],
  ['ช่วยเขียน Prompt สำหรับตรวจรายงาน', 'prompt'],
  ['วิเคราะห์ว่าเบิกได้หรือไม่', 'analysis']
]

for (const [query, expected] of cases) {
  const result = routeOutput(query)
  assert.equal(result.id, expected, `${query} -> expected ${expected}, got ${result.id}`)
  assert.ok(result.instructions.length >= 2, `${expected} must include output instructions`)
}

assert.equal(routeOutput('ช่วยตอบเรื่องนี้', { moduleId: 'GP001' }).id, 'official_document')
assert.equal(routeOutput('ช่วยตอบเรื่องนี้', { moduleId: 'GP011' }).id, 'executive_summary')
assert.equal(routeOutput('ช่วยตอบเรื่องนี้', { moduleId: 'GP012' }).id, 'public_content')
assert.equal(routeOutput('ช่วยตอบเรื่องนี้', { moduleId: 'GP005' }).id, 'analysis')

const analysisInstructions = routeOutput('วิเคราะห์ว่าเบิกค่าทำปกได้ไหม', { moduleId: 'GP005' }).instructions.join('\n')
assert.match(analysisInstructions, /เบิกได้ \/ เบิกไม่ได้ \/ มีเงื่อนไข/)
assert.match(analysisInstructions, /ฐานอำนาจ เงื่อนไข เอกสารประกอบ/)
assert.match(analysisInstructions, /ทำได้ \/ ทำไม่ได้ \/ ยังฟันธงไม่ได้/)
assert.match(analysisInstructions, /ดำเนินการได้ \/ มีเงื่อนไข \/ มีความเสี่ยง/)

const torInstructions = routeOutput('ช่วยร่าง TOR ซื้อคอมพิวเตอร์').instructions.join('\n')
assert.match(torInstructions, /เกณฑ์ตรวจรับวัดได้จริง/)
assert.match(torInstructions, /จำกัดการแข่งขัน/)
assert.match(torInstructions, /ต้องตรวจเพิ่มก่อนนำ TOR ไปใช้จริง/)

const documentInstructions = routeOutput('ช่วยร่างหนังสือขออนุเคราะห์').instructions.join('\n')
assert.match(documentInstructions, /ส่งร่างฉบับใช้งานได้ก่อน/)

const projectInstructions = routeOutput('ช่วยเขียนโครงการส่งเสริมสุขภาพ').instructions.join('\n')
assert.match(projectInstructions, /ตรวจฐานอำนาจ แหล่งเงิน กลุ่มเป้าหมาย/)

console.log(`GovPrompt Output Router verification passed: ${cases.length + 4}/${cases.length + 4} + decision-frame assertions`)
