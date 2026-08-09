import assert from 'node:assert/strict';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const trustUrl = new URL('trust.html', frontend).toString();
const privacyNoticeUrl = new URL('privacy-notice.html', frontend).toString();

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

console.log(JSON.stringify({
  frontend,
  trustUrl,
  privacyNoticeUrl,
  checks: {
    https: 'PASS',
    internalPilotBanner: 'PASS',
    privacyGuardVersion: 'PASS',
    facebookLink: 'PASS',
    trustPage: 'PASS',
    privacyNotice: 'PASS'
  }
}, null, 2));
