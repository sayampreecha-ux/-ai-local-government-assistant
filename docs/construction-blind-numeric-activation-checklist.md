# Construction Blind Numeric Acceptance — Activation Checklist

PR #323 checklist baseline: b83247833d586eebfdf1759e1aac316cff034aab (previous passing CI on this SHA: run 38489487180). **NO-GO until all mandatory gates have evidence.**

| Gate | Acceptance criterion | Required evidence | Current status |
|---|---|---|---|
| T1 Trusted runner | Ephemeral isolated runner, dedicated labels, least-privilege OS account, clean teardown, outbound egress restricted | Runner inventory, provisioning policy, execution logs, teardown evidence | BLOCKED — not observed |
| T2 Protected environment | Separate protected default-branch workflow, mandatory reviewer approval, restricted deployment branch, no PR checkout with secrets | Environment rules screenshot/export, branch protections, audit trail | BLOCKED — not observed |
| T3 Secrets boundary | Only protected job obtains digests and AI credentials; no secrets exposed to PR workflows, forks, logs or artifacts | Access matrix, negative privilege test, masked-log review | BLOCKED — not observed |
| T4 Blind file transport | Authorized staging of exactly blind_input.pdf and blind_input_no_answer_key.xlsx outside checkout, path allowlist, no sealed key or QA_Gates in runner | Operator upload manifest, staging directory listing, access audit | BLOCKED — not observed |
| T5 Input integrity | Real SHA-256 match out-of-band trusted digests, regular-file and format checks, fail closed on mismatch/missing | Signed/hash-pinned input manifest, gate run logs | NOT TESTED with real files |
| T6 Reviewed executor | Operator-controlled binary/config reviewed and pinned by hash, timeout/resource/egress restrictions; PR cannot choose executor path | Binary digest, approval, execution trace | BLOCKED — not provisioned |
| T7 Actual prompt | Actual generated prompt and provenance captured before numeric output; prompt SHA-256 recorded | Immutable prompt object ID and digest | NOT TESTED |
| T8 Numeric output | Actual AI output with A/B/C/D tables, quantities/formulas, source positions, concrete, formwork, Factor F, Decision Lock and uncertainty | Full raw JSON, content digest, execution trace | NOT TESTED |
| T9 Immutable evidence | Prompt, output and manifest sealed in independently administered WORM/retention-lock storage; verify readback and lock | Storage object versions, digest, retention policy, readback hash | BLOCKED — not provisioned |
| T10 Sealed comparison | Separate principal accesses answer_key_sealed.pdf / QA_Gates only after immutable T9 receipt; independent per-cell comparison; no invented values | Signed comparison report and audit log | NOT TESTED |
| T11 Regression | Syntax + 9 negative tests, Blind E2E 14/14, Regression 500/500, Engineering 6/6, Full-site 20/20, Security | GitHub Actions run 38487892466; artifact 11860108787 | PASS for synthetic/prompt scope |
| T12 Release authorization | Explicit separate approval for any merge or deploy; retain production URL | Signed human approval | NOT GRANTED |

## Required authorization
1. Approve a dedicated ephemeral runner and trusted file staging channel; assign a responsible operator.
2. Approve protected environment reviewer/branch rules and independent secret administration; do not enable untrusted PR code with credentials.
3. Approve the pinned downstream AI executor and network/data handling policy.
4. Approve immutable evidence storage, retention and independent sealed-key verifier.
5. Authorize **numeric test only**, not merge or production deployment.

## Execution order and decision lock
Trusted operator provisions T1–T6 -> generate/capture actual prompt T7 -> execute and capture numeric T8 -> independently lock and verify T9 -> separate verifier unseals and grades T10 -> human reviews all evidence. Until then mark numeric acceptance NOT TESTED and release NO-GO. Never include sealed answers, QA_Gates, tokens or raw sensitive files in public GitHub artifacts.

## Scope caveat
The proposed trusted workflow is a documentation template, not an enabled protected workflow. Its source alone cannot prove branch restrictions, environment approval, runner isolation, or immutable storage. The existing numeric wrapper produces a hash manifest but does not implement WORM storage or independent sealed comparison. Any operator-configured executable must be pinned and reviewed before activation.

## Activation responsibility and permission matrix (roles; individuals not assigned)

| Gate | Accountable role | Minimum permission / approval | Evidence owner and acceptance |
|---|---|---|---|
| T1 | Infrastructure administrator | Provision single-use isolated runner; runner registration restricted; no persistent credentials | Infra owner signs inventory, isolation test, teardown log |
| T2 | GitHub repository administrator | Configure protected environment, required reviewers, restricted branch and no self-approval | Repo admin exports protection rules and audit log; security reviewer verifies |
| T3 | Security / secrets custodian | Environment-scoped secrets only; no PR or fork access; no credential print | Security owner supplies access matrix and denied-access test |
| T4 | Blind input custodian | Upload only two allowlisted files into private staging, read-only to runner; no sealed evidence | Custodian signs file inventory, transfer and access logs |
| T5 | Independent evidence auditor | Receive SHA256 out of band; read-only verification; fail closed on mismatch | Auditor signs actual runner hash verification report |
| T6 | AI executor owner and security reviewer | Approve immutable executor binary/config digest; restrict network and execution rights | Dual approval of executable digest and invocation trace |
| T7 | QA operator | Run approved prompt generator, no sealed evidence access | QA owner seals prompt, provenance and hash |
| T8 | QA operator | Execute approved AI only against blind inputs | QA owner captures unmodified numeric JSON, A-D and Decision Lock |
| T9 | Independent evidence storage administrator | WORM/object-lock write-once policy; no delete/overwrite for QA operator | Storage admin provides object ID, retention, readback hash and lock proof |
| T10 | Independent sealed-key verifier | Read sealed key only after T9 signed receipt; cannot change actual output | Verifier signs per-cell comparison and exception report |
| T11 | CI/QA reviewer | Read-only CI/log/artifact access | QA reviewer validates all required checks at exact HEAD |
| T12 | Authorized release approver | Separate explicit approval for merge/deploy, outside numeric-test authorization | Signed decision; absent approval means NO-GO |

## Activation sequence and hold points

**HP0 — Operator authorization:** nominate real owners for T1–T10, approve private staging and WORM service, and record approved executor hash. No credentials or sealed keys in PR comments or CI artifacts.

**HP1 — Infrastructure evidence:** security reviewer checks runner isolation, environment protection and secret-denial tests. A proposed YAML file is not proof of configured GitHub controls.

**HP2 — Blind input integrity:** verify the two actual files against independently supplied SHA256 values and assert no sealed material in staging. Abort on any missing or mismatched evidence.

**HP3 — Output sealing:** capture Actual Prompt and Actual Numeric Output, hash both, write to independently administered immutable storage, verify readback and retention lock. Abort if lock cannot be proven.

**HP4 — Sealed grading:** only after HP3 signed receipt, authorize a different verifier to access sealed key and QA Gates, grade A-D per cell, concrete, formwork 42,000 THB, Factor F and Decision Lock. Missing evidence is BLOCKED, not PASS.

**HP5 — Decision:** issue numeric PASS/FAIL with per-cell evidence and separate human review. Merge/deploy require distinct explicit authorization and unchanged production URL.

## Evidence limits at checklist review
- Run 38489487180: syntax/negative 9/9, prompt E2E 14/14, regression 500/500, engineering 6/6, pilot 30/30, full-site 20/20, Security SUCCESS on baseline b83247833d586eebfdf1759e1aac316cff034aab.
- The standalone Full-Site workflow is SKIPPED by its own PR-number guard; 20/20 passed inside the Blind Prompt workflow.
- T1–T10 lack independently verified production-runner and numeric evidence; T12 approval absent. Therefore activation NO-GO.
