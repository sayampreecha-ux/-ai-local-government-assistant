# Legacy file register

The repository root contains displaced Enterprise modules, historical archives,
backup pages, and earlier deployment variants. They are retained to preserve
existing functionality and recovery evidence. Production code must use `api/`,
`lib/`, and `supabase/` as its canonical structure.

Canonical adapters preserve the verified behavior of the displaced modules:

- `lib/server.mjs` -> `preflight.mjs`
- `lib/security.mjs` -> `catalog.mjs`
- `lib/notifications.mjs` -> `verify-drop-package.mjs`
- `lib/catalog.mjs` -> `notifications.mjs`
- `lib/prompt-master.mjs` -> `generate-secrets.mjs`
- `lib/prompt-assembler.mjs` -> `server.mjs`

The root API-named modules are also retained. Canonical `api/*.mjs` adapters map
their verified behavior to the public endpoint names. Files not explicitly
included in `vercel.json` are repository artifacts, not supported runtime entry
points. No legacy file should be deleted until a later, separately approved phase.
