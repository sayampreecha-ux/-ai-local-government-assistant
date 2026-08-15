import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const canonicalHome = 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/';
const page = name => new URL(name, frontend).toString();
const trustUrl = page('trust.html');
const privacyNoticeUrl = page('privacy-notice.html');
const robotsUrl = page('robots.txt');
const sitemapUrl = page('sitemap.xml');
const llmsUrl = page('llms.txt');
const adminUrl = page('admin.html');
const serviceWorkerUrl = page('service-worker.js');
const RELEASE = Object.freeze({ home:'6.1.0', homeCss:'2.4.6', serviceWorker:'6.1.0', budgetInputRuntime:'1.5.0' });

const runtimeSourceFiles = Object.freeze([
  'budget-balance-validator.js','budget-official-evidence-adapter.js','budget-official-document-parser.js','budget-document-content-ingestion.js',
  'budget-internal-evidence-ingestion.js','budget-browser-file-ingestion.js','budget-browser-file-parser.js','budget-working-draft-planner.js',
  'budget-file-parser-review.js','budget-tabular-parser.js','budget-artifact-factory.js','government-workflow-engine.js',
  'government-workflow-state-machine-v2.js','government-deliverable-contracts-v3.js','government-case-orchestrator-v4.js','government-workflow-suite.js'
]);
const budgetBrowserAssets = Object.freeze([
  'assets/js/core/budget-official-source-runtime-v1.js',
  'assets/js/core/budget-official-document-connector-v1.js',
  'assets/js/core/budget-browser-input-runtime-v1.js',
  'assets/js/core/budget-browser-review-ui-v1.js',
  'assets/js/core/budget-office-export-v1.js',
  'assets/js/core/official-source-registry.js'
]);

const [localIndex, localHomeSource, localPrivacyGuard, localSubmitGuard, localServiceWorker, localRuntimeBridge, localHomeCssSource, localReviewDialogCss, ...rest] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url),'utf8'),
  readFile(new URL('../assets/js/home-v3.js', import.meta.url),'utf8'),
  readFile(new URL('../assets/js/core/privacy-guard.js', import.meta.url),'utf8'),
  readFile(new URL('../assets/js/core/privacy-submit-guard.js', import.meta.url),'utf8'),
  readFile(new URL('../service-worker.js', import.meta.url),'utf8'),
  readFile(new URL('../assets/js/core/government-workflow-runtime-v5.js', import.meta.url),'utf8'),
  readFile(new URL('../assets/css/home-v3.css', import.meta.url),'utf8'),
  readFile(new URL('../assets/css/budget-review-dialog.css', import.meta.url),'utf8'),
  ...runtimeSourceFiles.map(file => readFile(new URL(`../src/${file}`, import.meta.url),'utf8')),
  ...budgetBrowserAssets.map(file => readFile(new URL(`../${file}`, import.meta.url),'utf8'))
]);
const localRuntimeContents = rest.slice(0,runtimeSourceFiles.length);
const localBudgetAssets = rest.slice(runtimeSourceFiles.length);
const localHome = localHomeSource.replace(/budget-browser-input-runtime-v1\.js\?v=[^'"\s)]+/g, `budget-browser-input-runtime-v1.js?v=${RELEASE.budgetInputRuntime}`);
const localHomeCss = `${localHomeCssSource.trimEnd()}\n${localReviewDialogCss.trim()}\n`;

const expectedPrivacyGuard = localIndex.match(/assets\/js\/core\/privacy-guard\.js\?v=[^"'\s<]+/)?.[0];
const expectedSubmitGuard = localIndex.match(/assets\/js\/core\/privacy-submit-guard\.js\?v=[^"'\s<]+/)?.[0];
const expectedHome = `assets/js/home-v3.js?v=${RELEASE.home}`;
assert.ok(expectedPrivacyGuard); assert.ok(expectedSubmitGuard);

async function fetchText(url) {
  const response = await fetch(url,{redirect:'follow',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}});
  assert.equal(response.ok,true,`${url}: HTTP ${response.status}`);
  return { response, text:await response.text() };
}
async function exactProduction(path, localContent) {
  const result = await fetchText(page(path));
  assert.equal(result.text,localContent,`production ${path} is stale or differs from committed release candidate`);
  return result;
}

const { response:indexResponse, text:index } = await fetchText(frontend);
assert.equal(index.includes(expectedPrivacyGuard),true);
assert.equal(index.includes(expectedSubmitGuard),true);
assert.equal(index.includes(expectedHome),true);
assert.match(index,/Public Beta|Internal Pilot/);
assert.match(index,new RegExp(`assets/js/home-v3\\.js\\?v=${RELEASE.home.replaceAll('.','\\.')}`));
assert.match(index,new RegExp(`assets/css/home-v3\\.css\\?v=${RELEASE.homeCss.replaceAll('.','\\.')}`));
assert.match(index,/official-source-registry\.js\?v=2\.4\.0/);
assert.match(index,new RegExp(`service-worker\\.js\\?v=${RELEASE.serviceWorker.replaceAll('.','\\.')}`));
assert.match(index,/data-prompt="ทำร่างงบปี 70 อบจ\.พะเยา"/);
assert.match(index,/https:\/\/www\.facebook\.com\/GovPromptThailandAI/);
assert.match(index,/privacy-notice\.html/);
assert.equal(indexResponse.url.startsWith('https://'),true);

const privacy = await exactProduction(expectedPrivacyGuard,localPrivacyGuard);
const submit = await exactProduction(expectedSubmitGuard,localSubmitGuard);
const home = await exactProduction(expectedHome,localHome);
const css = await exactProduction(`assets/css/home-v3.css?v=${RELEASE.homeCss}`,localHomeCss);
const sw = await exactProduction(`service-worker.js?v=${RELEASE.serviceWorker}`,localServiceWorker);
const runtimeBridge = await exactProduction('assets/js/core/government-workflow-runtime-v5.js?v=5.1.0',localRuntimeBridge);

assert.match(privacy.text,/sanitizeExternalContent/);
assert.match(privacy.text,/รหัสผู้ป่วย\/HN\/AN/);
assert.match(submit.text,/privacySubmitGuard === '3'/);
assert.match(submit.text,/stopImmediatePropagation/);
assert.match(submit.text,/detectFailSafeRisks/);
assert.match(submit.text,/EVERY detected PII\/sensitive signal fails closed in capture phase/);
assert.match(submit.text,/Home\/UI\/history\/router\/search\/Worker\/API/);
assert.doesNotMatch(submit.text,/requestSubmit\s*\(/);
assert.match(home.text,/prepareExternalPrompt\(text\)/);
assert.match(home.text,/government-workflow-runtime-v5\.js\?v=5\.1\.0/);
assert.match(home.text,/budget-official-source-runtime-v1\.js\?v=2\.0\.0/);
assert.match(home.text,/budget-official-document-connector-v1\.js\?v=1\.0\.0/);
assert.match(home.text,new RegExp(`budget-browser-input-runtime-v1\\.js\\?v=${RELEASE.budgetInputRuntime.replaceAll('.','\\.')}`));
assert.match(home.text,/budget-office-export-v1\.js\?v=1\.0\.0/);
assert.match(home.text,/downloadBudgetOfficeFile/);
assert.match(css.text,/budget-review-table/);
assert.match(css.text,/budget-review-overlay/);
assert.match(css.text,/budget-review-dialog/);
assert.match(runtimeBridge.text,/WORKFLOW_RUNTIME_BRIDGE_VERSION = '5\.0'/);
assert.match(runtimeBridge.text,/rawEvidenceValuesReturned: false/);
assert.match(runtimeBridge.text,/autoApprovalAllowed: false/);

const runtimeProduction = {};
for (let i=0;i<runtimeSourceFiles.length;i+=1) {
  const file = runtimeSourceFiles[i];
  const result = await exactProduction(`src/${file}`,localRuntimeContents[i]);
  runtimeProduction[file] = { url:page(`src/${file}`), etag:result.response.headers.get('etag') };
}
const budgetProduction = {};
for (let i=0;i<budgetBrowserAssets.length;i+=1) {
  const file = budgetBrowserAssets[i];
  const result = await exactProduction(file,localBudgetAssets[i]);
  budgetProduction[file] = { url:page(file), etag:result.response.headers.get('etag') };
}

assert.match(sw.text,/request\.mode === 'navigate'/);
assert.match(sw.text,/fetch\(request\)/);
assert.equal(/privacy-(?:submit-)?guard\.js/i.test(sw.text),false);
assert.equal(/budget-browser-(?:input|review)|budget-file-parser/i.test(sw.text),false);

const { response:trustResponse,text:trust } = await fetchText(trustUrl);
assert.match(trust,/Internal Pilot|Public Beta/); assert.match(trust,/ผู้ให้บริการค้นเว็บภายนอก|search provider|Tavily/i); assert.match(trust,/data-minimized|Data minimization|ลดข้อมูล/i); assert.equal(trustResponse.url.startsWith('https://'),true);
const { response:privacyResponse,text:privacyNotice } = await fetchText(privacyNoticeUrl);
assert.match(privacyNotice,/ประกาศความเป็นส่วนตัว/); assert.match(privacyNotice,/Cloudflare Worker/); assert.match(privacyNotice,/ผู้ให้บริการค้นเว็บภายนอก|search provider|Tavily/i); assert.match(privacyNotice,/ChatGPT/); assert.equal(privacyResponse.url.startsWith('https://'),true);
const { text:robots } = await fetchText(robotsUrl);
assert.match(robots,/User-agent:\s*\*/i); assert.match(robots,/Disallow:\s*\/admin\.html/i); assert.match(robots,/Disallow:\s*\/api\//i); assert.match(robots,/Disallow:\s*\/uploads\//i);
const { text:sitemap } = await fetchText(sitemapUrl);
assert.match(sitemap,/<urlset\b/); assert.equal(/admin\.html|\/api\/|\/private\/|\/logs\/|\/uploads\//i.test(sitemap),false);
for (const publicUrl of [canonicalHome,`${canonicalHome}trust.html`,`${canonicalHome}privacy-notice.html`,`${canonicalHome}llms.txt`]) assert.equal(sitemap.includes(`<loc>${publicUrl}</loc>`),true);
const { text:llms } = await fetchText(llmsUrl);
assert.match(llms,/GovPrompt Thailand/); assert.match(llms,/Search:\s*Allowed/i); assert.match(llms,/Agent:\s*Allowed/i); assert.match(llms,/Training:/i); assert.match(llms,/uploaded files/i);
const { text:admin } = await fetchText(adminUrl);
assert.match(admin,/<meta name="robots" content="noindex,nofollow,noarchive"\s*\/?>/i); assert.match(admin,/type="password"[^>]+id="adminSecret"|id="adminSecret"[^>]+type="password"/i);

console.log(JSON.stringify({
  frontend,
  release:RELEASE,
  checks:{
    https:'PASS', privacyBoundary:'PASS', issue73FailClosedMarkers:'PASS', homeBudgetRuntime:'PASS', officeExports:'PASS', editableBudgetReview:'PASS',
    workflowRuntimeBridge:'PASS', workflowRuntimeModules:`${runtimeSourceFiles.length} PASS`, budgetBrowserAssets:`${budgetBrowserAssets.length} PASS`,
    releaseCacheBust:'PASS', serviceWorkerNetworkFirst:'PASS', trustPage:'PASS', privacyNotice:'PASS', robotsPolicy:'PASS', sitemapBoundary:'PASS', llmsPolicy:'PASS', adminNoindexShell:'PASS'
  },
  production:{ runtimeProduction, budgetProduction, etag:{privacy:privacy.response.headers.get('etag'),submit:submit.response.headers.get('etag'),home:home.response.headers.get('etag'),css:css.response.headers.get('etag'),serviceWorker:sw.response.headers.get('etag')} }
},null,2));
