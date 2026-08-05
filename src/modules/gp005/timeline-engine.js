export function buildBudgetTimeline(input) {
  return [
    ["ordinance-approved", input.ordinance.approvedDate], ["budget-effective", input.ordinance.effectiveDate],
    ["reservation-deadline", input.reservation.deadline], ["commitment-start", input.multiYear.startDate],
    ["commitment-end", input.multiYear.endDate],
  ].filter(([, date]) => date).map(([event, date]) => ({ event, date })).sort((a, b) => a.date.localeCompare(b.date) || a.event.localeCompare(b.event));
}
