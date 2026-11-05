# Official source access evidence — 5 November 2026

Main baseline: b160a3272ab96d822247847bab3649eaebee00a7. PR #366 already merged before this run. No open Circular Watch PR found; one follow-up Draft PR is authorized. PR #367 was not modified.

| Source | Direct browser observation | Content / feed result |
| --- | --- | --- |
| https://www.dla.go.th/land/officialDoc.do | Connection timeout, repeated once | Live listing, attachments and feed NOT VERIFIED |
| https://www.dla.go.th/land/tempOfficialDoc.do?cmd=goView&tokenId=mtmtt0t1gd03j1nssc6361nedlrr1c1gvfu6u591cty | Connection timeout | Original detail/PDF NOT VERIFIED |
| https://cmsmoi.moi.go.th/ | Remote connection failure | Supplementary live ingestion NOT VERIFIED |
| https://ratchakitcha.soc.go.th/search-result/ | Security/bot verification remained after one reload | Stop, no bypass; supplementary ingestion BLOCKED |
| https://sayampreecha-ux.github.io/-ai-local-government-assistant/circular-watch.html | Registry loaded 0 records; preview-only import UI | Production read-only observation, no mutation |

Search engine official-domain result `turn2search0` exposed the DLA detail metadata used in discovered-input.json. Search reference is session evidence, not a durable government document identifier. The official detail URL is retained exactly above and in the JSON. The index reports document number มท0815.3/ว79 and date 06/10/2568. Only this one lead is retained; no counting all search hits as imported documents. Attachment labels are visible in the index but attachment URLs/original bytes could not be verified. No PDF hash has been invented.

Counts: real metadata leads discovered 1; in review queue 1 (DISCOVERED 1, STAGED 0); VERIFIED 0; human-approved 0; PUBLISHED 0. `officialSourceGate.pass` means allowed URL/queue structure only, not document verification. See each entry's failing documentEvidenceGate and missing-original issues.

Root causes: original preview had no resumable/exportable review queue; normalizeRecord discarded documentSha256; public loader did not separate publication from imported review flags; partial/unavailable registry could mislabel an import NEW; load failures could retain selected evidence. Branch fixes address these technical gaps. Access to original government documents, current-version coverage and responsible human review remain external blockers. No auto-sync, authenticity or latest-law claim.
