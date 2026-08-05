export function analyzeTransfer(input) {
  const reasons = [...(!input.transfer.destinationVacant ? ["destination-not-vacant"] : []), ...(!input.transfer.originConsent ? ["origin-consent-missing"] : []), ...(!input.transfer.destinationConsent ? ["destination-consent-missing"] : []), ...(!input.transfer.samePositionStandard ? ["position-standard-mismatch"] : [])];
  return { eligible: reasons.length === 0, reasons, origin: input.transfer.origin ?? null, destination: input.transfer.destination ?? null, jurisdictionChange: input.transfer.originJurisdiction !== input.transfer.destinationJurisdiction };
}
