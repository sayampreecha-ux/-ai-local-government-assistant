import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deploy = await readFile('.github/workflows/deploy-cloudflare-worker.yml','utf8');
const verify = await readFile('.github/workflows/verify-cloudflare-credentials.yml','utf8');
assert.match(deploy, /wrangler@latest deploy/);
assert.match(deploy, /CLOUDFLARE_API_TOKEN/);
assert.match(deploy, /CLOUDFLARE_ACCOUNT_ID/);
assert.match(deploy, /verify-live-search-backend\.mjs/);
assert.match(deploy, /benchmark-production-endpoint\.mjs/);
assert.match(deploy, /verify-production-security\.mjs/);
assert.match(verify, /Missing CLOUDFLARE_API_TOKEN/);
assert.match(verify, /Missing CLOUDFLARE_ACCOUNT_ID/);
console.log('Cloudflare deploy workflow contract verified with pre-deploy and post-deploy security gates.');
