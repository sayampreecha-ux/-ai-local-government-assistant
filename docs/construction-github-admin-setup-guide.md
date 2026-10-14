# GitHub Admin screen-by-screen setup — Construction PR #323

**Draft only. Do not enable workflow, dispatch numeric test, merge, deploy, change production URL, or access sealed key.** Baseline SHA: 61615d448208c88554ade09c8ded5c30f89b2747. The available GitHub connector cannot read/change Environment, Secrets, Runner Groups or external immutable storage. Admin must provide screenshots/exports; until verified all controls are BLOCKED.

## HP0 — Authorization and repository inventory
1. Open repository **Settings → General**, note repository visibility, default branch and GitHub plan/organization ownership. Do not assume default branch is main.
2. Open **Settings → Collaborators and teams / Access**, record who is repository admin, security custodian, environment reviewer, infrastructure operator, blind input custodian, independent verifier and WORM storage administrator. Record real names only in private approval records.
3. Record signed scope-limited approval for **configuration and denial testing only**. Do not authorize workflow execution, numeric processing, merge or deployment.
4. Capture: repository/settings screenshots with secrets redacted, branch name, owner signoff, approval timestamp, and ticket ID.

## HP1-A — Protected Environment
1. Navigate **Repository → Settings → Environments → New environment**; propose `construction-blind-operator-approval`.
2. Configure **Required reviewers** (independent reviewers, not the person triggering a run) and **Prevent self-review** where supported. Verify actual repository visibility, plan and protection-rule availability; if unavailable mark BLOCKED and do not substitute an unprotected workflow.
3. Under **Deployment branches and tags**, choose **Selected branches and tags** and restrict to the confirmed protected default branch. Protect that branch under **Settings → Branches / Rules → Rulesets** as applicable.
4. Capture environment name, reviewer identities (private), self-review restriction, selected branch pattern, branch protection/ruleset and independent review approval.

## HP1-B — Environment Secrets
1. Open **Settings → Environments → construction-blind-operator-approval → Environment secrets → Add secret**. Store only necessary input digests and approved executor credentials. Never paste secret values into a PR, workflow log, screenshot, issue or artifact.
2. Confirm workflow job references only environment-scoped secrets; do not rely on repository-level secrets for the trusted job. Audit organization-level secrets access separately.
3. Ensure no `pull_request`, `pull_request_target`, untrusted `workflow_run`, fork, or PR checkout path can invoke the privileged workflow with secrets.
4. Verify GitHub token permissions are minimal; prefer ephemeral credentials and explicitly scoped outbound access.
5. Capture **names only**, scope, authorized reviewers, creation/change audit and security signoff.

## HP1-C — Runner Group
1. Navigate **Organization → Settings → Actions → Runner groups** (or repository Actions runner settings if eligible); determine actual availability for account/plan. Create a dedicated runner group with repository and workflow restrictions when supported.
2. Provision a **single-use ephemeral self-hosted runner** in a separate trust domain; ensure the group is accessible only to the approved protected workflow, not PR CI. Do not register a persistent shared runner.
3. Use isolated least-privilege OS identity, private staging paths outside checkout, restrictive egress and filesystem ACLs. The runner must never contain sealed key or QA_Gates.
4. Record runner group, runner ID/labels, allowed repository/workflow, image digest, network policy, registration/teardown logs, independent security signoff.

## HP1-D — Secrets denial test (safe, no real secrets)
1. Security admin prepares a **dummy canary environment secret**, not a production credential; agree on an opaque expected result recorded privately.
2. After separate HP0 authorization for a harmless denial test, run only a separately reviewed **unprivileged test workflow without the protected environment**, in PR context, whose logic asserts the canary is absent. Do not attempt to echo, dump or exfiltrate any secret; capture only PASS/FAIL of absence. **This result alone is not proof of protected-job isolation.**
3. Independently review every reachable workflow trigger (including pull_request_target, workflow_run, workflow_call and dispatch), checkout/ref selection, reusable workflows, job dependencies, environment reviewers, and runner-group allowlists. Confirm no path permits untrusted PR code to execute on the privileged runner or consume protected secrets. Inspect ruleset, environment gate and audit trail without invoking the numeric workflow. The unprivileged canary check is only one negative test, **not sufficient acceptance evidence**.
4. Remove the dummy canary after test; archive only redacted evidence and reviewer signoff. If any secret appears accessible, if a trigger/ref/runner bypass exists, or if denial cannot be proven, **FAIL CLOSED**. Never run an unauthorized privileged job to test this boundary.

## HP2 — Blind evidence and approved executor (preflight only)
1. Blind custodian signs the SHA-256 manifest for exactly `blind_input.pdf` and `blind_input_no_answer_key.xlsx` and stages files read-only outside checkout; no sealed answers or QA_Gates.
2. Independent auditor verifies hashes, filename, regular-file status, access controls, directory listing and transfer receipts; no numeric execution.
3. Executor owner provides signed digest of the operator-controlled executable/config, data retention terms, network allowlist, timeout and resource limits. An absolute path alone is **not** an approval.
4. Storage owner shows immutable WORM/object-lock policy and independent readback procedure; do not store actual numeric output until separately approved.
5. **Blocking prerequisite:** proposed workflow checks out protected default branch but numeric scripts currently belong to PR #323. Require independently reviewed promotion to trusted protected source or pinned runner image under separate approval. Never checkout PR HEAD in a secret-bearing job.

## Evidence form — complete privately

| HP / Gate | Accountable owner | Required record | Actual evidence ID/link | Reviewer / date | Verdict |
|---|---|---|---|---|---|
| HP0 / T12 | Release authority | Scoped setup approval, repository/default branch/plan | PENDING | PENDING | BLOCKED |
| HP1 / T1 | Infrastructure admin | Ephemeral runner ID, runner-group restriction, isolation, teardown | PENDING | PENDING | BLOCKED |
| HP1 / T2 | GitHub admin | Environment protection, required reviewers, branch restriction | PENDING | PENDING | BLOCKED |
| HP1 / T3 | Security admin | Environment secret scope, denial test, audit trail | PENDING | PENDING | BLOCKED |
| HP2 / T4 | Blind input custodian | Private transfer manifest and access audit | PENDING | PENDING | BLOCKED |
| HP2 / T5 | Independent auditor | Actual input SHA256 verification | PENDING | PENDING | NOT TESTED |
| HP2 / T6 | Executor owner | Binary/config hash and approval | PENDING | PENDING | BLOCKED |
| HP3 / T7 | QA operator | Actual prompt and provenance hash | PENDING | PENDING | NOT TESTED |
| HP3 / T8 | QA operator | Raw numeric A-D, concrete, formwork, Factor F, Decision Lock | PENDING | PENDING | NOT TESTED |
| HP3 / T9 | WORM storage admin | Immutable receipt, retention lock, independent readback | PENDING | PENDING | BLOCKED |
| HP4 / T10 | Independent verifier | Post-lock sealed grading and signed comparison | PENDING | PENDING | NOT TESTED |
| HP5 / T11 | QA reviewer | CI run, exact SHA, regression/security and artifact digest | 38492781875 / 11861854875 on baseline SHA | QA logs verified | PASS (prompt scope) |

## HP3–HP5 — explicit stop conditions
- HP3 requires separate authorization to run AI; save actual prompt/output first, lock them immutably and independently verify readback before any answer-key access.
- HP4 is performed by a different authorized verifier **only after HP3 lock proof**. Compare A–D, concrete, formwork 42,000 THB, Factor F and Decision Lock per-cell without fabricated expected numbers.
- HP5 requires signed numeric acceptance; **numeric PASS is prohibited before real execution**. Merge/deploy require their own explicit approval and must preserve the production URL.

**Current decision: NO-GO for trusted numeric execution and production release.**
