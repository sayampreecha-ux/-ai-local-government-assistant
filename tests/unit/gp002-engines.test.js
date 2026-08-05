import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAuthority } from "../../src/modules/gp002/authority-engine.js";
import { buildCitations } from "../../src/modules/gp002/citation-engine.js";
import { detectConflicts } from "../../src/modules/gp002/conflict-engine.js";
import { reasonLegally } from "../../src/modules/gp002/reasoning-engine.js";
import { assessRisk } from "../../src/modules/gp002/risk-engine.js";
import { buildTimeline } from "../../src/modules/gp002/timeline-engine.js";
import { detectPersonalData, maskPersonalData } from "../../src/modules/gp002/PDPA-engine.js";
import { formatGP002Output } from "../../src/modules/gp002/output-engine.js";
import { validateGP002Input, validateGP002Output } from "../../src/modules/gp002/validator.js";
import { GP002_KNOWLEDGE } from "../../src/modules/gp002/knowledge/index.js";
import { GP002_TEMPLATES } from "../../src/modules/gp002/templates/index.js";

const entry = (overrides = {}) => ({
  id: "law-a",
  type: "law",
  title: "Act A",
  reference: "official://act-a",
  metadata: {
    source: "Gazette", authority: "Parliament", version: "2", effectiveDate: "2025-01-01",
    category: "administration", tags: ["administration"], language: "th", confidence: 0.95,
    hierarchy: 100, status: "effective", ...overrides.metadata,
  },
  ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== "metadata")),
});

test("ranks authority and identifies competent agency, delegation, and jurisdiction", () => {
  const result = analyzeAuthority([entry(), entry({ id: "rule-b", metadata: { hierarchy: 50, authority: "Agency" } })]);
  assert.equal(result.primaryAuthority.knowledgeId, "law-a");
  assert.deepEqual(result.competentAgencies, ["Parliament", "Agency"]);
  assert.equal(result.delegationStatus, "requires-verification");
});

test("ranks and cross-references valid citations", () => {
  const result = buildCitations([entry(), entry({ id: "law-b", reference: "official://b", metadata: { hierarchy: 80 } })]);
  assert.equal(result.valid, true);
  assert.equal(result.citations[0].id, "law-a");
  assert.deepEqual(result.citations[0].crossReferences, ["law-b"]);
});

test("detects temporal and hierarchy conflicts", () => {
  const conflicts = detectConflicts([
    entry(),
    entry({ id: "old-rule", metadata: { version: "1", effectiveDate: "2020-01-01", hierarchy: 50 } }),
  ]);
  assert.equal(conflicts[0].newer, "law-a");
  assert.equal(conflicts[0].higherAuthority, "law-a");
  assert.equal(conflicts[0].resolution, "newer-and-higher-prevails");
});

test("produces deterministic legal reasoning fields", () => {
  const citations = buildCitations([entry()]);
  const authority = analyzeAuthority([entry()]);
  const result = reasonLegally({ facts: "Facts", question: "Issue?", authorities: authority, citations, conflicts: [] });
  assert.deepEqual(result.issues, ["Issue?"]);
  assert.equal(result.applicableLaw[0].id, "law-a");
  assert.ok(result.confidence > 0);
});

test("classifies legal risk and uncertainty", () => {
  const risk = assessRisk({
    authority: { primaryAuthority: null }, citations: { valid: false }, conflicts: [{ id: 1 }],
    reasoning: { confidence: 0.1 }, timeline: [{ status: "repealed" }],
  });
  assert.equal(risk.level, "high");
  assert.ok(risk.uncertaintyScore <= 1);
});

test("classifies effective, repealed, superseded, and pending timeline entries", () => {
  const timeline = buildTimeline([
    entry(),
    entry({ id: "repealed", metadata: { repealedDate: "2025-01-01" } }),
    entry({ id: "superseded", metadata: { supersededBy: "law-a" } }),
    entry({ id: "pending", metadata: { effectiveDate: "2030-01-01" } }),
  ], "2026-01-01");
  assert.deepEqual(new Set(timeline.map(({ status }) => status)), new Set(["effective", "repealed", "superseded", "pending"]));
});

test("detects and masks personal data recursively", () => {
  const value = { text: "Email legal@example.org phone 0812345678 ID 1234567890123" };
  assert.deepEqual(detectPersonalData(value).map(({ type }) => type), ["national-id", "email", "phone"]);
  const masked = maskPersonalData(value);
  assert.equal(masked.text.includes("legal@example.org"), false);
  assert.ok(masked.text.includes("***"));
});

test("validates inputs and outputs", () => {
  const valid = validateGP002Input({
    facts: "Facts", question: "Issue?", template: "legal-opinion", outputFormat: "json",
    principal: { id: "legal-1", role: "legal-officer" },
  });
  assert.equal(valid.language, "th");
  assert.throws(() => validateGP002Input({}), /facts/);
  assert.equal(validateGP002Output({
    template: "legal-opinion", reasoning: {}, authority: {}, citations: {}, conflicts: [], timeline: [], risk: {},
  }), true);
});

test("formats Markdown, JSON, audit log, and API responses", () => {
  const analysis = {
    template: "legal-opinion",
    reasoning: { facts: "Facts", issues: ["Issue"], analysis: "Analysis", conclusion: "Conclusion", recommendation: "Recommendation" },
    authority: {}, citations: { citations: [] }, conflicts: [], timeline: [], risk: { level: "low", uncertaintyScore: 0.1 },
  };
  assert.match(formatGP002Output(analysis, "markdown"), /^# Legal Opinion/);
  assert.equal(formatGP002Output(analysis, "json").template, "legal-opinion");
  assert.equal(formatGP002Output(analysis, "audit-log").event, "gp002.analysis");
  assert.equal(formatGP002Output(analysis, "api-response").ok, true);
});

test("registers all six templates and eleven knowledge source classes", () => {
  assert.equal(GP002_TEMPLATES.length, 6);
  assert.equal(GP002_KNOWLEDGE.length, 11);
  assert.equal(new Set(GP002_KNOWLEDGE.map(({ metadata }) => metadata.category)).size, 11);
});
