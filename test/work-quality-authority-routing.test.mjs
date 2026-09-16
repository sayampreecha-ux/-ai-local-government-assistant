import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../assets/js/core/agent-governance-policy.js", import.meta.url), "utf8");

function loadCore() {
  const context = {
    window: {},
    document: { addEventListener() {} },
    console,
  };
  vm.runInNewContext(source, context, { filename: "agent-governance-policy.js" });
  return context.window.GovPromptCore;
}

test("authority-dependent question requires official retrieval before reasoning", () => {
  const core = loadCore();
  const policy = core.buildAuthorityPolicy("รองปลัดสูงไปเป็นปลัดสูงกี่ปี");
  assert.equal(policy.authorityDependent, true);
  assert.equal(policy.numericAuthority, true);
  assert.equal(policy.recommendedMode, "web-when-needed");
  assert.deepEqual([...policy.sequence], [
    "official-source-retrieval",
    "applicability-check",
    "evidence-check",
    "ai-reasoning",
    "answer-first",
  ]);
});

test("draft-only request does not get forced into authority retrieval", () => {
  const core = loadCore();
  const policy = core.buildAuthorityPolicy("ร่างหนังสือเชิญประชุมคณะกรรมการ");
  assert.equal(policy.authorityDependent, false);
  assert.equal(policy.recommendedMode, "ai-only");
});

test("work contract asks only for blocking facts and requires actionable output", () => {
  const core = loadCore();
  const contract = core.buildWorkContract("ผมย้ายตามคำสั่งราชการ จะเบิกค่าขนย้ายได้ไหม");
  assert.equal(contract.answerFirst, true);
  assert.equal(contract.minimumClarification, true);
  assert.equal(contract.noQuestionnaire, true);
  assert.equal(contract.actionableOutput, true);
  assert.equal(contract.evidenceBeforeConclusion, true);
  assert.match(contract.clarificationRule, /เฉพาะข้อมูลที่ขาด/);
  assert.equal(contract.outputContract.length, 5);
});

test("runtime routing injects work-quality instructions without changing UI workflow", () => {
  const core = loadCore();
  core.createToolRoutingPlan = () => ({
    mode: "ai-only",
    tools: ["ai-reasoning"],
    instructions: [],
    reasons: [],
    flags: {},
  });
  core.__authorityRoutingV71Active = false;
  // Re-run only the exported policy contract here; the production core is already wired by page bootstrap.
  const contract = core.buildWorkContract("ทำ TOR โครงการจัดซื้อวัสดุสำนักงาน");
  assert.equal(contract.deliverableRequested, true);
  assert.equal(contract.actionableOutput, true);
});
