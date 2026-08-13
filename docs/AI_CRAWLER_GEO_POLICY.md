# GovPrompt Thailand — AI Crawler & GEO Policy

Status: Sprint 1 proposed baseline
Scope: Public web surfaces of GovPrompt Thailand
Review target: Before 15 September 2026

## Purpose

This policy separates public discovery from private or user-generated data. It is intended to improve legitimate search and AI citation of GovPrompt Thailand while preventing public exposure of private, authenticated, operational, or user-submitted content.

## Policy matrix

| Traffic class | Baseline | Scope | Notes |
|---|---|---|---|
| Search | ALLOW | Public static pages and public knowledge | Preserve discoverability in search and AI search experiences. |
| Agent | ALLOW (public only) | Public static pages that can be referenced to answer a user's request | Must not imply access to authenticated pages, APIs, logs, uploads, private data, or user prompts. |
| Training | OWNER DECISION / NO BLANKET PERMISSION | Public content only if explicitly permitted by the final edge policy | `llms.txt` does not grant a blanket training license. Cloudflare/network policy remains authoritative for enforcement. |

## Important mixed-purpose crawler warning

Some crawler identities can perform more than one purpose. A restrictive Training rule may also affect a crawler that is used for Search. Before blocking Training at the edge, verify the current Cloudflare crawler classification and test that required search discovery remains available.

## Public surfaces intended for discovery

- `/`
- `/trust.html`
- `/privacy-notice.html`
- `/llms.txt`
- `/sitemap.xml`
- Other public informational pages explicitly added to the sitemap

## Surfaces not intended for public crawler discovery

- `/admin.html`
- `/admin.js`
- `/api/`
- `/private/`
- `/logs/`
- `/uploads/`
- Authenticated content
- User-entered prompts
- Uploaded documents or images
- Transient chat/session content
- Operational logs and API payloads

`robots.txt` is only crawler guidance. Sensitive data and protected functionality must remain protected by access control, authorization, and server-side policy even if a crawler ignores robots directives.

## GEO principles

1. Keep one canonical public URL for each important page.
2. Publish clear titles, descriptions, language, and structured metadata on public pages.
3. Make public trust, privacy, and product-purpose pages crawlable.
4. Keep `robots.txt`, `sitemap.xml`, and `llms.txt` consistent with each other.
5. Never publish personal, confidential, authenticated, or user-submitted data merely to improve AI discoverability.
6. Treat AI-generated answers as references to public information, not as authority to approve or decide official government matters.

## Change control

All crawler/GEO changes must be developed and reviewed in a feature branch. Do not edit `main` directly. Merge only after crawler behavior, canonical URLs, public/private boundaries, and deployment configuration have been verified.
