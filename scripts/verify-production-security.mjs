import assert from 'node:assert/strict';

const endpoint = process.env.GOVPROMPT_SEARCH_ENDPOINT || 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
const documentEndpoint = process.env.GOVPROMPT_DOCUMENT_ENDPOINT || new URL('/api/official-document', endpoint).toString();
const origin = process.env.GOVPROMPT_FRONTEND_ORIGIN || 'https://sayampreecha-ux.github.io';
const securityPolicyVersion = '2026-08-15.budget-reader-v2';

async function readJson(response) { return response.json().catch(() => ({})); }
async function preflight(url) {
  return fetch(url, { method:'OPTIONS', headers:{ origin, 'access-control-request-method':'POST', 'access-control-request-headers':'content-type' } });
}

const searchPreflight = await preflight(endpoint);
assert.equal(searchPreflight.status,204,`search preflight: HTTP ${searchPreflight.status}`);
assert.equal(searchPreflight.headers.get('access-control-allow-origin'),origin);
assert.equal(searchPreflight.headers.get('x-govprompt-security'),securityPolicyVersion);
assert.equal(searchPreflight.headers.get('cache-control'),'no-store');
assert.equal(searchPreflight.headers.get('x-content-type-options'),'nosniff');

const documentPreflight = await preflight(documentEndpoint);
assert.equal(documentPreflight.status,204,`document preflight: HTTP ${documentPreflight.status}`);
assert.equal(documentPreflight.headers.get('x-govprompt-security'),securityPolicyVersion);

for (const url of [endpoint,documentEndpoint]) {
  const rejectedOrigin = await fetch(url,{ method:'POST', headers:{origin:'https://invalid.example','content-type':'application/json'}, body:JSON.stringify(url === endpoint ? {query:'ระเบียบค่าเดินทาง'} : {url:'https://dla.go.th/'}) });
  assert.equal(rejectedOrigin.status,403,`bad origin ${url}: HTTP ${rejectedOrigin.status}`);
  assert.equal((await readJson(rejectedOrigin)).error,'ORIGIN_NOT_ALLOWED');
}

const sensitiveMarker = '1234567890123';
const sensitive = await fetch(endpoint,{ method:'POST', headers:{origin,'content-type':'application/json'}, body:JSON.stringify({query:`ตรวจสิทธิเลขบัตร ${sensitiveMarker}`,count:1}) });
assert.equal(sensitive.status,422,`PII block: HTTP ${sensitive.status}`);
const sensitiveBody = await readJson(sensitive);
assert.equal(sensitiveBody.error,'SENSITIVE_QUERY_BLOCKED');
assert.equal(JSON.stringify(sensitiveBody).includes(sensitiveMarker),false);

const invalidDocument = await fetch(documentEndpoint,{ method:'POST', headers:{origin,'content-type':'application/json'}, body:JSON.stringify({url:'https://example.com/not-official.pdf'}) });
assert.equal(invalidDocument.status,422,`document official-host gate: HTTP ${invalidDocument.status}`);
assert.equal((await readJson(invalidDocument)).error,'OFFICIAL_HTTPS_URL_REQUIRED');

const safeQuery = 'ระเบียบค่าเดินทางไปราชการ';
const safe = await fetch(endpoint,{ method:'POST', headers:{origin,'content-type':'application/json'}, body:JSON.stringify({query:safeQuery,count:3}) });
const safeBody = await readJson(safe);
assert.equal(safe.headers.get('x-govprompt-security'),securityPolicyVersion);
assert.equal(safe.headers.get('access-control-allow-origin'),origin);
assert.equal(safe.headers.get('cache-control'),'no-store');
assert.equal(safe.headers.get('content-security-policy'),"default-src 'none'; frame-ancestors 'none'");
assert.equal('query' in safeBody,false);
assert.equal(JSON.stringify(safeBody).includes(safeQuery),false);

let safeSearchStatus = 'PASS';
if (safe.ok) {
  assert.equal(Array.isArray(safeBody.results),true,'safe request: results missing');
  assert.equal(safeBody.results.every(result => result.sourceTier === 'primary'),true,'safe request: non-primary result returned');
  assert.equal(safeBody.results.every(result => String(result.host || '').endsWith('.go.th') || String(result.host || '') === 'go.th'),true,'safe request: non-government host returned');
} else {
  assert.ok([502,503].includes(safe.status),`safe request: unexpected HTTP ${safe.status} ${JSON.stringify(safeBody)}`);
  assert.ok(['SEARCH_PROVIDER_ERROR','SEARCH_PROVIDER_NOT_CONFIGURED'].includes(safeBody.error),`safe request: unexpected error ${JSON.stringify(safeBody)}`);
  safeSearchStatus = `UPSTREAM_DEGRADED_${safe.status}`;
}

console.log(JSON.stringify({ endpoint, documentEndpoint, securityPolicyVersion, checks:{ searchPreflight:'PASS', documentPreflight:'PASS', originGate:'PASS', piiBlock:'PASS', officialDocumentHostGate:'PASS', noQueryEcho:'PASS', securityHeaders:'PASS', safeSearch:safeSearchStatus } },null,2));
