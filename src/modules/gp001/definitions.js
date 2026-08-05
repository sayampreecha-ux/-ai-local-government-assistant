export const GP001_PROMPT = Object.freeze({
  moduleId: "GP001",
  version: "2.0.0",
  template:
    "Create a {{letterType}} government document in {{language}}. Instructions: {{instructions}}. Authoritative knowledge: {{knowledge}}.",
  metadata: {
    category: "official-government-correspondence",
    owner: "government-correspondence-team",
    description: "Draft and validate official government letters and administrative documents",
    requiredInputs: ["letterType", "language", "instructions", "knowledge"],
    outputSchema: {
      type: "object",
      required: ["documentType", "title", "subject", "recipients", "sections", "body", "legalReferences", "language"],
    },
    permissions: ["gp001:execute"],
  },
});

export const GP001_KNOWLEDGE = Object.freeze([
  {
    id: "gp001-local-government",
    type: "manual",
    title: "Local Government Correspondence Guidance",
    reference: "govprompt://knowledge/gp001/local-government",
    metadata: {
      source: "Local Government Knowledge Base",
      authority: "Department of Local Administration",
      version: "1.0",
      effectiveDate: "2026-01-01",
      category: "local-government",
      tags: ["local-government", "official-letter", "correspondence"],
      language: "th",
      confidence: 0.9,
    },
  },
  {
    id: "gp001-administrative-procedure",
    type: "law",
    title: "Administrative Procedure Knowledge Source",
    reference: "govprompt://knowledge/gp001/administrative-procedure",
    metadata: {
      source: "Administrative Procedure Corpus",
      authority: "Office of the Council of State",
      version: "1.0",
      effectiveDate: "2026-01-01",
      category: "administrative-procedure",
      tags: ["administrative", "procedure", "legal-validation"],
      language: "th",
      confidence: 0.95,
    },
  },
  {
    id: "gp001-official-letter-standard",
    type: "manual",
    title: "Official Letter Standard",
    reference: "govprompt://knowledge/gp001/official-letter-standard",
    metadata: {
      source: "Official Correspondence Standard Corpus",
      authority: "Office of the Prime Minister",
      version: "1.0",
      effectiveDate: "2026-01-01",
      category: "official-letter-standard",
      tags: ["official-letter", "format", "standard"],
      language: "th",
      confidence: 0.98,
    },
  },
  {
    id: "gp001-pdpa",
    type: "law",
    title: "Personal Data Protection Knowledge Source",
    reference: "govprompt://knowledge/gp001/pdpa",
    metadata: {
      source: "PDPA Legal Corpus",
      authority: "Personal Data Protection Committee",
      version: "1.0",
      effectiveDate: "2026-01-01",
      category: "pdpa",
      tags: ["pdpa", "personal-data", "privacy"],
      language: "th",
      confidence: 0.98,
    },
  },
]);

export const GP001_POLICIES = Object.freeze([
  {
    id: "gp001-official-author",
    version: "1.0.0",
    description: "Authorized government roles may execute GP001",
    effect: "allow",
    roles: ["officer", "supervisor", "administrator"],
    actions: ["gp001:execute"],
    resources: ["prompt:GP001"],
  },
  {
    id: "gp001-knowledge-reader",
    version: "1.0.0",
    description: "Authorized government roles may read GP001 knowledge",
    effect: "allow",
    roles: ["officer", "supervisor", "administrator"],
    actions: ["knowledge:read"],
    resources: ["knowledge:law", "knowledge:manual"],
  },
]);

export const GP001_PDPA_RULE = Object.freeze({
  id: "gp001-pdpa-approval",
  field: "payload.pdpaDetected",
  operator: "equals",
  value: true,
  effect: "require_approval",
  message: "Personal data requires an approval decision before prompt execution",
});
