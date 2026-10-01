import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const sandbox = {
  window: {
    GovPromptCore: {
      matchOfficialSource: host => host === "moi.go.th"
        ? { tier: "primary", id: "moi" }
        : null
    }
  },
  URL
};

vm.runInNewContext(readFileSync("assets/js/core/evidence-first-v8.js", "utf8"), sandbox);
const engine = sandbox.window.GovPromptCore.EVIDENCE_FIRST_V8;

const verifiedW7508 = {
  title: "หลักเกณฑ์และแนวทางปฏิบัติเกี่ยวกับการใช้รถเพื่อช่วยเหลือประชาชน",
  issuingAgency: "กระทรวงมหาดไทย",
  documentDate: "2018-12-20",
  documentNumber: "ว7508",
  url: "https://moi.go.th/example/w7508",
  primary: true,
  contentVerified: true
};

test("flags a cited circular number that is not supported by verified primary evidence", () => {
  const result = engine.checkAuthorityClaimConsistency(
    "อินโฟอ้าง มท 0808.2/ว 3808 แต่เอกสารต้นฉบับที่ตรวจพบคือ มท 0808.2/ว 7508",
    [verifiedW7508]
  );
  assert.equal(result.checked, true);
  assert.ok(result.claims.some(item => item.documentNumber === "ว3808" && item.status === "CLAIM_NOT_VERIFIED"));
  assert.equal(result.unresolved, true);
});

test("accepts the verified official circular number after correction", () => {
  const result = engine.checkAuthorityClaimConsistency(
    "อ้างหนังสือ มท 0808.2/ว 7508",
    [verifiedW7508]
  );
  assert.deepEqual(result.claims, [
    {
      documentNumber: "ว7508",
      raw: "มท 0808.2/ว 7508",
      matched: true,
      verified: true,
      status: "VERIFIED"
    }
  ]);
  assert.equal(result.unresolved, false);
});

test("locks assurance when an unverified authority claim remains in the user material", () => {
  const result = engine.buildAssuranceAssessment({
    question: "ผู้ป่วยติดเตียงใช้รถ อปท. ได้หรือไม่ ตาม มท 0808.2/ว 3808",
    domain: "legal",
    evidence: {
      documents: [verifiedW7508],
      factsComplete: true,
      authorityConfirmed: true,
      versionConfirmed: true,
      timeConfirmed: true,
      factMatchConfirmed: true,
      laterChangeChecked: true,
      conflictTransitionChecked: true
    }
  });
  assert.equal(result.decisionLock, "ON");
  assert.ok(result.blockers.includes("AUTHORITY_CLAIM_NOT_VERIFIED"));
  assert.equal(result.decidable, false);
});
