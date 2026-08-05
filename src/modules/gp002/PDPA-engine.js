const DETECTORS = Object.freeze([
  ["national-id", /\b\d{13}\b/g],
  ["email", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["phone", /\b0\d{8,9}\b/g],
]);

export function detectPersonalData(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return DETECTORS.flatMap(([type, pattern]) =>
    [...text.matchAll(new RegExp(pattern.source, pattern.flags))].map((match) => ({ type, length: match[0].length })),
  );
}

export function maskPersonalData(value) {
  if (typeof value === "string") {
    return DETECTORS.reduce(
      (text, [, pattern]) => text.replace(new RegExp(pattern.source, pattern.flags), (match) => `${match.slice(0, 2)}***${match.slice(-2)}`),
      value,
    );
  }
  if (Array.isArray(value)) return value.map(maskPersonalData);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, maskPersonalData(nested)]));
  }
  return value;
}
