import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deploy = await readFile('.github/workflows/deploy-cloudflare-worker.yml','utf8');
const verify = await readFile('.github/workflows/verify-cloudflare-credentials.yml','utf8');
const pages = await readFile('.github/workflows/deploy-github-pages.yml','utf8');
const wranglerRaw = await readFile('wrangler.jsonc','utf8');
const wrangler = JSON.parse(wranglerRaw);
const forbiddenResourceKeys = [
  'routes', 'kv_namespaces', 'r2_buckets', 'd1_databases', 'queues', 'vectorize',
  'hyperdrive', 'ai', 'browser', 'containers', 'pipelines', 'secrets_store_secrets'
];

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
assert.match(pages, /workflow_dispatch:/);
assert.doesNotMatch(pages, /push:\s*\r?\n\s+branches:\s*\[main\]/);
assert.doesNotMatch(pages, /pull_request:/);
assert.match(pages, /path:\s*dist/);
assert.match(pages, /actions\/deploy-pages@v4/);
assert.match(deploy, /verify-production-security\.mjs/);
assert.match(deploy, /permissions:\s*\r?\n\s+contents:\s*read/);
assert.doesNotMatch(deploy, /permissions:\s*write-all/);

assert.deepEqual(wrangler?.secrets?.required, [
  'TAVILY_API_KEY',
  'ACCESS_CODE_SECRET',
  'ACCESS_ADMIN_PASSWORD_HASH',
  'ACCESS_ADMIN_SESSION_SECRET'
]);
const worker = await readFile('src/search-worker.js', 'utf8');
assert.match(worker, /OFFICIAL_SEARCH_RATE_LIMITER/);
assert.match(worker, /RATE_LIMIT_BINDING_MISSING/);
assert.match(worker, /RATE_LIMIT_CHECK_FAILED/);
assert.match(worker, /ACCESS_CODE_SECRET/);
assert.match(worker, /ACCESS_ADMIN_PASSWORD_HASH/);
assert.match(worker, /ACCESS_ADMIN_SESSION_SECRET/);
assert.match(worker, /ACCESS_SERVICE_NOT_CONFIGURED/);

assert.equal(wrangler?.observability?.enabled, true);
assert.equal(wrangler?.observability?.logs?.enabled, true);
assert.equal(wrangler?.observability?.logs?.invocation_logs, false);
assert.equal(wrangler?.observability?.logs?.head_sampling_rate, 0.05);
assert.equal(wrangler?.observability?.logs?.persist, true);
assert.equal(wrangler?.observability?.traces?.enabled, false);
assert.equal(wrangler?.main, 'src/search-worker-v2.js');
assert.equal(wrangler?.assets?.binding, 'ASSETS');
for (const key of forbiddenResourceKeys) assert.equal(wrangler[key], undefined, `Unexpected Cloudflare resource in wrangler.jsonc: ${key}`);

const leastPrivilegeRunbook = await readFile('docs/cloudflare-least-privilege-migration.md', 'utf8');
assert.match(leastPrivilegeRunbook, /Create a dedicated replacement token/i);
assert.match(leastPrivilegeRunbook, /configure the replacement/i);
assert.match(leastPrivilegeRunbook, /Verify Production Surface/i);
assert.match(leastPrivilegeRunbook, /Only after all prior checks pass/i);
assert.match(leastPrivilegeRunbook, /revoke the old broad token/i);
assert.doesNotMatch(leastPrivilegeRunbook, /(?:api[_ -]?token|secret)\s*[=:]\s*[A-Za-z0-9_-]{20,}/i);

console.log('Cloudflare deploy/privacy contract verified: guarded Worker main deploy, manual-only fallback Pages workflow, complete required secret manifest, rate-limit handling, minimized logs, no invocation logs, traces disabled.');
