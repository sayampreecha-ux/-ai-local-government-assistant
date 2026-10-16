# PR #325 patch delivery — 2026-10-16

## Scope and provenance

Prepared candidate: `02966052d3862cce135efc9ad4e92fc580deb4f9`; parent/published baseline: `1d035f4c5592917f8f190207033e20c0ddb7ceb0`. Main at preflight: `c3e4bf2cab4566473ba9bccf5aecd2495535a50c`.

The candidate preserves technical drawing/acceptance/maintenance/contract deliverables instead of imposing an estimate-only A/B/C/D contract. Explicit estimates and mixed requests retain that contract. Evidence, Decision Lock and Human Review remain enforced.

Existing local candidate evidence is reused, not rerun: unit/contract 86/86, node regression 854/854 (full npm test chain PASS), actual-submit/clipboard desktop/mobile 16/16 and build PASS. Evidence pack `GovPrompt_PR325_Closeout_Pack.zip` SHA256: `6d14952ad34f52ccab41e5e90aa98ec6ab3f10d0a89ee357830679fe0e60f216`. These are prior local results, not new GitHub CI results.

This delivery additionally wires the existing 16-case browser test into Engineering Six-Menu Acceptance and uploads its results/copied prompts/screenshots. No existing assertion or suite is removed. CI results for the delivered HEAD will be recorded in the PR after inspection.

## Nondeploying delivery basis

On 2026-10-16 the owner explicitly confirmed disabling and saving non-production branch Builds for BOTH `ai-local-government-assistant1` and `ai-local-government-assistant`, retaining production branch `main`. This is OWNER-ATTESTED, not an API/dashboard inspection by this execution agent. No claim is made about exact prior UI values or independent verification.

Inspected repository workflows: Cloudflare deployment requires push to main; GitHub Pages deployment requires main. The feature ref update does not satisfy either deployment condition. No deployment workflow will be dispatched, no Main ref moved, and no Trusted Numeric workflow activated. The existing independent Cloudflare integration is covered by the owner's confirmation, not by these GitHub Actions guards.

## Rollback without incidental deployment

Keep both Workers' non-production Builds disabled throughout review and rollback. To undo this unmerged patch, retain/close the draft PR without merging, or revert this delivery's commits ONLY on the feature branch after rechecking the main-only deploy guards and both disabled preview controls. Never reset or force-push Main. A feature-branch revert still runs ordinary CI; it must not be used as a way to test deployment behavior.

Restoring Cloudflare settings is a separate integration-admin action: exact previous settings were not independently captured, so do not infer an exact restore value. Do not re-enable previews during this nondeploying task. Before later restoration, the integration admin must inspect the actual UI/official semantics for queued or immediate builds, retain any available build-start prevention control, and obtain separate authorization if restoration can start a deployment. If a nondeploying restoration cannot be established, leave previews disabled. Do not reconnect the repository or click Deploy to restore settings. The live Worker is not rolled back by this procedure.

## Outstanding acceptance and owners

- Independent downstream nonnumeric AI acceptance: BLOCKED/NOT TESTED. Executor owner and independent QA supply an approved callable executor/session, actual prompt/output/source provenance and reviewer record. Seven prior conversation-generated drafts do not satisfy independence.
- HP0: release/repository authority supplies named independent roles and scoped signoff.
- HP1: GitHub/security/infrastructure owners supply actual isolation/ref/reviewer/runner/secret-boundary evidence; denial canary NOT TESTED.
- HP2: custodian/auditor/executor/storage owners supply custody, independent input digests, pinned executor/config/source and private storage evidence. Do not rediscover/download blind inputs or sealed answers for this delivery.
- HP3: authorized actual output and independent immutable-lock/readback evidence NOT TESTED/BLOCKED.
- HP4: independent sealed grading NOT TESTED; permitted only after required lock receipt in a separately authorized process.
- HP5: acceptance authority provides full evidence and separate release decision; BLOCKED.

Patch readiness depends on delivered-head CI. Full-system downstream/numeric acceptance, Trusted Numeric activation, Merge and Deploy remain NO-GO. This task does not approve them.
