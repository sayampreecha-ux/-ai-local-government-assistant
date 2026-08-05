export function analyzeEligibility(input) {
  const reasons = [
    ...(!input.employee.status ? ["employee-status-missing"] : []),
    ...(!input.approvals.includes("supervisor") ? ["supervisor-approval-missing"] : []),
    ...(!input.documents.budgetCertification ? ["budget-certification-missing"] : []),
  ];
  if (input.financeType === "reimbursement" && input.receipts.length === 0) reasons.push("receipt-missing");
  return { eligible: reasons.length === 0, reasons, employeeStatus: input.employee.status ?? "unknown" };
}
