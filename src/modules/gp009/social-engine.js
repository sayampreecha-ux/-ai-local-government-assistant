export function createSocialPlan(input) {
  const items = input.channels.flatMap((channel) => input.schedule.map((slot, index) => ({ id: `${channel}-${index + 1}`, channel, publishAt: slot.publishAt, contentType: slot.contentType ?? input.template, owner: slot.owner ?? null, approved: input.approvals.includes("communications") }))).sort((a, b) => a.publishAt.localeCompare(b.publishAt) || a.id.localeCompare(b.id));
  return { items, channelCount: new Set(items.map(({ channel }) => channel)).size, scheduled: items.length > 0, allOwned: items.every(({ owner }) => owner) };
}
