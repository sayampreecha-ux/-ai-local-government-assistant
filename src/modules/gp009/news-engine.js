export function createNews(input) {
  const lead = `${input.subject}: ${input.keyMessages[0]}`;
  return { headline: input.subject, lead, body: [...input.keyMessages, ...input.facts].join("\n\n"), audience: input.audience, contact: input.contacts.public ?? null, dateline: input.dateline ?? null, factCount: input.facts.length };
}
