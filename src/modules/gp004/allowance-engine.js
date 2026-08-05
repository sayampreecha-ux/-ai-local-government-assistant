export function analyzeAllowances(input) {
  const requested = input.allowances ?? {};
  const rates = input.allowanceRates ?? {};
  const cap = (name) => Math.min(Number(requested[name]) || 0, Number(rates[name]) || 0);
  const allowed = {
    houseRental: cap("houseRental"),
    subsistence: cap("subsistence"),
    meal: cap("meal"),
    medical: cap("medical"),
    welfare: cap("welfare"),
    maintenanceFund: cap("maintenanceFund"),
  };
  return { requested: structuredClone(requested), allowed, totalAllowed: Object.values(allowed).reduce((sum, value) => sum + value, 0) };
}
