export function analyzeDevelopmentPlan(input) {
  const projectId = input.developmentPlan.projectId ?? null;
  const localProjects = new Set(input.developmentPlan.localProjectIds ?? []);
  const strategicProjects = new Set(input.developmentPlan.strategicProjectIds ?? []);
  return { projectId, localPlanConsistent: Boolean(projectId && localProjects.has(projectId)), strategicPlanConsistent: Boolean(projectId && strategicProjects.has(projectId)), indicator: input.developmentPlan.indicator ?? null, consistent: Boolean(projectId && localProjects.has(projectId) && strategicProjects.has(projectId)) };
}
