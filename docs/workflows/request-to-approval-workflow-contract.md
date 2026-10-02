# GP Request-to-Approval Workflow Contract v1.0

## Purpose

Define the shared workflow for converting a government procurement request into a controlled approval memorandum or related procurement document. This contract is additive and must not replace the existing Router, Context Manager, Prompt Registry, Governance Layer, or Quality Gates.

## Core principle

The system must identify the user's task, current procedural stage, facts, expenditure classification, authority questions, funding conditions, and required document type before drafting. Drafting is not approval, signature, or a legal determination.

## Canonical workflow

1. `RECEIVED` — accept the user's request and attached references.
2. `FACT_REVIEW` — separate user-provided facts from assumptions and missing data.
3. `INTENT_STAGE_ANALYSIS` — identify the requested action and current stage.
4. `CLASSIFICATION_PENDING` — assess material, asset, service, construction, repair, or unresolved classification using applicable official criteria.
5. `AUTHORITY_CHECK` — prepare an evidence-first prompt for live research by the user's selected AI, requiring official primary sources, current versions, effective dates, amendments, and conflicts.
6. `APPROVAL_STAGE_SELECTION` — identify the document/action stage: principle approval, procurement initiation, TOR/specification, purchase/hire report, award/order approval, acceptance, payment, clarification, or another stage.
7. `READINESS_ASSESSMENT` — list mandatory facts, evidence, approvals, and attachments; identify risk flags.
8. `DRAFT_ALLOWED` — draft only the supported portions, with explicit placeholders for missing facts.
9. `QUALITY_GATE` — check document type, facts, classification, authority, funding, procurement sequence, language, attachments, privacy, and human review.
10. `HUMAN_REVIEW` — route the result to the responsible officer and competent authority.
11. `READY_FOR_SUBMISSION` — indicate that the package is ready for human submission review; never imply that approval has already occurred.

## Document-stage rules

- Principle approval memorandum: necessity, mission, objective, preliminary funding readiness, and proposed next action.
- Procurement initiation/report: item or scope, estimated amount, funding, specifications/scope, procurement route, responsible persons, and required supporting records.
- TOR/specification memorandum: functional need, neutral specifications, technical rationale, and review responsibility.
- Award/order approval: procurement results, evaluation evidence, proposed supplier/contractor, and authority checks.
- Acceptance/payment: delivery or completion evidence, inspection/acceptance records, invoice and payment prerequisites.

The system must not treat principle approval as automatic approval to purchase, award, sign, or pay.

## Shared case schema

```text
ApprovalCase
- caseId
- requester
- owningUnit
- requestText
- requestObjective
- facts[]
- assumptions[]
- missingInformation[]
- items[]
- quantity
- specifications
- estimatedAmount
- fundingSource
- budgetCategory
- expenditureClassification
- classificationStatus
- approvalStage
- candidateDocumentTypes[]
- authorityQuestions[]
- evidenceReferences[]
- requiredAttachments[]
- riskFlags[]
- qualityGateResult
- decisionLock
- humanReviewStatus
- auditTrail[]
```

## Classification contract

Classification must not be decided from a keyword alone. The engine must consider the item's actual characteristics, intended use, durability/function, applicable classification criteria, effective date, amendments, and special rules. Supported outcomes:

- `CONFIRMED_MATERIAL`
- `CONFIRMED_ASSET`
- `OTHER_CATEGORY`
- `PENDING_EVIDENCE`
- `CONFLICTING_EVIDENCE`

The engine must preserve the reasoning and evidence requirements. It must not hard-code a legal result merely because an item name commonly appears in a category.

## Evidence-first external research prompt

GP does not claim that it performed live research unless a verified search result is actually available. By default, GP generates a controlled prompt for an external AI with web access. The prompt must require:

- official primary sources first;
- source title, issuing body, date, URL, and relevant provision;
- version, amendment, repeal, transition, and effective-date checks;
- fact-to-condition comparison;
- separation of verified facts, interpretation, and unresolved issues;
- no invented facts, citations, amounts, dates, names, or authority;
- explicit escalation where evidence is incomplete or conflicting.

## Decision Lock rules

Set `decisionLock = true` for unresolved authority, funding, classification, procurement method, delegation, conflict, material missing facts, possible split purchasing, or any issue that could materially affect legality, rights, budget, or approval authority. Decision Lock may still permit a non-decisive checklist or partial draft, but must prevent a final legal/financial/procurement conclusion.

## Quality Gate

The gate must report `PASS`, `PASS_WITH_NOTES`, `REVISE`, or `LOCKED`. It checks:

1. correct document type and procedural stage;
2. facts traceable to user input or evidence;
3. no fabricated names, dates, numbers, document references, or approvals;
4. expenditure classification status and rationale;
5. authority and current-source status;
6. funding and budget conditions;
7. procurement sequence and risk indicators;
8. required attachments and responsible reviewers;
9. official-language clarity;
10. privacy and personal-data minimization;
11. human-review requirement and unresolved questions.

## Required output format

Every completed run should present:

1. Request summary;
2. Verified facts;
3. Assumptions and missing information;
4. Classification result and evidence status;
5. Recommended procedural stage and candidate document;
6. Authority/evidence research prompt;
7. Risks and Decision Lock status;
8. Draft or draft outline, if permitted;
9. Quality Gate result;
10. Human review and next actions.

## Non-negotiable safeguards

- Never approve, sign, or impersonate an authorized official.
- Never represent a draft as an approved document.
- Never invent facts or official references.
- Never silently select a legal rule when sources conflict.
- Never bypass the required procedural stage.
- Never claim current legal verification without current evidence.
- Preserve the user's facts separately from AI-generated analysis.

## Test scenarios

The implementation must cover clear material, clear asset, ambiguous item, repair/spare part, vehicle, medical equipment, accumulated funds, incomplete facts, conflicting sources, wrong document-stage selection, and a request that only asks for a principle approval memorandum.
