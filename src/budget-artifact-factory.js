import { validateBudgetBalance } from './budget-balance-validator.js';
import {
  DELIVERABLE_CONTRACT_SCHEMA_VERSION,
  getDeliverableContractV3,
  validateDeliverableArtifactV3
} from './government-deliverable-contracts-v3.js';

export const BUDGET_ARTIFACT_FACTORY_VERSION = '1.0';

const REQUIRED_EVIDENCE_KEYS = Object.freeze([
  'baselineBudget',
  'latestRevenueActuals',
  'targetYearPlan',
  'personnelObligations',
  'budgetTotals',
  'budgetSourceRegister'
]);

const keyOf = (item) => String(item?.key || '').trim();
const evidenceIndex = (evidence = []) => new Map((Array.isArray(evidence) ? evidence : []).filter((item) => keyOf(item)).map((item) => [keyOf(item), item]));
const safeValue = (item) => item?.value;
const nowIso = (value) => value || new Date().toISOString();

function sourceRows(index) {
  const register = safeValue(index.get('budgetSourceRegister'));
  return Array.isArray(register) ? register.map((item) => ({
    evidenceKey: String(item?.evidenceKey || ''),
    documentTitle: String(item?.documentTitle || ''),
    sourceName: String(item?.sourceName || ''),
    sourceUrl: String(item?.sourceUrl || ''),
    documentDate: String(item?.documentDate || '')
  })) : [];
}

function draftBody(index, balance) {
  const targetYear = safeValue(index.get('targetBudgetYear')) || safeValue(index.get('targetYearPlan'))?.targetYear || '[ระบุปีงบประมาณ]';
  const org = safeValue(index.get('organizationContext'))?.organizationName || safeValue(index.get('organizationContext')) || '[ระบุหน่วยงาน]';
  const lines = [
    `ร่างกรอบงบประมาณ ${org} ปีงบประมาณ ${targetYear}`,
    '',
    `รายรับรวม: ${balance.revenueTotal ?? '[ยังไม่ยืนยัน]'}`,
    `รายจ่ายรวม: ${balance.expenseTotal ?? '[ยังไม่ยืนยัน]'}`,
    `ผลต่าง: ${balance.difference ?? '[ยังไม่ยืนยัน]'}`,
    balance.hasEstimates ? 'หมายเหตุ: มีรายการประมาณการ (estimated) ซึ่งต้องตรวจยืนยันก่อนเสนออนุมัติขั้นสุดท้าย' : 'หมายเหตุ: ไม่พบรายการประมาณการที่ยังต้องติดป้าย estimated',
    '',
    'แหล่งหลักฐานที่ใช้จัดทำ:',
    ...sourceRows(index).map((row, i) => `${i + 1}. ${row.documentTitle || row.evidenceKey} — ${row.sourceName || 'แหล่งราชการ'}${row.documentDate ? ` (${row.documentDate})` : ''}`),
    '',
    'สถานะ: ร่างสำหรับตรวจสอบภายใน ยังไม่ใช่การอนุมัติงบประมาณโดย AI'
  ];
  return lines.join('\n');
}

function artifactBase({ artifactKey, evidenceKeys, generatedAt, content }) {
  const workflowId = 'gov.budget-draft';
  const stageId = 'deliverables';
  const contract = getDeliverableContractV3(workflowId, stageId, artifactKey);
  if (!contract) return null;
  return {
    key: artifactKey,
    contractId: contract.id,
    contractVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION,
    workflowId,
    stageId,
    status: 'ready',
    evidenceKeys: [...evidenceKeys],
    unresolvedItems: [],
    provenance: {
      generatedBy: `budget-artifact-factory/${BUDGET_ARTIFACT_FACTORY_VERSION}`,
      generatedAt,
      sourceEvidenceKeys: [...evidenceKeys]
    },
    validation: {
      validated: true,
      validator: `deliverable-contract-v${DELIVERABLE_CONTRACT_SCHEMA_VERSION}`,
      validatedAt: generatedAt,
      errors: []
    },
    content
  };
}

export function buildBudgetDeliverableArtifacts({ evidence = [], input = {}, generatedAt = null } = {}) {
  const index = evidenceIndex(evidence);
  const missingEvidence = REQUIRED_EVIDENCE_KEYS.filter((key) => !index.has(key));
  if (missingEvidence.length) {
    return Object.freeze({
      factoryVersion: BUDGET_ARTIFACT_FACTORY_VERSION,
      status: 'blocked-missing-evidence',
      artifacts: Object.freeze([]),
      missingEvidence: Object.freeze(missingEvidence),
      failClosed: true
    });
  }

  const budgetTotals = safeValue(index.get('budgetTotals')) || {};
  const balance = validateBudgetBalance(budgetTotals);
  if (!balance.valid) {
    return Object.freeze({
      factoryVersion: BUDGET_ARTIFACT_FACTORY_VERSION,
      status: balance.status,
      artifacts: Object.freeze([]),
      missingEvidence: Object.freeze([]),
      balance,
      failClosed: true
    });
  }

  const at = nowIso(generatedAt);
  const evidenceKeys = [...REQUIRED_EVIDENCE_KEYS];
  const draft = artifactBase({
    artifactKey: 'budget-draft',
    evidenceKeys,
    generatedAt: at,
    content: { body: draftBody(index, balance) }
  });
  const structured = artifactBase({
    artifactKey: 'budget-structured-export',
    evidenceKeys,
    generatedAt: at,
    content: {
      workflowId: 'gov.budget-draft',
      schemaVersion: '1.0',
      revenueTotal: balance.revenueTotal,
      expenseTotal: balance.expenseTotal,
      difference: balance.difference,
      hasEstimates: balance.hasEstimates,
      baselineBudget: safeValue(index.get('baselineBudget')),
      latestRevenueActuals: safeValue(index.get('latestRevenueActuals')),
      targetYearPlan: safeValue(index.get('targetYearPlan')),
      personnelObligations: safeValue(index.get('personnelObligations')),
      sourceRegister: sourceRows(index),
      sourceEvidenceKeys: [...evidenceKeys]
    }
  });

  const candidates = [draft, structured].filter(Boolean);
  const validations = candidates.map((artifact) => validateDeliverableArtifactV3({
    workflowId: 'gov.budget-draft',
    stageId: 'deliverables',
    artifact,
    evidence,
    input
  }));
  const invalid = validations.filter((result) => !result.valid);
  if (invalid.length) {
    return Object.freeze({
      factoryVersion: BUDGET_ARTIFACT_FACTORY_VERSION,
      status: 'blocked-deliverable-contract',
      artifacts: Object.freeze([]),
      missingEvidence: Object.freeze([]),
      balance,
      validationErrors: Object.freeze(invalid.flatMap((item) => item.errors)),
      failClosed: true
    });
  }

  return Object.freeze({
    factoryVersion: BUDGET_ARTIFACT_FACTORY_VERSION,
    status: 'ready',
    artifacts: Object.freeze(candidates.map((artifact) => Object.freeze(artifact))),
    missingEvidence: Object.freeze([]),
    balance,
    failClosed: false
  });
}

export { REQUIRED_EVIDENCE_KEYS as BUDGET_DELIVERABLE_REQUIRED_EVIDENCE_KEYS };
