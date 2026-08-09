import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deploy = await readFile('.github/workflows/deploy-cloudflare-worker.yml','utf8');
const verify = await readFile('.github/workflows/verify-cloudflare-credentials.yml','utf8');
const wranglerRaw = await readFile('wrangler.jsonc','utf8');
const wrangler = JSON.parse(wranglerRaw);

assert.match(deploy, /wrangler@latest deploy/);
assert.match(deploy, /CLOUDFLARE_API_TOKEN/);
assert.match(deploy, /CLOUDFLARE_ACCOUNT_ID/);
assert.match(deploy, /verify-live-search-backend\.mjs/);
assert.match(deploy, /benchmark-production-endpoint\.mjs/);
assert.match(deploy, /verify-production-security\.mjs/);
assert.match(verify, /Missing CLOUDFLARE_API_TOKEN/);
assert.match(verify, /Missing CLOUDFLARE_ACCOUNT_ID/);

assert.deepEqual(wrangler?.secrets?.required, ['TAVILY_API_KEY']);
assert.equal(Array.isArray(wrangler?.ratelimits), true);
const limiter = wrangler.ratelimits.find(item => item?.name === 'OFFICIAL_SEARCH_RATE_LIMITER');
assert.ok(limiter, 'OFFICIAL_SEARCH_RATE_LIMITER binding is required');
assert.equal(limiter.namespace_id, '7001');
assert.equal(limiter.simple?.limit, 60);
assert.equal(limiter.simple?.period, 60);

assert.equal(wrangler?.observability?.enabled, true);
assert.equal(wrangler?.observability?.logs?.enabled, true);
assert.equal(wrangler?.observability?.logs?.invocation_logs, false);
assert.equal(wrangler?.observability?.logs?.head_sampling_rate, 0.05);
assert.equal(wrangler?.observability?.logs?.persist, true);
assert.equal(wrangler?.observability?.traces?.enabled, false);

console.log('Cloudflare deploy/privacy contract verified: required secret, rate limit, minimized logs, no invocation logs, traces disabled.');
