import { createNews } from "./news-engine.js"; import { createCaption } from "./caption-engine.js"; import { createSocialPlan } from "./social-engine.js"; import { createInfographic } from "./infographic-engine.js"; import { createPoster } from "./poster-engine.js"; import { analyzeMedia } from "./media-engine.js"; import { reviewAccessibility } from "./accessibility-engine.js";
export function runPRWorkflow(input, crossModule = {}) {
  const news = createNews(input); const caption = createCaption(input); const social = createSocialPlan(input); const infographic = createInfographic(input); const poster = createPoster(input); const media = analyzeMedia(input); const accessibility = reviewAccessibility(input, caption, infographic, media);
  const requiredApprovals = ["communications", ...(media.pdpaReady ? [] : ["pdpa"]), ...(input.executiveApprovalRequired ? ["executive"] : [])];
  const missingApprovals = requiredApprovals.filter((approval) => !input.approvals.includes(approval));
  const approval = { required: requiredApprovals, granted: [...input.approvals].sort(), missing: missingApprovals, ready: missingApprovals.length === 0 };
  const checklist = [
    ["facts-verified", input.factsVerified === true], ["sources-cited", Boolean(input.sourceNote)], ["ci-compliant", poster.ciCompliant],
    ["media-metadata", media.metadataComplete], ["pdpa-ready", media.pdpaReady], ["accessible", accessibility.accessible],
    ["social-scheduled", social.scheduled], ["approvals-complete", approval.ready],
    ["linked-reviews-complete", Object.values(crossModule).every(({ status }) => status === "completed")],
  ].map(([item, passed]) => ({ item, passed }));
  const packageResult = { ready: checklist.every(({ passed }) => passed), assets: ["news", "caption", "social-plan", "infographic", "poster", "image-metadata"], channels: [...input.channels].sort(), publicationId: input.publicationId ?? null };
  return { template: input.template, news, caption, social, infographic, poster, media, accessibility, approval, checklist: { items: checklist, passed: checklist.filter(({ passed }) => passed).length, total: checklist.length }, package: packageResult, crossModule };
}
