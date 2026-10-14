# Trusted Runner operator runbook — PR #323 (PROPOSED; NOT AUTHORIZED)

**No merge, deploy, secret access, sealed-key read, or numeric PASS is authorized by this document.**

## 1. Roles and approvals

| Role | Must approve / do | Evidence to attach privately |
|---|---|---|
| Repository administrator | Verify actual default branch; protect workflow source and environment; require reviewer and restrict eligible branches | Branch/environment configuration export, reviewer identities and audit log |
| Security approver | Threat model PR-to-secret access, self-hosted runner isolation, outbound network, artifact exposure; test denied PR access | Access matrix, denial test logs and signed review |
| Infrastructure owner | Provision one-time self-hosted runner in separate trust domain; register dedicated labels and runner group; destroy after job | Runner ID, provisioning digest, network policy and teardown attestation |
| Blind evidence custodian | Stage exactly two blind files outside checkout; sign independent SHA-256 inventory; never stage answer key or QA_Gates | Transfer receipt, hash manifest, file ACL audit |
| AI executor owner | Approve binary/config digest, allowed AI service, privacy terms, request/response retention, limits | Pinned executor hash, configuration and approval |
| Immutable storage owner | Provision separate WORM/object-lock bucket with retention, no overwrite/delete by operator | Object lock policy, independent readback and retention evidence |
| Independent verifier | Remain unable to see actual output before WORM lock; then access sealed key for grading only | Timestamped T9 receipt and signed per-cell grading |
| Authorized decision maker | Approve numeric test only, then separately any future release | Written scope-limited approval |

## 2. Configuration tasks in strict order

1. **HP0:** Name and approve accountable operators; inventory evidence; record explicit authorization for provisioning only.
2. **HP1:** Verify default branch (do not assume main), required reviewers and restricted environment branches. Configure dedicated ephemeral runner group and deny PR/fork workflows access. Verify approved scripts are available from a protected immutable source **before** enabling template. Do not checkout PR HEAD in a secret-bearing job.
3. **HP1:** Create environment-scoped secrets with least privilege; prohibit repo-wide secrets for this test. Perform independent denial test from PR context and inspect masked logs. Do not log token values.
4. **HP2:** Stage only blind_input.pdf and blind_input_no_answer_key.xlsx with owner-controlled permissions outside workspace. Compare actual SHA-256 against custodian's out-of-band hashes; inspect directory to ensure no answer_key_sealed.pdf or QA_Gates. Reject symlinks, non-regular files, wrong paths and hashes.
5. **HP2:** Verify approved AI executable and config digest against signed manifest; restrict egress, runtime, CPU/memory and file read rights. A mere absolute executable path is insufficient approval.
6. **HP3:** Capture exact prompt and actual raw AI numeric output, including tables A-D, concrete, formwork, Factor F, and Decision Lock. Keep provenance, input/prompt/output hashes and execution logs. Do not grade or read sealed key.
7. **HP3:** Independent storage custodian writes prompt/output/manifest to WORM storage, confirms retention lock and reads back matching SHA-256. Only a verified immutable receipt unlocks HP4.
8. **HP4:** Different verifier opens sealed key after lock and compares per-cell quantities, concrete, formwork 42,000 THB, Factor F, and Decision Lock. Missing or ambiguous evidence remains NOT TESTED/BLOCKED, not PASS.
9. **HP5:** Review signed test report and CI on exact SHA; any merge/deploy requires a **new, separate** authorization. Preserve production URL.

## 3. Hold point decisions

| Hold point | GO criterion | NO-GO trigger |
|---|---|---|
| HP0 | Named owners and scope-limited provisioning approval | Missing authority |
| HP1 | Protected workflow source, environment reviewer, runner isolation, secret-denial evidence | Untrusted PR can execute with secrets; runner reused |
| HP2 | Two blind files hash-verified, sealed material absent, executor pinned | Hash mismatch, unknown executor, sealed evidence accessible |
| HP3 | Actual numeric result captured and independently immutable with readback | Output absent, overwritten, storage lock not proven |
| HP4 | Separate verifier and post-lock per-cell comparison | Early answer key access, grader also controls output |
| HP5 | Signed acceptance and separate release decision | Incomplete evidence or no release approval |

## 4. Current evidence and limitations

- Last verified CI baseline: SHA ced39ca7c798d4f8e77b011ec2481cc74db7fa0d; blind run 38489738638; artifact 11861640408. Syntax/negative 9/9, regression 500/500, engineering 6/6, full-site 20/20 and Security success.
- Standalone full-site workflow skipped by PR guard; full-site 20/20 passed inside Blind workflow.
- GitHub integration used for this review can read repository files and CI results but cannot independently read protected environment, secrets, runner inventory or storage configuration. Mark all unobserved operational controls BLOCKED, never PASS.
- Existing numeric wrapper hashes output but does **not** implement independent WORM lock. Proposed workflow is documentation-only and cannot be enabled safely while reviewed scripts are absent from its trusted source.
- Numeric execution and sealed grading remain NOT TESTED. Production release remains NO-GO.

## Review snapshot — 2026-10-14, PR head 7d1815f

See [Final Readiness Report](construction-pr323-final-readiness-report.md) for the dated CI inventory and HP0–HP5/T1–T12 dispositions. Earlier SHA/run references above are historical evidence, not the current HEAD. T11 is prompt/synthetic scope only; HP0 setup authority does not grant T12 release authority. Proposed YAML remains inactive. Recheck CI on any later commit.
