import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deploy = await readFile('.github/workflows/deploy-cloudflare-worker.yml','utf8');
const verify = await readFile('.github/workflows/verify-cloudflare-credentials.yml','utf8');
const pages = await readFile('.github/workflows/deploy-github-pages.yml','utf8');
const wranglerRaw = await readFile('wrangler.jsonc','utf8');
const wrangler = JSON.parse(wranglerRaw);

assert.match(deploy, /pnpm install --frozen-lockfile/);
assert.match(deploy, /pnpm build/);
assert.match(deploy, /pnpm exec wrangler deploy/);
assert.doesNotMatch(deploy, /npx\s+wrangler/);
assert.match(deploy, /CLOUDFLARE_API_TOKEN/);
assert.match(deploy, /CLOUDFLARE_ACCOUNT_ID/);
assert.match(deploy, /verify-live-search-backend\.mjs/);
assert.match(deploy, /benchmark-production-endpoint\.mjs/);
assert.match(deploy, /push:\s*\r?\n\s+branches:\s*\[main\]/);
assert.match(deploy, /if:\s*github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
assert.doesNotMatch(deploy, /workflow_dispatch:/);
assert.doesNotMatch(deploy, /pull_request:/);
assert.match(verify, /Missing CLOUDFLARE_API_TOKEN/);
assert.match(verify, /Missing CLOUDFLARE_ACCOUNT_ID/);
assert.match(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'), /"directory": "\.\/dist"/);
assert.match(pages, /push:\s*\r?\n\s+branches:\s*\[main\]/);
assert.match(pages, /if:\s*github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
assert.match(pages, /path:\s*dist/);
assert.doesNotMatch(pages, /workflow_dispatch:/);
assert.doesNotMatch(pages, /pull_request:/);
assert.match(deploy, /verify-production-security\.mjs/);

assert.deepEqual(wrangler?.secrets?.required, ['TAVILY_API_KEY']);
const worker = await readFile('src/search-worker.js', 'utf8');
assert.match(worker, /OFFICIAL_SEARCH_RATE_LIMITER/);
assert.match(worker, /RATE_LIMIT_BINDING_MISSING/);
assert.match(worker, /RATE_LIMIT_CHECK_FAILED/);

assert.equal(wrangler?.observability?.enabled, true);
assert.equal(wrangler?.observability?.logs?.enabled, true);
assert.equal(wrangler?.observability?.logs?.invocation_logs, false);
assert.equal(wrangler?.observability?.logs?.head_sampling_rate, 0.05);
assert.equal(wrangler?.observability?.logs?.persist, true);
assert.equal(wrangler?.observability?.traces?.enabled, false);

console.log('Cloudflare deploy/privacy contract verified: guarded main deploys, required secret, rate-limit handling, minimized logs, no invocation logs, traces disabled.');
