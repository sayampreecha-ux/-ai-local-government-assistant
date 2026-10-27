# GovPrompt PR #352 — User-provided downstream AI seven-part output review

Date: 2026-10-27
Review method: Manual semantic review of a seven-part Thai tort-liability document response **pasted by the user into this conversation** after being given a synthetic test prompt containing `[GP_TORT_LEVEL1_HANDOFF_V1]`.
Provenance limitation: The original external provider, session, URL, actual paste and generation event were **not independently observed** here. Treat as **USER_SUPPLIED_DOWNSTREAM_OUTPUT_REVIEW**, not verified browser E2E or proven external-model identity. Full pasted output is preserved in conversation, not copied into repository.

## Acceptance rubric and results

| Gate | Result | Verifiable excerpt / reason |
|---|---|---|
| Seven requested sections included | PASS | Sections 1 through 7 are present |
| No invented facts | **FAIL** | Sec.7 specifies 'กันชนหน้า, ไฟหน้าซ้าย, ฝากระโปรง' and opposing car 'ตัวถังด้านข้างขวา, ประตู' although synthetic input contains no damaged components |
| Verified-vs-unverified evidence | **FAIL** | Sec.1.1 lists as 'Verified Facts' collision, duty status and actual damage despite no records; sec.6.2 states use-authorization record confirms duty even though no record was supplied |
| No simulated inquiry masquerading as conducted | **FAIL** | Sec.6.1 'คณะกรรมการฯ ได้รวบรวมพยานหลักฐานเบื้องต้น' and sec.6.3 concludes in-duty legal status without documentary evidence or actual appointment |
| Source/version and limitations | **FAIL** | Sec.1.3 inaccurately describes an unnamed Prime Minister regulation 'ว่าด้วยการรับฟังความคิดเห็นและหลักเกณฑ์การชดใช้ค่าสินไหมทดแทน', labels acts applicable without consolidated current-version check, and claims limitations 'อยู่ระหว่างเริ่มต้นนับอายุความ' without knowledge-date evidence. Section 10's application cannot be resolved merely from this prompt |
| No percentage allocation or liability order | PASS | Explicit C66/C141 decision lock; no numeric share or recourse order |
| Human approval/authority gate | PARTIAL | Sec.5 properly flags appointment authority NOT VERIFIED, yet sec.4 prematurely proposes appointment as an action and sec.6 falsely speaks for committee |
| PDPA exposure in supplied response | PASS_LIMITED | No actual personal identifiers disclosed; cannot verify external-provider data handling |
| Independent external AI browser session witnessed | NOT VERIFIED | User pasted output; no connected browser or provider metadata |
| End-user-ready legal document | FAIL | Material evidentiary and source problems |

**Overall:** FAIL — substantive factual/evidence legal safety gates. Seven-part structural format alone is PASS. **Do not merge, deploy, mark external browser acceptance PASS, or unlock legal/percentage gates based on this output.**

## Minimal-change recommendation, not executed

1. Amend `completeTortLevel1Handoff` only if root-cause triage justifies it: explicitly state that even synthetic scenario facts are unverified allegations and MUST NOT be labelled 'verified'; documents describing completed investigations, committee appointments or signed decisions MUST be clearly non-operational blank drafts.
2. Ban concrete damage parts, source documents, quotations, amounts, dates, people, investigation findings and limitation accrual when not provided. Placeholders only.
3. Require seven-output post-generation verification checklist on recipient side; outgoing prompt is not a guarantee a free external AI obeys it.
4. Cross-check original statutory/ministerial title and current law; no automatic assertion of current applicability or limitation start date.
5. Repeat an actual downstream test on corrected handoff using externally observed evidence if access becomes available. Human legal reviewer must clear remaining law/authority gates.

**No code modified, no CI rerun, no change to Release Gate, no Merge/Deploy.**
