export function createPoster(input) {
  return { format: input.poster?.format ?? "A4", orientation: input.poster?.orientation ?? "portrait", hierarchy: ["agency-mark", "headline", "key-message", "call-to-action", "contact"], ciCompliant: input.poster?.approvedLogo === true && Boolean(input.poster?.primaryColor), safeArea: input.poster?.safeArea !== false };
}
