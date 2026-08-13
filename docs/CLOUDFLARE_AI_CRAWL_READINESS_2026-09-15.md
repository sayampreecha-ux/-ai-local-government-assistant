# Cloudflare AI Crawl Readiness — 15 September 2026

Project: GovPrompt Thailand v7
Branch policy: Review in feature branch before merge to `main`

## Objective

Prepare GovPrompt Thailand for Cloudflare's AI crawler controls while preserving public search/GEO visibility and keeping user/private data outside crawler-accessible surfaces.

## Repository checks

- [x] `robots.txt` exists and allows public pages while excluding admin/API/private-style routes.
- [x] `sitemap.xml` exists and points to the canonical public GitHub Pages URLs.
- [x] `llms.txt` exists and describes public-content boundaries.
- [ ] Homepage has canonical, Open Graph, social, robots, and structured metadata.
- [ ] Search/Agent/Training policy is reviewed against the current Cloudflare crawler classification.
- [ ] Public URLs return expected status/content after deployment.
- [ ] Admin/API/private/authenticated/user-submitted content is not exposed as public static content.

## Cloudflare dashboard review before 15 September 2026

1. Open the Cloudflare zone used by the production GovPrompt site.
2. Review **Security Settings → AI bot policies** (wording/location may change with Cloudflare UI updates).
3. Review Search, Agent, and Training separately rather than using a single blanket AI-bot rule.
4. Baseline intent for GovPrompt:
   - Search: allow public discovery.
   - Agent: allow access to public informational surfaces only.
   - Training: explicit owner decision; do not assume that blocking Training has zero impact on mixed-purpose Search crawlers.
5. Confirm that no Cloudflare rule, WAF rule, Bot rule, rate-limit rule, or redirect unintentionally blocks `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/`, `/trust.html`, or `/privacy-notice.html`.
6. Re-test major search crawler access after any Training-policy change.

## Canonical / redirect guardrail

The current public canonical host is:

`https://sayampreecha-ux.github.io/-ai-local-government-assistant/`

Do not introduce an edge redirect to a future custom domain until the final production canonical host has been selected and all canonical URLs, sitemap entries, CORS settings, and crawler policy references are updated together.

## Cloudflare Worker readiness

The repository already defines Worker name `ai-local-government-assistant` with entry point `src/search-worker.js`.

Before moving frontend traffic to a custom/Cloudflare-managed production origin, verify:

- Worker deployment target and route/custom domain.
- `FRONTEND_ORIGIN` / CORS allowlist matches the actual production frontend origin.
- Required secrets are present in Cloudflare and are not committed to Git.
- Any expected rate-limiter binding is configured in the deployed environment.
- API/admin endpoints remain excluded from public crawler discovery and protected by server-side controls.

## Acceptance test

After deployment, verify from an unauthenticated client:

- `GET /robots.txt` → public crawler policy is readable.
- `GET /sitemap.xml` → valid XML and canonical URLs.
- `GET /llms.txt` → public AI context and privacy boundary are readable.
- `GET /` → canonical and GEO/SEO metadata are present.
- `/admin.html` and `/api/` are not treated as public indexed knowledge.
- No user prompt, uploaded file, private data, log, token, or API secret appears in public static output.

## Merge gate

Do not merge this work into `main` until repository review and production-edge review are both complete. Cloudflare dashboard settings are deployment configuration and must be verified separately from repository files.
