import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile("assets/js/core/shared-context.js", "utf8");
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: "shared-context.js" });

const {
  CONTEXT_FIELDS,
  DEFAULT_CONTEXT,
  createSharedContext,
  getMissingContextFields,
  contextToText
} = sandbox.window.GovPromptCore;

assert.deepEqual(Array.from(CONTEXT_FIELDS), [
  "organizationType",
  "owningUnit",
  "domain",
  "currentStage",
  "transactionType",
  "fundingSource",
  "facts",
  "documents",
  "specialFlags",
  "desiredOutput"
]);
assert.equal(Object.isFrozen(CONTEXT_FIELDS), true);
assert.equal(Object.isFrozen(DEFAULT_CONTEXT), true);
assert.equal(Object.isFrozen(DEFAULT_CONTEXT.specialFlags), true);

const input = {
  organizationType: "  เทศบาลนคร  ",
  owningUnit: " สำนักปลัด ",
  domain: " การเงิน ",
  currentStage: " ตรวจเอกสาร ",
  transactionType: " เบิกจ่าย ",
  fundingSource: " งบประมาณรายจ่าย ",
  facts: " ข้อเท็จจริง ",
  documents: " ใบสำคัญ ",
  specialFlags: [" เร่งด่วน ", "", "เร่งด่วน", "ข้ามปี"],
  desiredOutput: " บันทึกเสนอ ",
  ignored: "must not leak"
};
const inputSnapshot = structuredClone(input);
const context = createSharedContext(input);

assert.deepEqual({ ...context, specialFlags: Array.from(context.specialFlags) }, {
  organizationType: "เทศบาลนคร",
  owningUnit: "สำนักปลัด",
  domain: "การเงิน",
  currentStage: "ตรวจเอกสาร",
  transactionType: "เบิกจ่าย",
  fundingSource: "งบประมาณรายจ่าย",
  facts: "ข้อเท็จจริง",
  documents: "ใบสำคัญ",
  specialFlags: ["เร่งด่วน", "ข้ามปี"],
  desiredOutput: "บันทึกเสนอ"
});
assert.deepEqual(input, inputSnapshot);
assert.notEqual(context.specialFlags, input.specialFlags);

const delimitedFlags = createSharedContext({ specialFlags: " เร่งด่วน, ข้ามปี\nรายเดียว;ย้อนหลัง|ร้องเรียน " });
assert.deepEqual(Array.from(delimitedFlags.specialFlags), ["เร่งด่วน", "ข้ามปี", "รายเดียว", "ย้อนหลัง", "ร้องเรียน"]);

for (const invalidInput of [null, undefined, false, 0, "context"]) {
  const result = createSharedContext(invalidInput);
  assert.deepEqual(Object.keys(result), Array.from(CONTEXT_FIELDS));
  assert.deepEqual(Array.from(getMissingContextFields(result)), Array.from(CONTEXT_FIELDS));
}

assert.deepEqual(Array.from(getMissingContextFields({ organizationType: "อบต.", specialFlags: ["เร่งด่วน"] })), [
  "owningUnit",
  "domain",
  "currentStage",
  "transactionType",
  "fundingSource",
  "facts",
  "documents",
  "desiredOutput"
]);

const rendered = contextToText(context);
assert.match(rendered, /^บริบทกลางของงานท้องถิ่น/m);
assert.match(rendered, /- ประเภท อปท\.\/หน่วยงาน: เทศบาลนคร/);
assert.match(rendered, /- กรณีพิเศษ: เร่งด่วน, ข้ามปี/);
assert.doesNotMatch(rendered, /must not leak/);

console.log("Shared Context verification passed.");
