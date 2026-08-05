export function analyzeTransfer(input) {
  const amount = Number(input.transfer.amount) || 0;
  const requested = amount > 0;
  const sameClassification = !requested || input.transfer.fromClassification === input.transfer.toClassification;
  const authorized = !requested || (input.transfer.approved === true && input.transfer.sourceAvailable >= amount);
  return { requested, amount, from: input.transfer.fromClassification ?? null, to: input.transfer.toClassification ?? null, sameClassification, authorized, amendment: { requested: input.amendment.requested === true, approved: input.amendment.approved === true } };
}
