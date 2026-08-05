# GovPrompt Thailand v7 — Codex Runbook

## วิธีใช้
ให้ Codex ทำทีละ Sprint ห้ามสั่งรวมทุก Sprint ในครั้งเดียว ตรวจ diff ก่อน merge ทุกครั้ง

## คำสั่งเริ่มต้นสำหรับ Codex

```text
You are working in repository sayampreecha-ux/-ai-local-government-assistant.

Read these files first:
- docs/V7_ROADMAP.md
- docs/V7_ARCHITECTURE.md
- assets/js/core/shared-context.js
- assets/js/core/master-prompt-engine.js
- assets/js/core/prompt-registry.js
- assets/js/core/transaction-router.js
- assets/js/core/knowledge-index.js
- assets/js/core/semantic-search.js
- assets/js/core/knowledge-engine.js

Rules:
1. Preserve the existing UI and GP001–GP013 behavior.
2. Do not remove legacy prompts; treat them as module-specific rules.
3. Work on a new branch for each sprint.
4. Keep code modular and browser-compatible with the current static GitHub Pages architecture.
5. Do not introduce paid external services, secrets, or API keys.
6. Add tests or a browser smoke-test page for every sprint.
7. Report changed files, risks, and manual test steps before requesting merge.
```

## Sprint 2 Prompt — Intent Router

```text
Implement Sprint 2: Intent Router according to docs/V7_ROADMAP.md and docs/V7_ARCHITECTURE.md.

Requirements:
- Inspect the existing transaction-router.js before changing code.
- Route Thai government-work queries to GP001–GP013.
- Return primaryModule, secondaryModules, intent, confidence, reasons, and clarificationNeeded.
- Support multi-domain questions.
- Add deterministic keyword/rule routing first; keep extension points for semantic routing later.
- Do not change the UI.
- Add tests covering at least 30 Thai queries, including ambiguous and cross-domain cases.
- Keep backward compatibility with existing router APIs where possible.
- Create a PR and do not merge automatically.
```

## Sprint 3 Prompt — Knowledge Search

```text
Implement Sprint 3: Knowledge Search Engine.

Requirements:
- Reuse knowledge-index.js, semantic-search.js, document-loader.js, citation-engine.js and knowledge-engine.js.
- Define a normalized SearchResult schema.
- Search uploaded/current documents before internal knowledge for case facts.
- Support keyword, phrase, normalized Thai text and semantic-extension hooks.
- Return evidence chunks with source metadata.
- Deduplicate repeated documents and chunks.
- Add tests for missing results, duplicate results and Thai wording variants.
- No external API or secret.
- Preserve current UI and existing module pages.
```

## Sprint 4 Prompt — Search Ranking

```text
Implement Sprint 4: Search Ranking.

Requirements:
- Score relevance, phrase match, authority, effective status, recency and module/context match.
- Do not rank by date alone.
- Penalize repealed, amended, duplicate and unknown-status documents with explicit flags.
- Return score breakdown and ranking reasons.
- Add conflict detection metadata.
- Add at least 20 ranking tests.
```

## Sprint 5 Prompt — Evidence and Reasoning

```text
Implement Sprint 5: Evidence Pack and Reasoning Engine.

Requirements:
- Build facts, authorities, conditions, exceptions, conflicts, missingInformation and citations.
- Never generate a definitive conclusion when evidence is insufficient.
- Separate facts from legal/administrative analysis.
- Make the engine reusable by GP001–GP013.
- Preserve legacy module-specific output requirements.
- Add tests for procurement, finance, legal, records and council cases.
```

## Sprint 6 Prompt — Quality Gate

```text
Implement Sprint 6: Quality Gate.

Requirements:
- Add PDPA, unsupported-claim, citation, stale-source, source-conflict and incomplete-fact checks.
- Return pass, pass_with_warning or block.
- Provide human-readable warnings in Thai.
- Do not expose hidden reasoning.
- Add test cases with personal data, invented legal references, conflicting documents and missing facts.
```

## Sprint 7 Prompt — Integration

```text
Implement Sprint 7: integrate Shared Context, Intent Router, Search, Ranking, Evidence, Reasoning and Quality Gate across GP001–GP013.

Requirements:
- Keep all existing pages available.
- Use Master Prompt v7 as the common layer and legacy prompts as module-specific rules.
- Avoid duplicated search boxes and duplicated output locations.
- Ensure a new query does not reuse stale results from a previous query.
- Add regression tests for all 13 modules.
```

## Sprint 8 Prompt — Beta Release

```text
Prepare GovPrompt Thailand v7 Beta.

Requirements:
- Run regression checks across index.html and GP001–GP013.
- Test desktop and mobile layouts.
- Create at least 100 representative Thai local-government test cases.
- Document known limitations and rollback steps.
- Do not merge or deploy until the test report is provided.
```

## ข้อห้ามสำคัญ
- ห้ามแก้ main โดยตรง
- ห้ามลบ Prompt เดิมก่อนผ่าน regression test
- ห้ามอ้างว่าค้นกฎหมายล่าสุดได้ หากยังไม่มีแหล่งข้อมูลจริง
- ห้ามซ่อนสถานะ unknown/repealed/conflicting
- ห้าม Merge อัตโนมัติ
