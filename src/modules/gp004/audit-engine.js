export function buildFinanceAuditChecklist({ input, eligibility, budget, reimbursement, finance, knowledgeCount }) {
  const checklist = [
    ["authorized-requester", Boolean(input.employee.status)],
    ["supervisor-approval", input.approvals.includes("supervisor")],
    ["budget-certified", input.documents.budgetCertification === true],
    ["budget-available", budget.sufficient],
    ["eligible-expense", eligibility.eligible],
    ["receipt-evidence", input.financeType !== "reimbursement" || reimbursement.claims.every(({ documented }) => documented)],
    ["training-plan", input.financeType !== "training" || finance.training.approved],
    ["authoritative-knowledge", knowledgeCount >= 7],
    ["low-financial-risk", finance.risk.level === "low"],
  ].map(([item, passed]) => ({ item, passed }));
  return { checklist, passed: checklist.filter(({ passed }) => passed).length, total: checklist.length, readyForPayment: checklist.every(({ passed }) => passed) };
}
