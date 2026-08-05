import { GP009_OUTPUT_FORMATS, GP009_TEMPLATES } from "./templates/index.js";
function required(value, field) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`); }
export function validateGP009Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP009 input must be an object");
  required(input.subject, "subject"); required(input.audience, "audience"); required(input.principal?.id, "principal.id"); required(input.principal?.role, "principal.role");
  if (!Array.isArray(input.keyMessages) || !input.keyMessages.length) throw new TypeError("keyMessages must be non-empty");
  if (!GP009_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP009 template"); if (!GP009_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP009 output format");
  return { language: "th", facts: [], channels: ["website"], schedule: [], images: [], approvals: [], contacts: {}, hashtags: [], ...structuredClone(input) };
}
export function validateGP009Output(output) { const fields = ["template", "news", "caption", "social", "infographic", "poster", "media", "accessibility", "approval", "checklist", "package"]; if (!output || fields.some((field) => !(field in output))) throw new TypeError("Invalid GP009 workflow output"); return true; }
