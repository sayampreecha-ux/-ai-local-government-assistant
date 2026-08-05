const AUTHORITIES = Object.freeze({ provincial: "Provincial Administrative Organization Council", municipal: "Municipal Council", subdistrict: "Subdistrict Administrative Organization Council" });
export function determineCouncilAuthority(input) {
  const competentBody = AUTHORITIES[input.councilType];
  const delegated = input.motion.delegatedAuthority === true;
  const withinJurisdiction = input.motion.withinJurisdiction !== false;
  return { competentBody, delegated, delegationInstrument: input.motion.delegationInstrument ?? null, withinJurisdiction, authorized: Boolean(competentBody && withinJurisdiction && (!delegated || input.motion.delegationInstrument)) };
}
