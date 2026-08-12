# Search provider degradation policy

GovPrompt treats the external search provider as an upstream dependency.

- Worker deployment and production security checks remain blocking.
- The live search quality benchmark is advisory because an upstream quota, billing, rate-limit, or provider outage can fail independently of the deployed GovPrompt code.
- A failed live-search benchmark must remain visible in GitHub Actions logs and should be investigated, but it must not prevent a verified Worker deployment from being recorded as successful.
- User-facing search must continue to fail closed with a clear provider error rather than fabricate results.

Current production incident observed on 2026-08-12: Tavily returned provider HTTP 432 through the Worker, surfaced by GovPrompt as `SEARCH_PROVIDER_ERROR`/HTTP 502. Tavily documents HTTP 432 as a possible Search API response, but the public API reference does not currently describe its semantics. Check Tavily account usage/plan and API-key status before assuming a code defect.
