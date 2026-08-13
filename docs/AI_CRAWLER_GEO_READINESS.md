# GovPrompt V7 — AI Crawler & GEO Readiness

Updated: 2026-08-13

## Objective

Make GovPrompt discoverable by search engines and AI assistants while keeping user-entered prompts, uploaded files, API traffic, logs, and non-public data outside the public knowledge surface.

## Default policy

| Traffic class | GovPrompt policy | Rationale |
| --- | --- | --- |
| Search crawlers | Allow public pages | Preserve SEO, discovery, and citation opportunities |
| Training crawlers | Do not blanket-block yet | Multi-purpose crawler classification can create unintended search impact; review provider-by-provider before changing |
| Agent crawlers | Allow public static knowledge only | Support AI discovery/citation without exposing private application data |
| Admin/private/API/log/upload routes | Block indexing + require access control | robots.txt is advisory and must not be treated as a security boundary |

## Public knowledge surface

Allowed for discovery/citation:

- Public home page and product description
- Public trust/safety documentation
- Public privacy notice
- Public knowledge pages intentionally published for users
- `llms.txt` and `sitemap.xml`

Not public knowledge:

- User-entered prompts or generated session content
- Uploaded files/images/documents
- API request/response payloads
- Logs, analytics raw data, debug traces
- Admin tools or internal configuration
- Authentication/session data
- Personal data that was not intentionally published as public content

## Controls implemented in this change

1. Updated `robots.txt` to keep public content crawlable and exclude admin/API/future private surfaces.
2. Added `sitemap.xml` for the current public pages.
3. Added `llms.txt` describing GovPrompt, its capabilities, safety model, and public-content boundary.

## Cloudflare review before 2026-09-15

GovPrompt currently uses the GitHub Pages project URL. Before changing Cloudflare AI Bot controls, verify whether a custom domain is actually proxied through Cloudflare. Do not assume Cloudflare bot settings apply to the `github.io` host.

When Cloudflare is in front of a GovPrompt custom domain:

- Keep Search traffic allowed unless a specific security/legal requirement says otherwise.
- Do not enable a blanket Training block until multi-purpose crawler impact has been reviewed.
- Allow Agent access only to intentionally public pages.
- Protect `/api/`, admin, uploads, logs, private/session data with authentication/authorization and edge rules; robots.txt alone is not security.
- Re-test Google/Bing indexing and AI-agent reachability after every bot-policy change.

## Deployment note for GitHub Pages project sites

The current public URL is under a subpath:

`https://sayampreecha-ux.github.io/-ai-local-government-assistant/`

A conventional `robots.txt` is normally discovered at the origin root (`https://host/robots.txt`). A project-site `robots.txt` under the repository subpath should therefore be treated as deployment preparation/documentation, not as a guaranteed host-wide crawler control. A custom domain gives GovPrompt direct control of the origin-root `robots.txt`.

## Acceptance checklist

- [x] Public content remains indexable
- [x] Existing admin/API exclusions are preserved
- [x] Future private/log/upload exclusions are documented
- [x] Sitemap added
- [x] AI-readable `llms.txt` added
- [x] Public/private knowledge boundary documented
- [ ] Confirm custom domain / Cloudflare proxy status
- [ ] Configure Cloudflare Search / Training / Agent policy only after proxy status is confirmed
- [ ] Test live robots, sitemap, Google/Bing indexing, and representative AI agents after deployment
