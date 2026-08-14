# Cloudflare AI Crawl Readiness — 15 September 2026

Project: GovPrompt Thailand v7
Branch policy: Review in feature branch before merge to `main`
Last policy verification: 14 August 2026

## Objective

Prepare GovPrompt Thailand for Cloudflare's AI crawler controls while preserving public search/GEO visibility and keeping user/private data outside crawler-accessible surfaces.

## Repository checks

- [x] `robots.txt` exists and allows public pages while excluding admin/API/private-style routes.
- [x] `sitemap.xml` exists and points to the canonical public GitHub Pages URLs.
- [x] `llms.txt` exists and describes public-content boundaries.
- [x] Homepage has canonical, Open Graph, social, robots, and structured metadata.
- [x] Search/Agent/Training policy is reviewed against Cloudflare documentation current on 14 August 2026.
- [ ] Public URLs return expected status/content after deployment.
- [ ] Public admin shell is confirmed `noindex,nofollow` and all admin data/actions remain protected by server-side authorization.

## Cloudflare policy facts verified 14 August 2026

Cloudflare currently exposes three AI bot behavior classes: **Search**, **Agent**, and **Training**. Each can be configured to **Block on all pages**, **Block on pages with ads**, or **Allow (do not block)**.

Cloudflare states that on **15 September 2026** updated defaults apply to **new domains onboarding to Cloudflare**: Training and Agent are blocked on pages that display ads, while Search remains allowed. On the same date, mixed-purpose crawlers that combine Search and Training become subject to Training blocking as well. Therefore, a Training block can also block crawlers that are needed for Search discovery.

The legacy **Block AI bots** setting is being deprecated on 15 September 2026. Existing site owners should review and explicitly choose their intended Search/Agent/Training behavior before that date rather than relying on an old blanket setting.

## Cloudflare dashboard review before 15 September 2026

1. Open the Cloudflare zone used by the production GovPrompt site.
2. Go to **Security Settings → Configure AI bot policies**.
3. Review Search, Agent, and Training separately rather than using a single blanket AI-bot rule.
4. Baseline intent for GovPrompt:
   - Search: allow public discovery.
   - Agent: allow access to public informational surfaces only.
   - Training: explicit owner decision; do not assume that blocking Training has zero impact on mixed-purpose Search crawlers.
5. Confirm that no Cloudflare rule, WAF rule, Bot rule, rate-limit rule, or redirect unintentionally blocks `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/`, `/trust.html`, or `/privacy-notice.html`.
6. Re-test major search crawler access after any Training-policy change.
7. Review **AI Crawl Control** separately for crawler activity, individual crawler policy, robots compliance, and any managed crawler controls in use.

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
- API/admin endpoints remain excluded from crawler discovery and protected by server-side controls.

## Admin-surface guardrail

`admin.html` may exist as a public static login shell, but it must remain `noindex,nofollow,noarchive` and must not expose privileged data or actions without authenticated server-side authorization. `robots.txt` and meta robots are crawler guidance, not authentication controls.

## Acceptance test

After deployment, verify from an unauthenticated client:

- `GET /robots.txt` → public crawler policy is readable.
- `GET /sitemap.xml` → valid XML and canonical URLs.
- `GET /llms.txt` → public AI context and privacy boundary are readable.
- `GET /` → canonical and GEO/SEO metadata are present.
- `GET /admin.html` → contains `noindex,nofollow` and does not expose privileged data without authentication.
- `/api/` → does not expose privileged data/actions without authorization.
- No user prompt, uploaded file, private data, log, token, or API secret appears in public static output.

## Merge gate

Do not merge this work into `main` until repository review and production-edge review are both complete. Cloudflare dashboard settings are deployment configuration and must be verified separately from repository files.
