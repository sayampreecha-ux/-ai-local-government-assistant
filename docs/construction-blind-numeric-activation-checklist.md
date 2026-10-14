# Construction Blind Numeric Acceptance — Activation Checklist

PR #323 baseline: 335638a937daa8ba8fb64a29a05a574d123be5bb. **NO-GO until all mandatory gates have evidence.**

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
