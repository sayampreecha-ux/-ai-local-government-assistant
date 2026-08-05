export function reviewAccessibility(input, caption, infographic, media) {
  const checks = [
    ["plain-language", input.plainLanguage !== false], ["image-alt-text", media.images.every(({ alt }) => alt)],
    ["caption-length", caption.withinFacebookGuidance], ["infographic-concise", infographic.concise],
    ["color-contrast", input.poster?.contrastApproved === true], ["non-color-cues", input.poster?.nonColorCues === true],
    ["language-declared", Boolean(input.language)], ["contact-channel", Boolean(input.contacts.public)],
  ].map(([item, passed]) => ({ item, passed }));
  return { checks, passed: checks.filter(({ passed }) => passed).length, total: checks.length, accessible: checks.every(({ passed }) => passed) };
}
