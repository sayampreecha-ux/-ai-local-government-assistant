import test from "node:test";
import assert from "node:assert/strict";
import {
  applyPromptStandard,
  buildQualityGate,
  classifyRisk,
  requiresDecisionGate
} from "../../lib/prompt-standard-v7.1.mjs";

test("classifies government financial/personnel/procurement questions as HIGH", () => {
  assert.equal(classifyRisk("บรรจุครบ 8 เดือนมีสิทธิได้โบนัสไหม"), "HIGH");
  assert.equal(classifyRisk("ค่าทำปกเบิกได้ไหม"), "HIGH");
  assert.equal(classifyRisk("TOR ระบุยี่ห้อได้ไหม"), "HIGH");
});

test("detects decision questions", () => {
  assert.equal(requiresDecisionGate("มีสิทธิได้โบนัสไหม"), true);
  assert.equal(requiresDecisionGate("ช่วยร่างคำกล่าวเปิดงาน"), false);
});

test("decision gate prevents single-condition conclusions", () => {
  const gate = buildQualityGate({ question: "บรรจุครบ 8 เดือนมีสิทธิได้โบนัสไหม" });
  assert.match(gate, /ต้องตรวจเงื่อนไขสาระสำคัญให้ครบ/);
  assert.match(gate, /ผ่านเฉพาะเงื่อนไข/);
  assert.match(gate, /หลักฐานยังไม่พอที่จะฟันธง/);
});

test("high-risk gate requires official source and effective-date checks", () => {
  const gate = buildQualityGate({ question: "เงินบำรุง รพ.สต. ใช้ได้ไหม" });
  assert.match(gate, /Official Source/);
  assert.match(gate, /Freshness\/Effective Date/);
  assert.match(gate, /Multi-condition/);
});

test("standard is additive and preserves base prompt", () => {
  const base = "บทบาท\nคุณเป็นผู้ช่วยงานราชการไทยด้านงานบุคคล";
  const output = applyPromptStandard(base, { question: "มีสิทธิได้โบนัสไหม" });
  assert.ok(output.startsWith(base));
  assert.match(output, /มาตรฐานควบคุมคุณภาพ GovPrompt v7\.1/);
});
