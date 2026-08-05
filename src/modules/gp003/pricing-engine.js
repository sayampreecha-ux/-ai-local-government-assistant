export function analyzePricing(estimatedBudget, marketPrices) {
  const prices = marketPrices.filter((price) => Number.isFinite(price) && price > 0).sort((a, b) => a - b);
  const average = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
  const variance = average === null ? null : (estimatedBudget - average) / average;
  return {
    sampleSize: prices.length, minimum: prices[0] ?? null, maximum: prices.at(-1) ?? null, average,
    budgetVariance: variance,
    status: average === null ? "insufficient-data" : Math.abs(variance) <= 0.15 ? "reasonable" : variance > 0 ? "above-market" : "below-market",
    outliers: average === null ? [] : prices.filter((price) => Math.abs(price - average) / average > 0.3),
  };
}
