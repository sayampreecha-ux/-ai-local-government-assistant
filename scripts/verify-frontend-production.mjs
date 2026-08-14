import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const trustUrl = new URL('trust.html', frontend).toString();
const privacyNoticeUrl = new URL('privacy-notice.html', frontend).toString();
const robotsUrl = new URL('robots.txt', frontend).toString();
const sitemapUrl = new URL('sitemap.xml', frontend).toString();
const llmsUrl = new URL('llms.txt', frontend).toString();
const adminUrl = new URL('admin.html', frontend).toString();
const serviceWorkerUrl = new URL('service-worker.js', frontend).toString();
const canonicalHome = 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/';

const [localIndex, localPrivacyGuard, localSubmitGuard, localServiceWorker] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../assets/js/core/privacy-guard.js', import.meta.url), 'utf8'),
  readFile(new URL('../assets/js/core/privacy-submit-guard.js', import.meta.url), 'utf8'),
  readFile(new URL('../service-worker.js', import.meta.url), 'utf8')
]);

const expectedPrivacyGuard = localIndex.match(/assets\/js\/core\/privacy-guard\.js\?v=[^"'\s<]+/)?.[0];
const expectedSubmitGuard = localIndex.match(/assets\/js\/core\/privacy-submit-guard\.js\?v=[^"'\s<]+/)?.[0];
assert.ok(expectedPrivacyGuard, 'local index: privacy guard asset reference missing');
assert.ok(expectedSubmitGuard, 'local index: privacy submit guard asset reference missing');

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' }
  });
  assert.equal(response.ok, true, `${url}: HTTP ${response.status}`);
  return { response, text: await response.text() };
}

const { response: indexResponse, text: index } = await fetchText(frontend);
assert.match(index, /Public Beta|Internal Pilot/);
assert.equal(index.includes(expectedPrivacyGuard), true, `production privacy guard does not match committed asset reference: ${expectedPrivacyGuard}`);
assert.equal(index.includes(expectedSubmitGuard), true, `production submit guard does not match committed asset reference: ${expectedSubmitGuard}`);
assert.match(index, /https:\/\/www\.facebook\.com\/GovPromptThailandAI/);
assert.match(index, /ความโปร่งใสและความปลอดภัย/);
assert.match(index, /privacy-notice\.html/);
assert.match(index, new RegExp(`<link rel="canonical" href="${canonicalHome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
assert.match(index, /<meta name="robots" content="index,follow/);
assert.match(index, /<meta property="og:title" content="GovPrompt Thailand/);
assert.match(index, /<script type="application\/ld\+json">/);
assert.match(index, /llms\.txt/);
assert.equal(indexResponse.url.startsWith('https://'), true, 'frontend must stay on HTTPS');

// Issue #73 production proof: fetch the exact browser-referenced security assets
// from GitHub Pages and require byte-for-byte equality with the checked-out main
// commit. This catches stale CDN/browser-facing asset versions after deployment.
const privacyGuardUrl = new URL(expectedPrivacyGuard, frontend).toString();
const submitGuardUrl = new URL(expectedSubmitGuard, frontend).toString();
const { response: privacyGuardResponse, text: productionPrivacyGuard } = await fetchText(privacyGuardUrl);
const { response: submitGuardResponse, text: productionSubmitGuard } = await fetchText(submitGuardUrl);
const { response: serviceWorkerResponse, text: productionServiceWorker } = await fetchText(serviceWorkerUrl);

assert.equal(productionPrivacyGuard, localPrivacyGuard, 'production privacy-guard.js is stale or differs from committed main');
assert.equal(productionSubmitGuard, localSubmitGuard, 'production privacy-submit-guard.js is stale or differs from committed main');
assert.equal(productionServiceWorker, localServiceWorker, 'production service-worker.js is stale or differs from committed main');

assert.match(productionPrivacyGuard, /sanitizeExternalContent/);
assert.match(productionPrivacyGuard, /รหัสผู้ป่วย\/HN\/AN/);
assert.match(productionSubmitGuard, /privacySubmitGuard === '2'/);
assert.match(productionSubmitGuard, /stopImmediatePropagation/);
assert.match(productionSubmitGuard, /applyFailSafeRedactions/);
assert.match(productionSubmitGuard, /replaced synchronously in capture phase/);
assert.match(productionSubmitGuard, /Home\/UI\/router\/search\/history/);
assert.match(productionSubmitGuard, /ข้อมูลดิบถูกปกปิดก่อนถึงหน้าจอ/);
assert.doesNotMatch(productionSubmitGuard, /requestSubmit\s*\(/, 'production privacy boundary must not depend on form re-submit');

// The service worker must remain network-first for navigations and must not
// precache Privacy Guard scripts, preventing an old security gate from being
// pinned offline after a security deployment.
assert.match(productionServiceWorker, /request\.mode === 'navigate'/);
assert.match(productionServiceWorker, /fetch\(request\)/);
assert.equal(/privacy-(?:submit-)?guard\.js/i.test(productionServiceWorker), false, 'service worker must not pin privacy guard assets in precache');

const { response: trustResponse, text: trust } = await fetchText(trustUrl);
assert.match(trust, /Internal Pilot|Public Beta/);
assert.match(trust, /ผู้ให้บริการค้นเว็บภายนอก|search provider|Tavily/i);
assert.match(trust, /data-minimized|Data minimization|ลดข้อมูล/i);
assert.equal(trustResponse.url.startsWith('https://'), true, 'trust page must stay on HTTPS');

const { response: privacyResponse, text: privacy } = await fetchText(privacyNoticeUrl);
assert.match(privacy, /ประกาศความเป็นส่วนตัว/);
assert.match(privacy, /Internal Pilot|Public Beta/);
assert.match(privacy, /Cloudflare Worker/);
assert.match(privacy, /ผู้ให้บริการค้นเว็บภายนอก|search provider|Tavily/i);
assert.match(privacy, /ChatGPT/);
assert.match(privacy, /GovPromptThailandAI/);
assert.equal(privacyResponse.url.startsWith('https://'), true, 'privacy notice must stay on HTTPS');

const { text: robots } = await fetchText(robotsUrl);
assert.match(robots, /User-agent:\s*\*/i);
assert.match(robots, /Allow:\s*\//i);
assert.match(robots, /Disallow:\s*\/admin\.html/i);
assert.match(robots, /Disallow:\s*\/admin\.js/i);
assert.match(robots, /Disallow:\s*\/api\//i);
assert.match(robots, /Disallow:\s*\/private\//i);
assert.match(robots, /Disallow:\s*\/logs\//i);
assert.match(robots, /Disallow:\s*\/uploads\//i);
assert.match(robots, new RegExp(`Sitemap:\\s*${canonicalHome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}sitemap\\.xml`, 'i'));

const { text: sitemap } = await fetchText(sitemapUrl);
assert.match(sitemap, /<urlset\b/);
for (const publicUrl of [canonicalHome, `${canonicalHome}trust.html`, `${canonicalHome}privacy-notice.html`, `${canonicalHome}llms.txt`]) {
  assert.equal(sitemap.includes(`<loc>${publicUrl}</loc>`), true, `sitemap missing ${publicUrl}`);
}
assert.equal(/admin\.html|\/api\/|\/private\/|\/logs\/|\/uploads\//i.test(sitemap), false, 'sitemap must not publish protected/private-style routes');

const { text: llms } = await fetchText(llmsUrl);
assert.match(llms, /GovPrompt Thailand/);
assert.match(llms, /Search:\s*Allowed/i);
assert.match(llms, /Agent:\s*Allowed/i);
assert.match(llms, /Training:/i);
assert.match(llms, /user-entered prompts/i);
assert.match(llms, /uploaded files/i);
assert.match(llms, /authenticated content/i);

const { text: admin } = await fetchText(adminUrl);
assert.match(admin, /<meta name="robots" content="noindex,nofollow,noarchive"\s*\/?>/i);
assert.match(admin, /type="password"[^>]+id="adminSecret"|id="adminSecret"[^>]+type="password"/i);

console.log(JSON.stringify({
  frontend,
  trustUrl,
  privacyNoticeUrl,
  robotsUrl,
  sitemapUrl,
  llmsUrl,
  adminUrl,
  productionSecurityAssets: {
    privacyGuardUrl,
    submitGuardUrl,
    serviceWorkerUrl,
    cacheControl: {
      index: indexResponse.headers.get('cache-control'),
      privacyGuard: privacyGuardResponse.headers.get('cache-control'),
      submitGuard: submitGuardResponse.headers.get('cache-control'),
      serviceWorker: serviceWorkerResponse.headers.get('cache-control')
    },
    etag: {
      privacyGuard: privacyGuardResponse.headers.get('etag'),
      submitGuard: submitGuardResponse.headers.get('etag'),
      serviceWorker: serviceWorkerResponse.headers.get('etag')
    }
  },
  checks: {
    https: 'PASS',
    betaBanner: 'PASS',
    privacyGuardVersion: 'PASS',
    privacySubmitGuardVersion: 'PASS',
    privacyGuardProductionBytes: 'PASS',
    privacySubmitGuardProductionBytes: 'PASS',
    serviceWorkerProductionBytes: 'PASS',
    serviceWorkerNoSecurityPrecache: 'PASS',
    issue73FailClosedMarkers: 'PASS',
    facebookLink: 'PASS',
    trustPage: 'PASS',
    privacyNotice: 'PASS',
    canonicalAndMetadata: 'PASS',
    robotsPolicy: 'PASS',
    sitemapBoundary: 'PASS',
    llmsPolicy: 'PASS',
    adminNoindexShell: 'PASS'
  }
}, null, 2));
