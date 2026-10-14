# HP0–HP2 GitHub Admin Evidence Acceptance Pack — PR #323

**Status: PREPARATION ONLY / NO-GO.** Baseline SHA: `d46f1adf1e01f037bfa375f70a3818b728ef439b`. This document is a fillable operator checklist, not evidence that settings exist. No trusted numeric workflow activation, sealed-key access, merge, deploy or production URL change is authorized.

## Evidence handling and decision rules
- Store screenshots, redacted configuration exports, approvals and signed SHA-256 manifests in a **private access-controlled evidence repository**, not public PR comments, GitHub Actions artifacts or repository files.
- Record evidence ID, custodian, UTC timestamp, verified source, reviewer and PASS/FAIL/BLOCKED/NOT TESTED. **PASS only on independently reviewed actual evidence.** Missing permissions, unavailable settings, missing screenshots or inaccessible runner/storage configuration = BLOCKED, not PASS.
- Stop on any PR-to-secret, PR-to-runner, self-review, untrusted checkout or sealed-key exposure route. Never test using production credentials or privileged numeric execution.
- GitHub connector used in this review cannot read or modify Environment, Secrets, Runner Group or WORM configuration. The GitHub admin must attest with actual screenshots/exports and audit logs.

## HP0 — authority and inventory (do not provision until signed)
| ID | Operator action / UI | Required private evidence | Responsible | Verdict |
|---|---|---|---|---|
| H0-01 | Repository Settings → General: confirm owner, visibility, default branch and plan | Screenshot/export, date, reviewer | Repo admin | BLOCKED |
| H0-02 | Settings → Collaborators/Access: assign GitHub admin, security reviewer, runner operator, blind custodian, independent verifier and WORM owner | Private role matrix and separation-of-duties signoff | Release authority | BLOCKED |
| H0-03 | Approve **configuration + harmless denial test only**, explicitly excluding trusted numeric execution and release | Signed scope, ticket ID, approver and expiry | Release authority | BLOCKED |

## HP1 — GitHub protection and secret boundary
| ID | Operator action / UI | Required private evidence | Responsible | Verdict |
|---|---|---|---|---|
| H1-01 | Repository Settings → Environments: create/inspect `construction-blind-operator-approval`; enable independent Required Reviewers and Prevent self-review where supported | Environment protection screenshot, plan support, named reviewers (private) | GitHub admin | BLOCKED |
| H1-02 | Environment → Deployment branches/tags: selected **confirmed protected default branch** only; Settings → Rules/Rulesets: protect workflow source and approvals | Branch/ref patterns, ruleset export, bypass list, signed review | GitHub admin | BLOCKED |
| H1-03 | Environment Secrets: list **names and scope only**; audit repo/org secrets, workflow token permissions and environment references | Redacted scope matrix, audit entries, reviewer signoff | Security admin | BLOCKED |
| H1-04 | Organization Settings → Actions → Runner groups (if supported): restrict to approved repository and **trusted workflow**; provision dedicated single-use isolated runner with no PR jobs | Runner/group ID, workflow allowlist, image digest, ACL/egress policy, cleanup plan | Infra admin | BLOCKED |
| H1-05 | Review **all** workflow triggers, including `pull_request_target`, `workflow_run`, `workflow_call`, dispatch, checkout refs and reusable workflows. Ensure no PR-controlled code can execute with privileged secrets or runner | Trigger/ref threat model, reviewer-signed deny matrix, redacted workflow config | Security admin | BLOCKED |
| H1-06 | Only after H0-03 approval, use an unprivileged PR-context workflow to assert absence of a **dummy canary** secret; no echo/exfiltration, no privileged job, no real credential. Independently verify protected environment cannot be entered via untrusted route | Negative-test run ID, masked logs, reviewer-signed expected/actual, audit trace, dummy-secret cleanup | Security admin | NOT TESTED |

**Fail closed:** A canary absence test is insufficient by itself. If environment protection is unsupported by plan/visibility or runner-group workflow restriction is unavailable, do not substitute a shared self-hosted runner or PR workflow. Escalate for an independently secured alternative and new approval.

## HP2 — blind file and executor preflight (NO NUMERIC EXECUTION)
| ID | Operator action | Required private evidence | Responsible | Verdict |
|---|---|---|---|---|
| H2-01 | Transfer only `blind_input.pdf` and `blind_input_no_answer_key.xlsx` via private approved channel, outside checkout; deny sealed key/QA_Gates | Custodian-signed two-file manifest, directory listing, ACL and transfer receipt | Blind custodian | BLOCKED |
| H2-02 | Verify real files are regular files, no symlinks, hashes match independently provided SHA-256 and staging is read-only | Signed digest comparison, validation logs, independent witness | Evidence auditor | NOT TESTED |
| H2-03 | Pin and approve trusted AI executor binary **and configuration** by hash, execution permissions, timeouts, egress and data retention | Approved digest, image/source provenance, threat review | Executor owner + Security | BLOCKED |
| H2-04 | Verify protected trusted source contains independently reviewed scripts or approved pinned runner image; **never checkout PR HEAD in a secret-bearing job** | Protected source SHA, independent review, trusted build provenance | GitHub admin + Security | BLOCKED |
| H2-05 | Review WORM/object-lock storage plan and independent readback, without running or locking numeric output yet | Storage policy, retention permissions, custodian roles, independent readback test plan | Storage admin | BLOCKED |

## Evidence register — fill in privately
| Evidence ID | Gate | Source / screen / audit log | Captured UTC | Owner | Independent reviewer | Hash / link (private) | Verdict |
|---|---|---|---|---|---|---|---|
| PENDING | HP0 H0-01..03 | PENDING | PENDING | PENDING | PENDING | PENDING | BLOCKED |
| PENDING | HP1 H1-01..06 | PENDING | PENDING | PENDING | PENDING | PENDING | BLOCKED |
| PENDING | HP2 H2-01..05 | PENDING | PENDING | PENDING | PENDING | PENDING | BLOCKED |

## T1–T12 / HP mapping and current disposition
| Gate | HP | Current status | Acceptance dependency |
|---|---|---|---|
| T1 Runner | HP1 | BLOCKED | H1-04 isolation/teardown evidence |
| T2 Environment | HP1 | BLOCKED | H1-01, H1-02 reviewers/branch protection |
| T3 Secrets | HP1 | BLOCKED | H1-03, H1-05, H1-06 boundary and denial |
| T4 Blind transport | HP2 | BLOCKED | H2-01 custody/ACL |
| T5 Integrity | HP2 | NOT TESTED | H2-02 real hash check |
| T6 Executor | HP2 | BLOCKED | H2-03, H2-04 approved immutable source |
| T7 Prompt | HP3 | NOT TESTED | Separately authorized actual prompt and provenance |
| T8 Numeric | HP3 | NOT TESTED | Separately authorized actual AI output A–D |
| T9 Immutable lock | HP3 | BLOCKED | Independent WORM receipt/readback after output |
| T10 Sealed comparison | HP4 | NOT TESTED | Separate verifier **only after T9 lock** |
| T11 CI | HP5 | PASS (prompt scope) | HEAD `d46f1adf1e01f037bfa375f70a3818b728ef439b`, blind run 38500749797, artifact 11865906143, digest sha256:5cbcc8a4cbd2f164786be205c764161a9d64a1cc01c1a9de54916c487e917aab; P0 38500749781 SUCCESS, Security 38500749793 SUCCESS |
| T12 Release approval | HP5 | BLOCKED | Separate signed approval; not granted |

## Hold-point signoffs (private)
| Hold point | Approval required | Current decision |
|---|---|---|
| HP0 | Named roles + written configuration-only authorization | BLOCKED |
| HP1 | GitHub + Security sign environment, runner isolation, trigger/ref review and canary denial | BLOCKED |
| HP2 | Custodian + auditor + executor owner sign blind hashes, no sealed data, approved binary | BLOCKED |
| HP3 | New numeric-test authorization, actual output, independently verified WORM lock | NOT TESTED |
| HP4 | Independent post-lock sealed grading | NOT TESTED |
| HP5 | Signed acceptance and separate release approval | BLOCKED |

**Final decision: NO-GO for trusted numeric activation, sealed grading, merge and deployment.** A passing PR CI does not prove protected environment or secrets isolation.
