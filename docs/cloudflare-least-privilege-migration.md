# Cloudflare least-privilege migration

Status: repository-derived runbook for Issues #33, #34, and #128. Dashboard actions remain manual.

## Deployment inventory

The production workflow builds static assets and runs `pnpm exec wrangler deploy` for the Worker named `ai-local-government-assistant`. `wrangler.jsonc` declares:

- Worker script: `src/search-worker-v2.js` (which extends the fail-closed base Worker)
- static assets binding: `ASSETS`, sourced from generated `dist/`
- four required Worker secrets by name only; no values are stored in the repository
- Workers observability logs at 5% sampling with invocation logs disabled and traces disabled

The Worker source also expects the existing `OFFICIAL_SEARCH_RATE_LIMITER` binding. The repository declares no zone route, custom domain, KV, R2, D1, Queue, Vectorize, Hyperdrive, Workers AI, Browser, Container, Pipeline, or Secrets Store resource.

## Minimum token posture to validate

Create a dedicated replacement token using Cloudflare's **Edit Cloudflare Workers** custom permission and restrict its resources to the single Cloudflare account that owns this Worker. Do not add zone permissions because this repository deploys no route or custom domain. Do not add permissions for storage, databases, AI, queues, containers, account membership, user details, or unrelated products.

Cloudflare may present the permission label or resource selector differently as the dashboard evolves. Treat the dashboard summary and a successful dry run/deploy as the authority; do not broaden scope pre-emptively. If Wrangler reports a missing permission, add only the specific documented permission required by that failed operation, record why, and repeat verification.

## Safe migration sequence

1. **MANUAL REQUIRED — create replacement token.** In the Cloudflare Dashboard, create a new dedicated token with the minimum posture above. Apply an appropriate TTL/IP restriction if compatible with the CI runner. Store the value only in an approved secret store.
2. **MANUAL REQUIRED — configure the replacement.** Replace `CLOUDFLARE_API_TOKEN` in the protected GitHub `production` environment and, if Cloudflare Worker Builds is also enabled for this repository, update that build configuration separately. Do not expose the value in logs, comments, or files.
3. Trigger the normal `main` deployment workflow. Confirm credential validation, pre-deploy Worker security tests, build, and `wrangler deploy` pass.
4. Run production verification: `Verify Production Surface`, production security controls, and a representative synthetic request. A Tavily allowance failure may be recorded as `BLOCKED — TAVILY EXTERNAL ALLOWANCE`; it is not verified evidence and must not weaken other gates.
5. Confirm the deployed Worker, static asset surface, required secrets, rate limiter, logs sampling, traces, and unknown export destinations still match the approved production configuration.
6. **Only after all prior checks pass**, revoke the old broad token. Keep rollback details and the new token's non-secret identifier in the private operator record.

## Rollback

If credential validation or deploy fails, restore the previous token in the protected secret store and redeploy the last known-good `main`. Do not change Privacy Guard, PDPA fail-closed behavior, evidence confirmation, human approval, rate limiting, or Worker security controls to make deployment pass.

## Manual-only checks

- create or change token scope and inspect its dashboard permission summary
- replace Worker Builds/GitHub environment secrets
- inspect sensitive dashboard data or real sampled logs for raw query/PII
- confirm the production binding and export destination inventory in Dashboard
- revoke the old production token after successful verification

No token or secret value belongs in this document, repository, CI output, GitHub issue, or pull request.
