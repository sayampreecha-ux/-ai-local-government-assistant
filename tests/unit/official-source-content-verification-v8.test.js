import assert from 'node:assert/strict';
import worker from '../../src/search-worker-v2.js';

const origin = 'https://sayampreecha-ux.github.io';
const assets = { fetch: async () => new Response('asset', { status: 200 }) };
const request = body => new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin },
  body: JSON.stringify(body)
});

const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url, options = {}) => {
  calls.push(String(url));
  if (String(url).includes('/search')) {
    return new Response(JSON.stringify({
      results: [
        { title: 'กรมบัญชีกลาง', url: 'https://www.cgd.go.th/example', content: 'snippet' },
        { title: 'ราชกิจจานุเบกษา PDF', url: 'https://ratchakitcha.soc.go.th/example.pdf', content: 'snippet' }
      ]
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (String(url) === 'https://www.cgd.go.th/example') {
    return new Response('<html><body><h1>หลักเกณฑ์การเบิกจ่าย</h1><p>เอกสารฉบับจริงและเงื่อนไขการใช้บังคับสำหรับหน่วยงานของรัฐ โดยให้ตรวจสอบวันที่ประกาศและการแก้ไขเพิ่มเติมก่อนนำไปใช้</p></body></html>', {
      status: 200, headers: { 'content-type': 'text/html' }
    });
  }
  if (String(url) === 'https://ratchakitcha.soc.go.th/example.pdf') {
    return new Response('%PDF-mock', { status: 200, headers: { 'content-type': 'application/pdf' } });
  }
  throw new Error('unexpected fetch');
};

try {
  const response = await worker.fetch(request({ query: 'หลักเกณฑ์การเบิกจ่าย' }), {
    ASSETS: assets,
    TAVILY_API_KEY: 'test'
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.results.length, 2);
  const cgd = body.results.find(row => row.host === 'cgd.go.th');
  const gazette = body.results.find(row => row.host === 'ratchakitcha.soc.go.th');
  assert.equal(cgd.primary, true);
  assert.equal(cgd.contentVerified, true);
  assert.match(cgd.evidenceText, /หลักเกณฑ์การเบิกจ่าย/);
  assert.equal(gazette.contentVerified, false);
  assert.equal(gazette.verificationStatus, 'non-html-document');
  assert.ok(calls.includes('https://www.cgd.go.th/example'));
  console.log('v8 official source content verification passed');
} finally {
  globalThis.fetch = originalFetch;
}
