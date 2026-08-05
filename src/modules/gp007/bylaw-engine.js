export function reviewBylaw(input) {
  const applicable = input.motion.type === "bylaw" || input.bylaw.requested === true;
  const checks = { authority: input.bylaw.authorityConfirmed === true, readings: Number(input.bylaw.readingsCompleted) >= (Number(input.bylaw.requiredReadings) || 3), publicConsultation: input.bylaw.publicConsultationRequired !== true || input.bylaw.publicConsultationCompleted === true, conflictFree: input.bylaw.higherLawConflict !== true, promulgationReady: input.bylaw.promulgationDocumentsComplete === true };
  return { applicable, checks, valid: !applicable || Object.values(checks).every(Boolean) };
}
