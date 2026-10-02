# GP-Service-Contract v1

## Purpose

A focused extension of GP003 for end-to-end **จ้างเหมาบริการ** work. It supports drafting and reviewing the workflow; it does not approve, sign, accept, or pay on behalf of an authorized official.

## Workflow

1. Classify the arrangement from actual facts: deliverables, independence, time, supervision, and payment basis.
2. Prepare the necessity and approval memorandum.
3. Prepare measurable scope of work/TOR.
4. Check procurement method, budget, price evidence, and anti-splitting risk.
5. Check contract terms, authority, duration, and consistency with TOR.
6. Check deliverables, inspection/acceptance, invoice, and payment evidence.
7. Run Applicable Authority Check and Legal Version Gate using official evidence supplied by the user's external AI search.
8. If evidence or authority is incomplete, activate Decision Lock and return a targeted evidence request.

## Mandatory distinctions

- Service contract is not automatically an employment relationship.
- Labels such as “จ้างเหมา” are not sufficient; classification must follow the actual working conditions and contract substance.
- Payment must be tied to verifiable outputs and acceptance evidence.
- No hard-coded legal thresholds, rates, dates, or authority claims may be used without current official evidence.

## Required output

- Executive conclusion: allowed / not allowed / conditional / evidence insufficient.
- Verified facts and missing facts.
- Applicable authority and version status.
- Evidence matrix by workflow stage.
- Risks and control measures.
- Draft or checklist requested by the user.
- Quality Gate status.
- Decision Lock status.
- Source list and limitations.

## Integration boundary

The module is subordinate to GP003 and must preserve the existing Core, Router, Governance Layer, Quality Gates, PDPA controls, and Human Approval requirement.
