export const GP001_TEMPLATE_TYPES = Object.freeze([
  "internal-letter",
  "external-letter",
  "order",
  "announcement",
  "memorandum",
  "report",
]);

const LABELS = Object.freeze({
  "internal-letter": "Internal Government Letter",
  "external-letter": "External Government Letter",
  order: "Government Order",
  announcement: "Official Announcement",
  memorandum: "Memorandum",
  report: "Official Report",
});

const HEADINGS = Object.freeze({
  "internal-letter": ["From", "To", "Subject", "References", "Attachment"],
  "external-letter": ["Agency", "Reference No.", "Date", "Subject", "To", "References", "Attachment"],
  order: ["Order No.", "Subject", "Authority", "Ordered Provisions", "Effective Date"],
  announcement: ["Subject", "Authority", "Announcement", "Effective Date"],
  memorandum: ["To", "From", "Date", "Subject", "Summary", "Action Required"],
  report: ["Title", "Executive Summary", "Background", "Findings", "Recommendations"],
});

export function renderOfficialDocument(input, legalReferences) {
  if (!GP001_TEMPLATE_TYPES.includes(input.templateType)) {
    throw new RangeError(`Unknown GP001 template: ${input.templateType}`);
  }
  const references = legalReferences.map(({ title, metadata }) =>
    `${title} (${metadata.authority}, ${metadata.version})`,
  );
  const sections = HEADINGS[input.templateType].map((heading) => ({
    heading,
    content:
      heading === "Subject" || heading === "Title"
        ? input.subject
        : heading === "To"
          ? input.recipients.join(", ")
          : heading === "References" || heading === "Authority"
            ? references.join("; ")
            : heading === "Summary" || heading === "Executive Summary"
              ? input.instructions
              : "",
  }));
  return {
    documentType: input.templateType,
    title: LABELS[input.templateType],
    subject: input.subject,
    recipients: [...input.recipients],
    sections,
    body: input.instructions,
    legalReferences: references,
    language: input.language,
  };
}
