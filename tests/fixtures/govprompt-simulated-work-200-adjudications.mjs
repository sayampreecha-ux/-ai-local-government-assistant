export const SIMULATED_OUTPUT_ADJUDICATIONS = Object.freeze({
  // Legal authority question: the user asks whether the authority exists, not to draft the project itself.
  SIM026: 'analysis',
  // The user explicitly asks for a table for management review; explicit format outranks audience.
  SIM089: 'table',
  // The user explicitly asks to draft a memorandum; domain stays HR, but the output must be an official document.
  SIM133: 'official_document',
  // The user explicitly asks for a table of education-project expenses for management review.
  SIM173: 'table'
});
