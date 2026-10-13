// Independent, evidence-first arithmetic validator. No official rates or factors are embedded.
export function verifyConstructionEstimate({items, declaredDirectCost, factorF, declaredTotal, evidence = {}}) {
  if (!Array.isArray(items) || !items.length) throw Error('items required');
  const issues = [];
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const rows = items.map((item, index) => {
    const qty = Number(item.quantity), material = Number(item.materialUnitPrice), labor = Number(item.laborUnitPrice);
    if (![qty, material, labor].every(Number.isFinite) || [qty,material,labor].some(n=>n<0)) throw Error('invalid numeric item '+index);
    const expected = round(qty * (material + labor));
    const stated = item.declaredAmount == null ? null : Number(item.declaredAmount);
    if (stated !== null && (!Number.isFinite(stated) || Math.abs(stated-expected)>0.01))
      issues.push({type:'ARITHMETIC_MISMATCH',index,expected,stated});
    if (!item.materialSource || !item.materialSource.province || !item.materialSource.period || !item.materialSource.document)
      issues.push({type:'MATERIAL_RATE_UNVERIFIED',index});
    if (!item.laborSource?.document) issues.push({type:'LABOR_RATE_UNVERIFIED',index});
    if (!item.drawingReference) issues.push({type:'QUANTITY_UNVERIFIED',index});
    return {index,expected,stated};
  });
  const directCost=round(rows.reduce((s,r)=>s+r.expected,0));
  if (declaredDirectCost!=null && Math.abs(Number(declaredDirectCost)-directCost)>0.01)
    issues.push({type:'DIRECT_COST_MISMATCH',expected:directCost,stated:Number(declaredDirectCost)});
  let total=null;
  if (factorF!=null) {
    if (!Number.isFinite(Number(factorF)) || Number(factorF)<=0) throw Error('invalid factorF');
    total=round(directCost*Number(factorF));
    if (!evidence.factorFDocument || !evidence.factorFConditions) issues.push({type:'FACTOR_F_UNVERIFIED'});
    if (declaredTotal!=null && Math.abs(Number(declaredTotal)-total)>0.01)
      issues.push({type:'TOTAL_MISMATCH',expected:total,stated:Number(declaredTotal)});
  } else issues.push({type:'FACTOR_F_MISSING'});
  if (!evidence.pr4 || !evidence.pr5) issues.push({type:'FORM_EVIDENCE_INCOMPLETE'});
  if (!evidence.officialRuleVersion || !evidence.estimateDate) issues.push({type:'RULE_VERSION_UNVERIFIED'});
  return {rows,directCost,total,issues,arithmeticPass:!issues.some(i=>i.type.endsWith('MISMATCH')),officialRateVerified:!issues.some(i=>i.type.endsWith('UNVERIFIED')||i.type.endsWith('MISSING')||i.type==='FORM_EVIDENCE_INCOMPLETE'),decisionLock:issues.length>0};
}
