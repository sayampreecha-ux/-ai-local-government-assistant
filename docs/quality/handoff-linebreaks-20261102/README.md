# Handoff quality line breaks — 2 November 2026

Baseline main: `4b78a656fdf1f4efdc946df4f35b24548fb5a23f`.

The live memo prompt displayed literal backslash-n sequences around and inside
`GP_HANDOFF_QUALITY_V1`. `enforceHandoffQuality` joined its rules using escaped
backslashes instead of newline characters. Replace only those separators and
bump the Home asset reference to 6.4.34. Rule wording, router, governance,
privacy and approval behavior remain unchanged.

Validation on this patch: npm test (1,601 Node tests and the subsequent 10-case
adversarial suite) passed; build and targeted QA60 quality/output tests passed.
The existing 18 final-copyable browser scenarios have identical SHA-256 values
before and after the change; see prompt-comparison.json. The existing nine
quality fixtures now assert real line boundaries and reject literal backslash-n
in the added quality section. No assertion or release gate was relaxed.

Live production baseline: the existing 56-check diagnosis suite passed across
390px and 1365px, including clipboard, domain smoke and privacy blocks. This
proves the deployed baseline, not this unmerged patch. Broader QA fixture and
candidate browser verification are recorded separately in the final report.

A real anonymous ChatGPT handoff returned a complete memo with honest no-DOCX
fallback but also added an unprovided resource/equipment assumption. Therefore
this formatting fix does not claim to resolve downstream semantic or file
quality. Actual DOCX/XLSX/PDF acceptance remains unverified or blocked by the
available provider session. No paid API, recurring service, merge or deploy.
