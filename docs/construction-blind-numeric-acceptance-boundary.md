# Construction Blind Numeric Acceptance — execution boundary

Status: BLOCKED until a trusted input transport and downstream AI executor are provisioned.

## Trust boundaries
1. PR CI is **untrusted**. It must never receive upload credentials, sealed answer keys, QA Gates, or downstream AI credentials. Existing prompt E2E remains synthetic and cannot establish numeric correctness.
2. An operator-controlled **trusted runner** outside PR execution must stage only `blind_input.pdf` and `blind_input_no_answer_key.xlsx` in an isolated directory. Do not stage sealed materials in this workspace. The runner must pin a reviewed commit, rather than execute arbitrary PR head code with secrets.
3. Validate exact filenames, regular files, size, file signatures, and out-of-band SHA-256 values using `node tests/e2e/construction-blind-input-gate.mjs`. Missing/mismatched inputs fail closed. Verify trusted runner permissions and dependency provenance before execution.
4. Run downstream AI on those inputs **without** the answer key. Capture full Actual Prompt, source references, tables A–D with per-cell values/formulas, Decision Lock, and raw Actual Numeric Output. Persist immutable content-addressed evidence (SHA-256 plus trusted storage retention/lock) **before** unsealing the answer key.
5. Only a separate verifier, after receipt of the locked actual-output digest, may access the sealed answer key/QA Gates. Compare concrete quantities, formwork difference 42,000 THB, Factor F and all A–D cells. Missing/ambiguous values must be BLOCKED, not fabricated or marked PASS.
6. Do not merge, deploy, or alter the production URL without separate authorization.

## Current implementation limits
- GitHub-hosted PR runners do not automatically contain either blind input file.
- `workflow_dispatch` plus path environment variables does **not** transfer files into a runner. Its current integrity gate will fail closed if paths or digests are missing.
- No authenticated trusted artifact intake, downstream AI invocation, immutable external evidence storage, or separately privileged answer-key comparison has been configured or verified.
- CI success is **prompt-generation acceptance only**; numeric acceptance remains NOT TESTED.

## Required operator provisioning
Approve and provision a trusted storage/runner channel for the two blind files, out-of-band SHA-256 digests, a downstream AI executor, and immutable evidence storage. Keep sealed evidence in a different security principal. Only then run numeric acceptance and compare results.
