# GovPrompt Engineering 12 — Round 2

Base/main rechecked: `c3e4bf2cab4566473ba9bccf5aecd2495535a50c` (unchanged from round 1). Scope: typed requests on the existing home input, task-specific downstream-AI instructions, evidence gates, arithmetic helpers and regression coverage. No new task menus, main write, merge, deployment, URL change or trusted numeric activation.

## Capability matrix

Every row has three new scenarios: ordinary input, missing/conflicting evidence, and hostile instructions in a purported file. All run on desktop and mobile, including actual form submission and verified clipboard contents. PASS describes the prompt workflow only; it does not certify the downstream AI answer or a real construction estimate.

| Task | Baseline observation | Added deliverable | Current scope |
|---|---|---|---|
| T01 Takeoff | GP007; generic takeoff workflow | Drawing/position, dimensions, unit, formula, unreadable areas | PASS prompt; real PDF/drawing extraction NOT TESTED |
| T02 BOQ/Pr4 | GP007; no T02 contract | Line quantities, material/labor rates, amounts and source columns | PASS prompt; official rates BLOCKED until supplied/verified |
| T03 Pr5/Pr6 | Probe routed GP011, evidence gate false | Reconcile Pr4 categories and totals, Factor F conditions, duplicate tax/factor checks | PASS prompt; verified Factor F BLOCKED |
| T04 Reference price | GP007; no T04 contract | Rates by place/time, Factor F, conflicts and unresolved total | PASS prompt; official price certification BLOCKED |
| T05 Drawing review | GP007; no T05 contract | Location, discrepancy, severity and designer review | PASS prompt; engineering certification outside AI authority |
| T06 Construction TOR | GP003; generic procurement workflow | Technical scope, standards, measurable acceptance, engineering primary/procurement support | PASS prompt; procurement procedure questions retain GP003 |
| T07 Contract | GP007 but evidence gate false | Contract/TOR/drawing/BOQ and installment/guarantee/authority checks | PASS prompt; legal conclusions require primary evidence |
| T08 Supervision | GP007 but evidence gate false | Daily record template, quantities, actual tests, issues and responsibilities | PASS prompt; no invented site inspections |
| T09 Acceptance | GP007; generic acceptance workflow | Contract comparison, test results, pending items and accountable owner | PASS prompt; actual acceptance remains human authority |
| T10 Variation | GP007 but evidence gate false | Before/after quantities, price, time, reason, alternatives and authority boundary | PASS prompt; change approval remains human authority |
| T11 K | Existing K routing/rulepack | Eligibility vs amount, matching formula/indices/period, discrepancy table | PASS prompt; real indices/formula/eligibility BLOCKED until verified |
| T12 Maintenance | GP007; no T12 contract | Symptoms, urgency, hypotheses, repairs and follow-up plan | PASS prompt; real structural safety assessment NOT TESTED |

## Proven causes and minimal repairs

1. **Coverage gap:** Existing six-action engineering detection did not define task-specific outputs for all twelve tasks. Reproduced baseline results are in `evidence/engineering-round2/baseline-defects.json`: T03 falls to GP011; T07/T08/T10 lack evidence gates. Add a small scoped module after the orchestrator. It wraps existing routes/prompt generation, preserves Shared Context, applies engineering gates and appends deliverable contracts. No broad router or backend rewrite.
2. **Scope boundary:** Construction TOR technical drafting uses engineering; explicit procurement methods and publicity remain under their original routing. Negative tests cover GP003/GP012. Multi-task requests retain each matching deliverable. Same-request elliptical follow-ups may use facts/desiredOutput; document names alone cannot select a task and no mutable prior-task state is stored.
3. **Arithmetic:** `Number(null)`/blank strings could produce zero; invalid declared totals could become NaN and escape mismatch checks. Reproduced on base. Reject absent/coerced/nonfinite/overflow values in the independent test validator. Preserve all pre-existing assertions and add ten adversarial arithmetic tests. This validator is QA code, not a claim that the browser has an official pricing engine.
4. **Rule-first helper:** Expose pure rectangular-volume (metres) and BOQ-line arithmetic on explicit typed numeric inputs, keeping raw results and Decision Lock. No automatic extraction from prose/images, official rate lookup, inferred Factor F or K calculation is introduced. These helpers are API-tested; the current UI continues to produce handoff prompts.
5. **Evidence:** All new task prompts explicitly retain Official Source/Authority/Version/Evidence, Decision Lock, Human Review, prohibition on invented inputs and engineering/price certification boundaries. Their presence is tested in copied prompts; downstream-model compliance is not claimed.
6. **Release gate reach:** The old engineering browser workflow triggered only when its test/workflow file changed. Include relevant core/UI/build/test paths; test built dist, execute new rule/arithmetic tests and both browser suites, and upload both evidence directories. Correct the clipboard summary counter to recognize its actual `PASS (method...)` strings and assert zero unverified copies. Existing assertions are preserved.

## Validation

- New workflow/routing/context/security/calculation tests: **58/58 PASS** (includes the 36 new task scenarios).
- Independent estimate validator: **14/14 PASS**, including its four existing tests and ten additions.
- Full `npm test` chain: PASS before the last isolated validator change; final **`node --test` 846/846 PASS** after that change. Unchanged chain scripts remain covered by the prior successful run; no previous base CI is relabeled as new-branch CI.
- New real-browser submit/copy suite: **72/72 PASS**, 36 scenarios × two viewports; zero unverified copies. `evidence/engineering-round2/twelve-results.json` records each case. The browser suite tests built dist and does not mock successful clipboard writes.
- Existing six-menu browser regression: **60/60 PASS**, zero unverified copies; companion `evidence/engineering-round2/six-results.json`.
- Mobile workflow runtime/privacy suite: PASS; FAT desktop/mobile UI: **24/24 PASS**.
- Security invariants and public-beta privacy/security: PASS; syntax and build: PASS.
- No assertion was removed or weakened. A first local browser attempt could not reach a server started in a separate network namespace; this was a harness failure. Re-ran with server and browser in one process environment. Final results above are the successful attempt, not the failed attempt.

## Existing GitHub evidence inspected

Main SHA: P0 **38711634122**, job **116344154141**, success; Security **38711634030**, job **116344154395**, success. Job logs were fetched and inspected. P0 artifact metadata: **11961585333** (`p0-test-log`, SHA256 `da1e22045b2e04e440c75039a86d39ca3991594ee23c5c8c0b6fa2f7c3c8ae9c`) and **11960957031** (`fat-ui-evidence`, SHA256 `0c2d553bfc95234af6fafa83ddecbf72a2559382cfc3fcdc2fa7f5041e9061ce`). Archive bytes were not independently downloaded in this round. Baseline evidence is reused only for unchanged baseline context.

PR323 is now closed/merged (head `d73367a63f166d5adf53f136fdc0a747ac261c29`), but its readiness document still records trusted numeric NO-GO. Active workflow files contain no newly enabled trusted numeric workflow. Main deploy run **38711634061** remains pending with zero jobs; Pages run **38711632522** and production-surface run **38711639252** report success at base SHA. This branch does not attempt production closure or cancel/trigger deployment.

## Outstanding work and decision

- **BLOCKED:** Trusted numeric hold points and private/admin/custodian/executor/WORM evidence described in `construction-pr323-final-readiness-report.md`. The user has not supplied those evidence packages here. Do not infer verification from passing synthetic tests or merged PR323.
- **NOT TESTED:** Real blind-file numeric acceptance, sealed comparison, professional engineering certification, actual official rate/Factor F/K correctness for a live project, and downstream AI generated deliverable quality.
- **NO-GO:** Merge/deploy/production release and trusted numeric activation. User explicitly forbids release in this round.
- **GO:** Draft PR review of the tested prompt capability and arithmetic-validation scope after local gates pass. Final PR SHA and new GitHub checks/artifacts are reported in the PR summary; they are not inferred from baseline runs.

Rollback: close the unmerged draft and delete only its feature branch if subsequently authorized. No production rollback is necessary because production is untouched.
