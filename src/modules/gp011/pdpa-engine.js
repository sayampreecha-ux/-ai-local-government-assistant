const RULES = Object.freeze([
  ["national-id", "sensitive", /\b\d{13}\b/g], ["email", "personal", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi], ["phone", "personal", /\b0\d{8,9}\b/g],
  ["health", "sensitive", /\b(?:diagnosis|medical|health|โรค|สุขภาพ)\b/gi], ["biometric", "sensitive", /\b(?:biometric|fingerprint|face scan|ชีวมิติ|ลายนิ้วมือ)\b/gi],
]);
function textOf(value) { return typeof value === "string" ? value : JSON.stringify(value); }
export function detectPDPA(records = []) { const findings = records.flatMap((record, recordIndex) => RULES.flatMap(([type, classification, regex]) => [...textOf(record).matchAll(new RegExp(regex.source, regex.flags))].map((match) => ({ recordIndex, type, classification, length: match[0].length })))); const types = [...new Set(findings.map(({ type }) => type))].sort(); return { detected: findings.length > 0, findings, types, personalCount: findings.filter(({ classification }) => classification === "personal").length, sensitiveCount: findings.filter(({ classification }) => classification === "sensitive").length }; }
