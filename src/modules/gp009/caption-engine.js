export function createCaption(input) {
  const hashtags = [...new Set(input.hashtags.map((tag) => tag.startsWith("#") ? tag : `#${tag}`))].sort();
  const text = `${input.subject}\n\n${input.keyMessages.join(" • ")}\n\n${hashtags.join(" ")}`.trim();
  return { text, hashtags, characterCount: text.length, withinFacebookGuidance: text.length <= 2000, callToAction: input.callToAction ?? null };
}
