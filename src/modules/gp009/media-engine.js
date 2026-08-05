const PERSONAL = /\b(?:\d{13}|0\d{8,9}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
export function analyzeMedia(input) {
  const images = input.images.map((image, index) => ({ id: image.id ?? `image-${index + 1}`, filename: image.filename ?? null, alt: image.alt ?? "", title: image.title ?? input.subject, creator: image.creator ?? null, license: image.license ?? null, consentRecorded: image.peopleVisible !== true || image.consentRecorded === true, personalDataDetected: new RegExp(PERSONAL.source, PERSONAL.flags).test(`${image.alt ?? ""} ${image.caption ?? ""}`) })).sort((a, b) => a.id.localeCompare(b.id));
  return { images, metadataComplete: images.every(({ filename, alt, creator, license }) => filename && alt && creator && license), pdpaReady: images.every(({ consentRecorded, personalDataDetected }) => consentRecorded && !personalDataDetected) };
}
