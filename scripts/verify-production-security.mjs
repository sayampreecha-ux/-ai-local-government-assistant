import assert from 'node:assert/strict';

const endpoint = process.env.GOVPROMPT_SEARCH_ENDPOINT || 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
const origin = process.env.GOVPROMPT_FRONTEND_ORIGIN || 'https://sayampreecha-ux.github.io';
const securityPolicyVersion = '2026-08-09.1';

async function readJson(response) {
  return response.json().catch(() => ({}));
}

const preflight = await fetch(endpoint, {
  method: 'OPTIONS',
  headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' }
});
assert.equal(preflight.status, 204, `preflight: HTTP ${preflight.status}`);
assert.equal(preflight.headers.get('access-control-allow-origin'), origin, 'preflight: wrong CORS origin');
assert.equal(preflight.headers.get('x-govprompt-security'), securityPolicyVersion, 'preflight: stale security policy');
assert.equal(preflight.headers.get('cache-control'), 'no-store', 'preflight: cache must be disabled');
assert.equal(preflight.headers.get('x-content-type-options'), 'nosniff', 'preflight: nosniff missing');

const rejectedOrigin = await fetch(endpoint, {
  method: 'POST',
  headers: { origin: 'https://invalid.example', 'content-type': 'application/json' },
  body: JSON.stringify({ query: 'ระเบียบค่าเดินทาง', sites: ['cgd.go.th'], count: 1 })
});
assert.equal(rejectedOrigin.status, 403, `bad origin: HTTP ${rejectedOrigin.status}`);
assert.equal((await readJson(rejectedOrigin)).error, 'ORIGIN_NOT_ALLOWED', 'bad origin: wrong error');

const sensitiveMarker = '1234567890123';
const sensitive = await fetch(endpoint, {
  method: 'POST',
  headers: { origin, 'content-type': 'application/json' },
  body: JSON.stringify({ query: `ตรวจสิทธิเลขบัตร ${sensitiveMarker}`, sites: ['dla.go.th'], count: 1 })
});
assert.equal(sensitive.status, 422, `PII block: HTTP ${sensitive.status}`);
const sensitiveBody = await readJson(sensitive);
assert.equal(sensitiveBody.error, 'SENSITIVE_QUERY_BLOCKED', 'PII block: wrong error');
assert.equal(JSON.stringify(sensitiveBody).includes(sensitiveMarker), false, 'PII block: sensitive value echoed');

const safeQuery = 'ระเบียบค่าเดินทางไปราชการ';
const safe = await fetch(endpoint, {
  method: 'POST',
  headers: { origin, 'content-type': 'application/json' },
  body: JSON.stringify({ query: safeQuery, sites: ['cgd.go.th', 'dla.go.th', 'moi.go.th'], count: 3 })
});
const safeBody = await readJson(safe);

// Security controls are GovPrompt-owned and must remain verifiable even when the
// external provider is degraded. Provider availability is checked separately by
// benchmark-production-endpoint.mjs.
assert.equal(safe.headers.get('x-govprompt-security'), securityPolicyVersion, 'safe request: stale security policy');
assert.equal(safe.headers.get('access-control-allow-origin'), origin, 'safe request: CORS mismatch');
assert.equal(safe.headers.get('cache-control'), 'no-store', 'safe request: cache must be disabled');
assert.equal(safe.headers.get('content-security-policy'), "default-src 'none'; frame-ancestors 'none'", 'safe request: CSP mismatch');
assert.equal('query' in safeBody, false, 'safe request: query echoed in response');
assert.equal(JSON.stringify(safeBody).includes(safeQuery), false, 'safe request: raw query leaked in response');

let safeSearchStatus = 'PASS';
if (safe.ok) {
  assert.equal(Array.isArray(safeBody.results), true, 'safe request: results missing');
  assert.equal(safeBody.results.every(result => result.sourceTier === 'primary'), true, 'safe request: non-primary result returned');
} else {
  assert.equal(safe.status, 502, `safe request: unexpected HTTP ${safe.status} ${JSON.stringify(safeBody)}`);
  assert.equal(safeBody.error, 'SEARCH_PROVIDER_ERROR', `safe request: unexpected error ${JSON.stringify(safeBody)}`);
  assert.equal(Number.isInteger(safeBody.providerStatus), true, 'safe request: provider status missing');
  safeSearchStatus = `UPSTREAM_DEGRADED_${safeBody.providerStatus}`;
}

console.log(JSON.stringify({
  endpoint,
  securityPolicyVersion,
  checks: {
    preflight: 'PASS',
    originGate: 'PASS',
    piiBlock: 'PASS',
    noQueryEcho: 'PASS',
    securityHeaders: 'PASS',
    safeSearch: safeSearchStatus
  }
}, null, 2));
