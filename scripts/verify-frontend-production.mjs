import assert from 'node:assert/strict';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const trustUrl = new URL('trust.html', frontend).toString();
const privacyNoticeUrl = new URL('privacy-notice.html', frontend).toString();
const robotsUrl = new URL('robots.txt', frontend).toString();
const sitemapUrl = new URL('sitemap.xml', frontend).toString();
const llmsUrl = new URL('llms.txt', frontend).toString();
const adminUrl = new URL('admin.html', frontend).toString();
const canonicalHome = 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/';

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' });
  assert.equal(response.ok, true, `${url}: HTTP ${response.status}`);
  return { response, text: await response.text() };
}

const { response: indexResponse, text: index } = await fetchText(frontend);
assert.match(index, /Internal Pilot/);
assert.match(index, /privacy-guard\.js\?v=1\.2\.0/);
assert.match(index, /https:\/\/www\.facebook\.com\/GovPromptThailandAI/);
assert.match(index, /ความโปร่งใสและความปลอดภัย/);
assert.match(index, /privacy-notice\.html/);
assert.match(index, new RegExp(`<link rel="canonical" href="${canonicalHome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
assert.match(index, /<meta name="robots" content="index,follow/);
assert.match(index, /<meta property="og:title" content="GovPrompt Thailand/);
assert.match(index, /<script type="application\/ld\+json">/);
assert.match(index, /llms\.txt/);
assert.equal(indexResponse.url.startsWith('https://'), true, 'frontend must stay on HTTPS');

const { response: trustResponse, text: trust } = await fetchText(trustUrl);
assert.match(trust, /Internal Pilot/);
assert.match(trust, /Tavily/);
assert.match(trust, /Data minimization/);
assert.equal(trustResponse.url.startsWith('https://'), true, 'trust page must stay on HTTPS');

const { response: privacyResponse, text: privacy } = await fetchText(privacyNoticeUrl);
assert.match(privacy, /ประกาศความเป็นส่วนตัว/);
assert.match(privacy, /Internal Pilot/);
assert.match(privacy, /Cloudflare Worker/);
assert.match(privacy, /Tavily/);
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
  checks: {
    https: 'PASS',
    internalPilotBanner: 'PASS',
    privacyGuardVersion: 'PASS',
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
