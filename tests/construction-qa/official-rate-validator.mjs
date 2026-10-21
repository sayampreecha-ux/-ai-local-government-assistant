// Independent, evidence-first arithmetic validator. No official rates or factors are embedded.
export function verifyConstructionEstimate({items, declaredDirectCost, factorF, declaredTotal, evidence = {}}) {
  if (!Array.isArray(items) || !items.length) throw Error('items required');
  const issues = [];
  const number = (value, label) => {
    if (!['number','string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) throw Error('invalid numeric '+label);
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) throw Error('invalid numeric '+label);
    return n;
  };
  const round = n => {
    const result = Math.round((n + Number.EPSILON) * 100) / 100;
    if (!Number.isFinite(result)) throw Error('numeric overflow');
    return result;
  };
  const rows = items.map((item, index) => {
    const qty = number(item.quantity, 'quantity'), material = number(item.materialUnitPrice, 'materialUnitPrice'), labor = number(item.laborUnitPrice, 'laborUnitPrice');
    if (![qty, material, labor].every(Number.isFinite) || [qty,material,labor].some(n=>n<0)) throw Error('invalid numeric item '+index);
    const expected = round(qty * (material + labor));
    const stated = item.declaredAmount == null ? null : number(item.declaredAmount, 'declaredAmount');
    if (stated !== null && (!Number.isFinite(stated) || Math.abs(stated-expected)>0.01))
      issues.push({type:'ARITHMETIC_MISMATCH',index,expected,stated});
    if (!item.materialSource || !item.materialSource.province || !item.materialSource.period || !item.materialSource.document)
      issues.push({type:'MATERIAL_RATE_UNVERIFIED',index});
    if (!item.laborSource?.document) issues.push({type:'LABOR_RATE_UNVERIFIED',index});
    if (!item.drawingReference) issues.push({type:'QUANTITY_UNVERIFIED',index});
    return {index,expected,stated};
  });
  const directCost=round(rows.reduce((s,r)=>s+r.expected,0));
  if (declaredDirectCost!=null && Math.abs(number(declaredDirectCost, 'declaredDirectCost')-directCost)>0.01)
    issues.push({type:'DIRECT_COST_MISMATCH',expected:directCost,stated:number(declaredDirectCost, 'declaredDirectCost')});
  let total=null;
  if (factorF!=null) {
    if (!Number.isFinite(number(factorF, 'factorF')) || number(factorF, 'factorF')<=0) throw Error('invalid factorF');
    total=round(directCost*number(factorF, 'factorF'));
    if (!evidence.factorFDocument || !evidence.factorFConditions) issues.push({type:'FACTOR_F_UNVERIFIED'});
    if (declaredTotal!=null && Math.abs(number(declaredTotal, 'declaredTotal')-total)>0.01)
      issues.push({type:'TOTAL_MISMATCH',expected:total,stated:number(declaredTotal, 'declaredTotal')});
  } else issues.push({type:'FACTOR_F_MISSING'});
  if (!evidence.pr4 || !evidence.pr5) issues.push({type:'FORM_EVIDENCE_INCOMPLETE'});
  if (!evidence.officialRuleVersion || !evidence.estimateDate) issues.push({type:'RULE_VERSION_UNVERIFIED'});
  return {rows,directCost,total,issues,arithmeticPass:!issues.some(i=>i.type.endsWith('MISMATCH')),officialRateVerified:!issues.some(i=>i.type.endsWith('UNVERIFIED')||i.type.endsWith('MISSING')||i.type==='FORM_EVIDENCE_INCOMPLETE'),decisionLock:issues.length>0};
}
