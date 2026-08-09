# Access service security configuration

The access-code service reads these values only from encrypted Cloudflare Worker secret bindings:

- `ACCESS_CODE_SECRET`
- `ACCESS_ADMIN_PASSWORD_HASH`
- `ACCESS_ADMIN_SESSION_SECRET`

Do not put values for these bindings in Git, Wrangler configuration, GitHub Actions variables, build output, logs, or browser code. Configure them interactively with `wrangler secret put` only after rotating the previously exposed credentials.

The Cloudflare deployment API token must be limited to the target account and Worker with only the permissions required to deploy. Production deployments must remain protected by the GitHub `production` environment, required reviewers, and the workflow guard that accepts only a push to `main`.

The admin login endpoint should also have a Cloudflare rate-limiting rule before production activation. GitHub secret scanning and push protection should remain enabled because the retired client-side values still exist in repository history until an approved history rewrite is completed.
