import assert from 'node:assert/strict';

const endpoint = process.env.GOVPROMPT_SEARCH_ENDPOINT || 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
const origin = process.env.GOVPROMPT_FRONTEND_ORIGIN || 'https://sayampreecha-ux.github.io';
const securityPolicyVersion = '2026-08-25.document-studio-v1';
const cases = [
  { query:'ระเบียบการจัดซื้อจัดจ้างและบริหารพัสดุภาครัฐ', sites:['cgd.go.th','dla.go.th'] },
  { query:'ระเบียบค่าใช้จ่ายในการเดินทางไปราชการ', sites:['cgd.go.th','dla.go.th','moi.go.th'] },
  { query:'เงินบำรุง รพ.สต. ระเบียบ', sites:['dla.go.th','moi.go.th'] },
  { query:'TOR งานก่อสร้างถนน ราคากลาง', sites:['cgd.go.th','dla.go.th'] },
  { query:'การเดินทางไปราชการโดยเครื่องบินโดยสาร', sites:['cgd.go.th','dla.go.th','moi.go.th'] }
];

const report = [];
for (const item of cases) {
  const started = Date.now();
  const response = await fetch(endpoint, {
    method:'POST',
    headers:{'content-type':'application/json', origin},
    body:JSON.stringify({
      query:item.query,
      sites:item.sites,
      count:5
    })
  });
  const latencyMs = Date.now() - started;
  const body = await response.json().catch(() => ({}));
  assert.equal(response.ok, true, `${item.query}: HTTP ${response.status} ${JSON.stringify(body)}`);
  assert.equal(response.headers.get('access-control-allow-origin'), origin, `${item.query}: CORS origin mismatch`);
  assert.equal(response.headers.get('cache-control'), 'no-store', `${item.query}: cache policy mismatch`);
  assert.equal(response.headers.get('x-govprompt-security'), securityPolicyVersion, `${item.query}: production security policy is not current`);
  assert.equal('query' in body, false, `${item.query}: query must not be echoed in response`);
  assert.equal(Array.isArray(body.results), true, `${item.query}: results missing`);
  assert.equal(body.results.length > 0, true, `${item.query}: no results`);
  const top3 = body.results.slice(0,3);
  assert.equal(top3.every(r => r.sourceTier === 'primary' || r.official === true), true, `${item.query}: non-official result in top3`);
  assert.equal(top3.every(r => item.sites.some(site => r.host === site || String(r.host||'').endsWith(`.${site}`))), true, `${item.query}: result outside requested domains`);
  assert.equal(top3.every(r => /^https:\/\//.test(String(r.sourceUrl || r.url || ''))), true, `${item.query}: insecure URL`);
  report.push({ query:item.query, status:response.status, provider:body.provider || '', latencyMs, securityPolicyVersion:response.headers.get('x-govprompt-security'), top3:top3.map(r => ({ title:r.title, host:r.host, documentDate:r.documentDate || '' })) });
}

console.log(JSON.stringify({ endpoint, origin, securityPolicyVersion, passed:report.length, total:cases.length, report }, null, 2));
