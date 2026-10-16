# GitHub Admin Approval & Evidence Request — GovPrompt Construction QA PR #323

**To:** GitHub Repository Administrator; Security Approver; Infrastructure/Runner Administrator; Blind Evidence Custodian; Independent Evidence Auditor; AI Executor Owner; WORM Storage Administrator; Release Authority  
**Subject:** Request for **HP0–HP2 configuration-only authorization and independently reviewable evidence** — PR #323  
**Date:** 2026-10-14  
**PR:** https://github.com/sayampreecha-ux/-ai-local-government-assistant/pull/323  
**Reviewed HEAD:** `a39a83f77ea68a27ff2a7551471912767a0363f7` (recheck HEAD before acting)  
**Source report:** [Final Readiness Report](construction-pr323-final-readiness-report.md)  
**Evidence checklist:** [HP0–HP2 Evidence Acceptance Pack](construction-hp0-hp2-evidence-acceptance-pack.md)  
**Admin instructions:** [Admin Setup Guide](construction-github-admin-setup-guide.md)  
**Operator guidance:** [Trusted Runner Runbook](construction-trusted-runner-operator-runbook.md)  
**Decision:** **NO-GO** for trusted numeric activation, sealed grading, merge and deploy.

## 1. Decision requested (strictly limited)

Please approve **only** collection/review of configuration evidence, and—if specifically signed under H0-03—a separately reviewed **unprivileged, harmless dummy-canary absence test**. This request does **not** authorize privileged workflow execution, real blind numeric tests, access to sealed answer key or QA_Gates, use of real secrets, merge, deploy, or production URL change.

Record **approver, role, scope, ticket/reference ID, approval UTC, expiration UTC and explicit exclusions** in a private signed record. Absence of approval means **BLOCKED**.

## 2. Evidence requested and acceptance criteria

| ID / gate | Accountable owner | Private evidence to submit | PASS criterion | FAIL / BLOCKED |
|---|---|---|---|---|
| H0-01 / HP0 | Repository admin | Actual repository owner/visibility, plan, default branch, feature availability and dated screenshots/export | Independently verified actual settings | Unsupported/unsafe setting = FAIL; no access or evidence = BLOCKED |
| H0-02 / HP0 | Release authority | Named separation-of-duties matrix: admin, security, runner operator, custodian, auditor, executor, WORM owner, independent verifier | Independent roles assigned, no self-approval | Conflicting duties = FAIL; unsigned matrix = BLOCKED |
| H0-03 / HP0 | Release authority | Signed **configuration-only** approval, ticket, expiry, exclusions | Explicit limited approval | Unauthorized action = FAIL; missing approval = BLOCKED |
| H1-01 / T2 | GitHub admin | `construction-blind-operator-approval` environment rules, required independent reviewers, prevent self-review, plan support | Rules demonstrably enforce independent review | Bypass/self-review = FAIL; inaccessible settings = BLOCKED |
| H1-02 / T2 | GitHub admin | Confirmed protected default branch, environment selected branch/tags, workflow-source rulesets and bypass inventory | Trusted ref and workflow source protected; bypass accounted for | PR/untrusted ref permitted = FAIL; missing proof = BLOCKED |
| H1-03 / T3 | Security admin | **Names/scopes only** of environment/repo/org secrets, access grants, GITHUB_TOKEN permissions, audit records | Privileged secrets inaccessible from untrusted PR contexts | PR access found = FAIL; settings unavailable = BLOCKED |
| H1-04 / T1 | Infrastructure admin | Dedicated ephemeral runner group, workflow/repo allowlist, image digest, egress/ACL/isolation policy, teardown attestation | Runner restricted to trusted workflow and destroyed after single use | PR can schedule runner or runner reused = FAIL; no attestation = BLOCKED |
| H1-05 / T1–T3 | Security admin + GitHub admin | Signed graph of all `pull_request`, `pull_request_target`, `workflow_run`, `workflow_call`, `workflow_dispatch`, checkout/ref, artifacts, reusable workflows, job permissions, environment and runner-group reachability | No path from PR-controlled code/artifacts to privileged secret or trusted runner execution | Any reachable untrusted-to-privileged path = FAIL; unreviewed edge = BLOCKED |
| H1-06 / T3 | Security admin + independent reviewer | Only after H0-03: safe unprivileged dummy-canary **absence** test ID, masked logs, expected/actual, audit, cleanup receipt | Dummy secret absent in PR context **and** H1-01..05 independently verified | Secret reachable = FAIL; not run = NOT TESTED. Canary alone never passes T3 |
| H2-01 / T4 | Blind custodian | Private custody/transfer manifest for exactly `blind_input.pdf` and `blind_input_no_answer_key.xlsx`, directory listing, ACLs, receipt | Exactly two allowed files, staged outside checkout; no sealed material | Sealed file present or unauthorized access = FAIL; absent files = BLOCKED |
| H2-02 / T5 | Independent evidence auditor | Out-of-band signed expected SHA-256; actual file digests, regular-file/non-symlink and read-only staging checks, UTC witness | Both real digests match, files regular/non-symlink, staged read-only | Mismatch/symlink/writable = FAIL; no real test = NOT TESTED |
| H2-03 / T6 | Executor owner + security | Approved AI executable **and config** digests, image/source provenance, runtime limits, egress and retention review | Exact binary/config pinned and independently approved | Unpinned/unknown executable = FAIL; no proof = BLOCKED |
| H2-04 / T6 | GitHub admin + security | Protected immutable script SHA, trusted build provenance, checkout/ref proof | Privileged job uses trusted pinned source; **never PR HEAD** | PR checkout in secret-bearing job = FAIL; no proof = BLOCKED |
| H2-05 / HP2 (T9 prerequisite) | WORM storage admin | Independent object-lock policy, retention, delete/overwrite denial model, future independent readback plan | WORM design and independent verification approved; **no numeric-output lock claimed yet** | Mutable/owner-overridable path = FAIL; no evidence = BLOCKED |

**Verdict rules:** PASS only after independently inspected, timestamped actual evidence. FAIL when a demonstrated unsafe configuration or integrity mismatch exists. BLOCKED for missing permissions, approvals or documents. NOT TESTED for checks not executed. No assumption of PASS from passing PR CI.

## 3. Required PR-to-Secrets / PR-to-Runner verification (no privileged execution)

1. Admin exports **all workflow triggers** and cross-workflow edges, including reusable workflows, artifact consumption, dispatch and branch/ref resolution. Identify untrusted PR-controlled source and artifact entry points.
2. Security reviewer traces each path to job `permissions`, environment protection, organization/repository/environment secret availability, runner group, `runs-on` labels and checkout source. Include `pull_request_target`, `workflow_run` and `workflow_call` escalation paths; do not assume a label is an access-control boundary.
3. Verify actual required reviewers, prevent-self-review, bypass privileges, branch protection, runner-group **workflow allowlist**, dedicated ephemeral isolation and teardown. A configuration screenshot alone without access-path analysis is insufficient.
4. Following **separate H0-03 approval only**, run a **nonprivileged** PR-context dummy-canary absence check; never attach protected environment or privileged runner; never echo/exfiltrate values. Save masked logs, audit and cleanup evidence. Do **not** run a trusted numeric job as a denial test.
5. Independent reviewer signs a deny matrix covering every path. Any reachable PR-to-secret/runner path => **FAIL and stop**. Missing ability to inspect a path => **BLOCKED and stop**. The dummy-canary check by itself does not establish PASS.

## 4. Submission requirements

Send evidence **privately** via approved access-controlled channel, **not** in public PR comments, repository commits, issue text or GitHub Actions artifacts. For each H0/H1/H2 evidence ID provide: original source/screen, UTC timestamp, owner, independent reviewer, redacted export or screenshot, SHA-256 of evidence (where applicable), private reference, expected/actual, and verdict. Never submit real secret values, tokens, sealed answer key, QA_Gates, or raw blind files to this repository.

**Reply format:**

| Evidence ID | Owner | Independent reviewer | UTC | Private reference / SHA-256 | PASS / FAIL / BLOCKED / NOT TESTED | Exception / remediation |
|---|---|---|---|---|---|---|
| H0-01 … H2-05 | | | | | | |

Include an explicit final signature for HP0, HP1 and HP2 separately; a signature for one HP does not approve the next. If a setting is unavailable due to plan/permissions, report **BLOCKED** and request independent architecture review; do not silently substitute an unsafe runner or unprotected environment.

## 5. Current gate disposition and release lock

**HP0 BLOCKED; HP1 BLOCKED; HP2 BLOCKED; HP3 NOT TESTED; HP4 NOT TESTED; HP5 BLOCKED.**  
**T1–T4 BLOCKED; T5 NOT TESTED; T6 BLOCKED; T7–T8 NOT TESTED; T9 BLOCKED; T10 NOT TESTED; T11 PASS (prompt/synthetic scope at reviewed SHA); T12 BLOCKED.**

Latest reviewed SHA `a39a83f77ea68a27ff2a7551471912767a0363f7`: five GitHub Actions workflows SUCCESS and standalone Construction Full-Site SKIPPED by its PR guard; embedded Full-Site 20/20 PASS. Construction Blind Run **38514441066** (negative 9/9, regression 500/500, engineering 6/6, pilot 30/30, full-site 20/20); P0 Run **38514440939** (778 pass, 0 fail; FAT UI 24 pass, 0 fail). This is **not** numeric acceptance or security-admin configuration proof. GitHub-reported artifacts: Blind **11871256401**, P0 log **11870558864**, FAT UI **11871311177**. See Final Readiness Report for historical and gate detail.

**Do not enable or dispatch the PROPOSED Trusted Numeric workflow.** Its reviewed_sha label, runner labels, absolute executor path and local hash do not by themselves prove protected checkout, workflow-scoped runner access, pinned binary/config or independent WORM retention. No sealed grading, real numeric execution, merge, deploy or production URL change is permitted by this request.

**Requested response:** Please return HP0–HP2 evidence matrix and a written **configuration-only** approval or explicit BLOCKED/FAIL reasons. Future numeric activation and any production release each require separate, new authorization.
