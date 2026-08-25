import assert from 'node:assert/strict';

const endpoint = process.env.GOVPROMPT_SEARCH_ENDPOINT || 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
const documentEndpoint = process.env.GOVPROMPT_DOCUMENT_ENDPOINT || new URL('/api/official-document', endpoint).toString();
const studioConvertEndpoint = process.env.GOVPROMPT_DOCUMENT_STUDIO_CONVERT_ENDPOINT || new URL('/api/document-studio/convert', endpoint).toString();
const studioComposeEndpoint = process.env.GOVPROMPT_DOCUMENT_STUDIO_COMPOSE_ENDPOINT || new URL('/api/document-studio/compose', endpoint).toString();
const origin = process.env.GOVPROMPT_FRONTEND_ORIGIN || 'https://sayampreecha-ux.github.io';
const securityPolicyVersion = '2026-08-25.document-studio-v1';

async function readJson(response) { return response.json().catch(() => ({})); }
async function preflight(url) {
  return fetch(url, { method:'OPTIONS', headers:{ origin, 'access-control-request-method':'POST', 'access-control-request-headers':'content-type' } });
}

for (const [label,url] of [
  ['search', endpoint],
  ['official document', documentEndpoint],
  ['document studio convert', studioConvertEndpoint],
  ['document studio compose', studioComposeEndpoint]
]) {
  const response = await preflight(url);
  assert.equal(response.status,204,`${label} preflight: HTTP ${response.status}`);
  assert.equal(response.headers.get('access-control-allow-origin'),origin);
  assert.equal(response.headers.get('x-govprompt-security'),securityPolicyVersion);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
}

for (const url of [endpoint,documentEndpoint,studioConvertEndpoint,studioComposeEndpoint]) {
  const body = url === endpoint
    ? JSON.stringify({query:'ระเบียบค่าเดินทาง'})
    : url === documentEndpoint
      ? JSON.stringify({url:'https://dla.go.th/'})
      : url === studioComposeEndpoint
        ? JSON.stringify({mode:'report',text:'ข้อความทดสอบ',privacyConfirmed:false})
        : new FormData();
  const headers = {origin:'https://invalid.example'};
  if (typeof body === 'string') headers['content-type']='application/json';
  const rejectedOrigin = await fetch(url,{ method:'POST', headers, body });
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

const noConsentForm = new FormData();
const studioNoConsent = await fetch(studioConvertEndpoint,{ method:'POST', headers:{origin}, body:noConsentForm });
assert.equal(studioNoConsent.status,428,`document studio consent gate: HTTP ${studioNoConsent.status}`);
assert.equal((await readJson(studioNoConsent)).error,'PRIVACY_CONFIRMATION_REQUIRED');

const composeNoConsent = await fetch(studioComposeEndpoint,{ method:'POST', headers:{origin,'content-type':'application/json'}, body:JSON.stringify({mode:'report',text:'ข้อความทดสอบ',privacyConfirmed:false}) });
assert.equal(composeNoConsent.status,428,`document studio compose consent gate: HTTP ${composeNoConsent.status}`);
assert.equal((await readJson(composeNoConsent)).error,'PRIVACY_CONFIRMATION_REQUIRED');

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
  const allowedUpstreamErrors = new Set([
    'SEARCH_PROVIDER_ERROR',
    'SEARCH_PROVIDER_NOT_CONFIGURED',
    'SEARCH_PROVIDER_NETWORK_ERROR',
    'SEARCH_PROVIDER_USAGE_LIMIT',
    'SEARCH_PROVIDER_PAYGO_LIMIT',
    'SEARCH_PROVIDER_RATE_LIMIT'
  ]);
  assert.ok(allowedUpstreamErrors.has(safeBody.error),`safe request: unexpected error ${JSON.stringify(safeBody)}`);
  safeSearchStatus = `UPSTREAM_DEGRADED_${safe.status}_${safeBody.error}`;
}

console.log(JSON.stringify({
  endpoint,
  documentEndpoint,
  studioConvertEndpoint,
  studioComposeEndpoint,
  securityPolicyVersion,
  checks:{
    searchPreflight:'PASS',
    documentPreflight:'PASS',
    studioConvertPreflight:'PASS',
    studioComposePreflight:'PASS',
    originGate:'PASS',
    piiBlock:'PASS',
    officialDocumentHostGate:'PASS',
    studioPrivacyConsentGate:'PASS',
    noQueryEcho:'PASS',
    securityHeaders:'PASS',
    safeSearch:safeSearchStatus
  }
},null,2));
