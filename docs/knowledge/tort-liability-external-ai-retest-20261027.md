# PR #352 — User-submitted downstream seven-document re-test (Round 2)

Date: 2026-10-27. Prompt marker: GP_TORT_LEVEL1_HANDOFF_V1. Compared with previously recorded downstream failure (docs/knowledge/tort-liability-external-ai-7part-acceptance-20261027.md).

PROVENANCE: Seven-part response pasted by user into ChatGPT. Actual external provider, browser session and exact in-app copy event not independently observed. This is a **manual semantic assessment of user-supplied purported downstream AI output**, not Browser E2E, not proof of independent provider identity. The complete output remains in conversation.

| Gate | Outcome | Evidence in submitted text |
|---|---|---|
| Seven complete sections | PASS | Parts 1–7, plus checklist |
| Unspecified vehicle parts / money invented | PASS | Sec.7 uses [รอตรวจสอบ] throughout, unlike prior specific bumper/headlight |
| Treating scenario as verified evidence | PASS_WITH_CAUTION | Sec.1 separates simulation/UNVERIFIED and says no verified facts; Sec.5 conditional draft nevertheless says 'ด้วย ปรากฏข้อเท็จจริงเบื้องต้นว่า...' (prematurely established language) |
| Pretending committee has performed an inquiry | PASS | Sec.6 clearly states committee has not conducted inquiry; no invented interview |
| Premature duty/negligence adjudication | PASS | Sec.6 defers duty and negligence findings, with decision lock |
| Legal source, exact instrument name, authority and limitation | **FAIL** | Sec.4/5 repeatedly call 'ระเบียบนายกรัฐมนตรีว่าด้วย...' whereas primary government text titles it 'ระเบียบสำนักนายกรัฐมนตรีว่าด้วยหลักเกณฑ์การปฏิบัติเกี่ยวกับความรับผิดทางละเมิดของเจ้าหน้าที่ พ.ศ. 2539'; Sec.5 mechanically cites both clauses 8 and 9 as appointment basis without determining case-specific conditions. Sec.1 avoids invented limitation start, improvement over Round 1 |
| C66/C141 percentages and recourse order | PASS | No percentage specified, no recourse order |
| Human review and data minimization in output | PASS_WITH_CAUTION | Checklist, placeholders, no real PII; checkbox claiming the law names were verified is self-certified and inaccurate |

Sources for legal naming and clause review: Department of Groundwater Resources official listing https://www.dgr.go.th/law/th/newsAll/318/4806 ; Department of Lands original regulation https://www.dol.go.th/legal/Documents/order1.pdf ; source-to-claim matrix and current legal version gates remain NOT VERIFIED.

**Verdict: SEMANTIC RETEST PARTIAL / RELEASE FAIL.** Most previous hallucination controls improved; exact regulation naming and unsupported clause 8/9 authority remain open, plus premature wording in a conditional order. Do not override release gate, claim external browser verified, merge or deploy. Next minimal change: add exact title, conditional authority-check and no self-certified completed legal checking to the existing tort handoff; retest only these failed properties and independently verify external output before release.
