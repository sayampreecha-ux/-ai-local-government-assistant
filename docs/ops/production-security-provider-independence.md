# Production security checks independent of search provider

Production security verification must validate GovPrompt's own controls even when the external search provider is unavailable.

For a safe request, the verifier always checks GovPrompt security headers, CORS, cache policy, CSP, and query non-echo behavior. If the provider returns a successful search, it also validates primary-source results. If GovPrompt returns `SEARCH_PROVIDER_ERROR`, the verifier treats provider availability as a separate upstream health concern while still requiring the GovPrompt security envelope to remain correct.
