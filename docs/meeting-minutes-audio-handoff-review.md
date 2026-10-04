# GovPrompt — Meeting Minutes Audio Handoff Review

วันที่ตรวจ: 4 ตุลาคม 2569
สถานะสุดท้าย: **READY WITH CONDITIONS** สำหรับ GovPrompt ที่สร้างและส่งต่อคำสั่ง — source/Prompt handoff และ regression เสร็จและผ่าน; ผล TEST 4 คำตอบจริงใน Qwen ปกติและ Thinking ยังคง FAIL และไม่ถือเป็นการรับรอง runtime ปลายทาง

## 1. Pre-flight

- Repository เดิม: `sayampreecha-ux/-ai-local-government-assistant`
- Workspace เดิม: `/workspace/scratch/019a23bf6590/govprompt-main-baseline`
- Checkout เดิมเป็น detached HEAD `0cd2e93ace571e39e203575a73807ccd1ce6818a` จากงานเดิม
- Fetch main แล้วใช้ baseline ล่าสุด `af5274185fd2909b0d4637e9507ff6cd9ee33aa1` ซึ่งมีงานเมนูประชุมและแก้ privacy warning ล่าสุดอยู่แล้ว
- Branch งานนี้: `fix/meeting-minutes-audio-handoff`
- ก่อนแก้ไม่มี modified tracked files; มี symlink `node_modules` ที่ untracked เดิม เก็บไว้โดยไม่แก้
- ไม่สร้าง project/repository ใหม่ ไม่เปลี่ยน Production URL ไม่ push ไม่ deploy
- Baseline `npm test` ผ่านทั้งหมด: node test runner หลัก 692/692; meeting suite เดิม 11/11

## 2. Implementation เดิม

| ส่วน | ไฟล์ | สิ่งที่พบ |
|---|---|---|
| เมนูเดิมสองตำแหน่ง | `assets/js/ui/quick-action-guided-bridge-v1.js` | สารบรรณมี “📝 ทำรายงานการประชุม”; สภามี “🏛️ ทำรายงานการประชุมสภาท้องถิ่น” |
| Prompt assembly และหน้าผลลัพธ์ | `assets/js/home-v3.js` | เรียก runtime contract แล้วเพิ่มใน Prompt; คัดลอก/ส่งต่อผ่านหน้าผลลัพธ์ |
| Meeting Minutes Contract | `assets/js/core/government-workflow-runtime-v5.js` | `buildMeetingMinutesDraftView`, `buildWorkflowPromptBlock`; contracts `gov.council.minutes-draft.v1` และ `gov.correspondence.minutes-draft.v1` |
| Router | `prompt-registry.js`, `transaction-router.js`, overrides และ `router-real-query-hotfix.js` ใน `assets/js/core/` | General → GP001/gov.correspondence; Council → GP013/gov.council; ไม่แก้ไฟล์ Router เหล่านี้ |
| Tool policy | `assets/js/core/tool-routing-policy.js` | ใช้ข้อมูลที่ให้ก่อน ไม่ค้นสดอัตโนมัติสำหรับ draft; มี audio capability instruction อยู่แล้ว |
| Output contract | `assets/js/core/output-router.js` | มี meeting_minutes output อยู่แล้ว |
| ปุ่มส่งต่อจริง | `assets/js/ui/status-copy.js` | เดิมสร้าง Prompt แบบย่อใหม่ ทำให้ contract ถูกตัดจากปุ่มส่งต่อหลัก |
| Tests เดิม | `tests/unit/meeting-minutes-workflow-v1.test.js` | 11 tests; ส่วนใหญ่เป็น runtime/routing/contract assertions ไม่ใช่ผลตอบของ AI ปลายทาง |

ข้อผิดพลาดที่พบจากการทดสอบจริง: ข้อความเมนูทั่วไปเดิมกล่าวว่า “ไม่ใช่การประชุมสภาท้องถิ่น” แต่ classifier จับคำว่าสภาและเลือก Council Profile; ปุ่มหลักยังมองหาปุ่มคัดลอกคนละชื่อ; Prompt ที่ส่งต่อถูกสร้างใหม่จน contract หาย; ข้อความกำกับการวินิจฉัยกฎหมายถูก Privacy Guard มองเป็นบริบทสุขภาพในคำสั่งเมนูสภา

## 3. ไฟล์ที่เปลี่ยนทั้งหมด

| ไฟล์ | การเปลี่ยน |
|---|---|
| `assets/js/core/government-workflow-runtime-v5.js` | ปรับ contract เดิม: แนบเสียงตรงกับ AI ปลายทาง, ตรวจไฟล์และ capability จริง, fallback transcript/text, ห้ามสร้าง timestamp/ตัวบุคคล/มติ/คะแนน/ผู้รับผิดชอบ/deadline; แยก working evidence กับ clean minutes; ระบุ Human Review; วาระสภาตามต้นฉบับ; เพิ่มเรื่องติดตามสำหรับทั่วไป; แยกคำถามกฎหมายออกจากข้อยกเว้น Draft; บังคับสองชั้น/ห้ามอนุมานผู้เสนอในคำถามต่อ/แยกคำขอจากมติ/ตรวจหลักฐานก่อนตอบ |
| `assets/js/core/output-router.js` | สถานะหลักฐานอยู่ในชั้นตรวจสอบเท่านั้น ไม่ปนฉบับสะอาด |
| `assets/js/core/tool-routing-policy.js` | ให้คำแนะนำสถานะหลักฐานสอดคล้องกัน และไม่ให้คำถามองค์ประชุม/คะแนน/ญัตติ/อำนาจได้รับข้อยกเว้น Draft |
| `assets/js/home-v3.js` | สร้าง Prompt เฉพาะ draft จากข้อมูลผู้ใช้และ contract เดิม เพื่อไม่ปน legal boilerplate; legal questions ใช้เส้นทางเดิม; แสดงคำแนะนำเสียง/Human Review; เก็บ Prompt ของ card ใน WeakMap ชั่วคราว; ใช้ชื่อปุ่มคัดลอกที่ตัวส่งต่อเดิมรู้จัก |
| `assets/js/ui/quick-action-guided-bridge-v1.js` | แก้คำแนะนำในสองเมนูเดิมโดยไม่เปลี่ยน label/ตำแหน่ง; ให้แนบเสียงที่ AI ปลายทางโดยตรง; แก้ context ของทั่วไปและคำที่ก่อ false privacy warning ในข้อความกำกับสภา |
| `assets/js/ui/status-copy.js` | ใช้ Prompt ประชุมฉบับเต็มเดิมแทนการสร้างแบบย่อ; ตรวจ source ผู้ใช้แยกจากคำกำกับเรื่องชีวมิติ โดยยังตรวจ blocking/residual risks ของทั้ง Prompt; ไม่เปลี่ยน Privacy Guard หลัก |
| `tests/unit/meeting-minutes-workflow-v1.test.js` | เพิ่ม tests เรื่อง audio gate, สองชั้น, profile, คำถามกฎหมาย และคำสั่งเมนูจริง; รวม 15 tests |
| `scripts/verify-meeting-minutes-handoff.mjs` | Browser acceptance ผ่าน built local UI; 8 cases, กดสองเมนูจริง, ทดสอบ ChatGPT/Gemini export และ sensitive-source blocking; spy การค้นโดยไม่เรียกบริการจริง |
| `docs/meeting-minutes-audio-handoff-review.md` | รายงานฉบับนี้และผลการตรวจคำตอบจริง |
| `docs/meeting-minutes-downstream-evidence.json` | Prompt ที่ส่งออกจาก UI และคำตอบจริงของ synthetic fixtures พร้อมข้อจำกัด |
| `docs/meeting-minutes-downstream-check.jpg` | หลักฐานหน้าจอคำตอบ fallback จริงที่ขอ transcript/text และไม่อ้างว่าฟังเสียง |
| `docs/meeting-minutes-audio-check.jpg` | หลักฐานผลเสียงจริงล่าสุดใน Qwen Thinking ที่เติมเลขครั้งโดยไม่มีต้นฉบับ; ภาพผู้พูด 2/3 เดิมอยู่ใน Git history |

WeakMap เก็บข้อความคำสั่งในหน่วยความจำของ card เท่านั้น ไม่เก็บไฟล์เสียง ไม่มี upload/API/database/storage ใหม่

## 4. พฤติกรรมหลังแก้

Council: คงสมัย/ครั้งที่ วันเวลา/สถานที่ ผู้มาประชุม/ไม่มา/เข้าร่วม เวลาเริ่ม วาระจากต้นฉบับ ญัตติ/ข้อเสนอเมื่อมีหลักฐาน อภิปราย คำชี้แจง มติ คะแนนเมื่อมีหลักฐาน เวลาเลิก ผู้จด/ผู้ตรวจ และส่วนรับรองเป็นร่างที่มนุษย์ดำเนินการ

General: ใช้กับผู้บริหาร หัวหน้าส่วน คณะกรรมการ/อนุกรรมการ/คณะทำงาน โครงการ ประจำเดือน และทั่วไป; ใช้หัวข้อจริง สาระหารือ ข้อเสนอ ข้อสรุป/มติ/ข้อสั่งการ ผู้รับผิดชอบ/กำหนดเวลาและเรื่องติดตามเมื่อมีหลักฐาน ไม่บังคับญัตติหรือคะแนนแบบสภา

ทั้งสองใช้ช่องสนทนาหลัก ไม่เปิดแบบฟอร์มยาว ใช้ข้อมูลที่มี ไม่ถามซ้ำ ร่างทันทีเมื่อพอ ใช้ placeholder เฉพาะจำเป็น; แยก Working Transcript/Review Evidence ออกจากรายงานราชการฉบับสะอาด และมีข้อความ “ร่างจากข้อมูลที่มี กรุณาตรวจสอบกับต้นฉบับก่อนรับรองรายงานการประชุม”

Audio workflow เป็น **คำสั่งสำหรับ AI ปลายทาง**: ผู้ใช้แนบไฟล์ที่ปลายทาง → ตรวจไฟล์แนบจริง → ตรวจ runtime อ่าน/ถอดไฟล์นั้นได้จริง → Transcript → Speaker Segmentation ตามหลักฐาน → Agenda/Topic Mapping → Discussion → Proposal เมื่อเกี่ยวข้อง → Decision → Vote เฉพาะหลักฐาน → Draft → Human Review. หากไม่รองรับ ขอ transcript/text และห้ามอ้างว่าฟัง/ถอดแล้วหรือสร้างจาก metadata

Draft Minutes ไม่ถูกบล็อกเพียงเพราะไม่ได้ตรวจฐานกฎหมาย; คำถามกฎหมายแยกไป Gate เดิม ไม่สรุปความชอบด้วยกฎหมายจากร่างอย่างเดียว

## 5. TEST 1–8

PASS ด้าน source หมายถึงพฤติกรรม runtime/UI และ Prompt ที่คัดลอกจริง ส่วนคำตอบ AI ตรวจด้วย synthetic fixtures ใน ChatGPT browser ที่ไม่ได้ลงชื่อเข้าใช้ ไม่ระบุ model และไม่ถือเป็นผลรับประกันทุก runtime

| TEST | กรณี | Source/Prompt handoff | คำตอบปลายทางที่สังเกตจริง |
|---|---|---|---|
| 1 | Council/Text | PASS | PASS หลังแก้และทดสอบซ้ำในบทสนทนาใหม่ — ร่างทันที สองชั้น ไม่เพิ่มญัตติ/การอภิปราย/คะแนน ไม่อนุมานว่าประธานเป็นผู้เสนอทั้งในชั้นหลักฐานและคำถามต่อ |
| 2 | General/Text | PASS | PASS หลังแก้และทดสอบซ้ำ — ไม่ใช้ญัตติ/คะแนน; คำขอไม่ถูกยกระดับเป็นมติ ไม่มีเจ้าของงานหรือวันครบกำหนดสมมติ |
| 3 | Committee | PASS | PASS — บันทึกเรื่องปรับแผนงานและเห็นชอบตามที่เสนอ ไม่มีจำนวนเสียง/บุคคลเพิ่ม |
| 4 | Audio-capable attached file | PASS เฉพาะ contract | FAIL หลังแก้และทดสอบซ้ำด้วย WAV สภาที่ตรง Profile — Qwen ปกติและ Thinking ยังระบุที่มาผิด/ใส่ metadata ในฉบับสะอาด; ปกติเพิ่มประเภทเทศบาล ส่วน Thinking เพิ่มครั้งที่ 1 และกล่าวว่าไม่มีการลงคะแนนทั้งที่เสียงเพียงไม่ประกาศจำนวนเสียง; ผลก่อนแก้ที่แต่งผู้พูด 3 คนเก็บไว้ด้วย |
| 5 | Audio unsupported | PASS | PASS สำหรับ fallback เมื่อเข้าไม่ถึงเสียง: ขอ transcript/text ไม่สร้าง transcript; ยังไม่ทดสอบ binary ที่แนบจริงแต่ runtime อ่านไม่ได้ |
| 6 | Missing vote count | PASS | PASS ในบทสนทนาใหม่ — บันทึกมติ ไม่มีจำนวนคะแนนเพิ่ม และละหัวข้อคะแนน/ญัตติที่ไม่มีหลักฐาน |
| 7 | Unclear/Unknown speaker | PASS | PASS สำหรับข้อความบันทึกที่มี [ฟังไม่ชัด] ในบทสนทนาใหม่ — ผู้พูดที่ 1, มติรอตรวจสอบ, ข้อมูลขาดอยู่ในชั้นหลักฐาน; ไม่ได้ทดสอบเสียงที่ฟังไม่ชัดจริง |
| 8 | Legal follow-up | PASS — route/gates/search spy เดิม | PASS เกณฑ์ไม่ฟันธงจาก Draft อย่างเดียว — ขอข้อเท็จจริง/อำนาจ/ขั้นตอนเพิ่มเติม; ผลตอบมีแหล่งที่ไม่ใช่ทางการ จึงยังไม่รับรอง authority/version และไม่ถือว่ากฎหมายผ่าน Gate สมบูรณ์ |

การตรวจคำตอบจริงพบข้อบกพร่องก่อนแก้: ขาดชั้นหลักฐาน, นำเรื่องแจ้งเป็นญัตติ, นำคำขอเป็นข้อสรุป และเติมการหารือจากเรื่องแจ้ง จึงเพิ่มคำสั่งสองชั้นแบบบังคับ แยกแจ้งเรื่อง/คำขอ/ข้อเสนอ/มติ และหัวข้อมีเงื่อนไข แล้วทดสอบซ้ำ. Prompt ไม่สามารถรับประกันการทำตามของโมเดลทุกคำตอบ; เพิ่มข้อห้ามอนุมานผู้เสนอจากผู้แจ้งในทุกชั้น/placeholder/คำถามต่อ และตรวจคำตอบก่อนส่งอีกครั้ง. รอบต่อมาเพิ่ม provenance ของ transcript จาก runtime, ห้ามแยกเสียงตามบุคคลที่ผู้บรรยายกล่าวถึง และตรวจ metadata ในฉบับสะอาดทุกตำแหน่ง. ผลก่อนหน้ายังคงอยู่ใน Git history; evidence JSON ปัจจุบันเก็บผลทดสอบสุดท้ายแบบแยกบทสนทนาและข้อจำกัดที่เหลือ

รอบปิดงานใช้ Prompt ที่คัดลอกจาก built UI ล่าสุดแบบตรงตัว และทดสอบ TEST 1/2/3/5/6/7 แยกบทสนทนาใหม่ทุกกรณี จึงไม่ใช้บริบทประชุมอื่น; TEST 8 ใช้ legal Prompt ที่ส่งออกจริงและไม่เปลี่ยนในบทสนทนาร่างก่อนหน้า. ไม่ส่งเสียงประชุมส่วนบุคคลของผู้ใช้ให้บริการภายนอก; ต่อมาทดสอบ WAV สังเคราะห์จริงใน Qwen ตามส่วน 9

Browser actual final override เลือก GP002 สำหรับคำถามกฎหมายสั้นนี้ ขณะที่ unit harness ที่โหลด router hotfix เพียงชุดหนึ่งเลือก GP013; workflow runtime ยังเข้ากระบวนการกฎหมาย/อำนาจเดิมและไม่มี draft exemption ไม่แก้ Router หลักเพื่อเปลี่ยนความต่างที่มีอยู่เดิม

กดเมนูสองตำแหน่งจริงแล้ว profile ถูกต้อง ไม่มี modal/form ยาว; ปุ่ม ChatGPT และ Gemini ส่ง contract เต็ม; clipboard ถูกตรวจโดย test spy และไม่เปิดบริการภายนอกจริง. ทดสอบว่าข้อมูลสุขภาพใน source ยังถูกบล็อกแม้ข้อความกำกับที่ระบบสร้างได้รับการแยกตรวจแล้ว

## 6. Post-flight

- `npm test`: PASS ทั้งชุดเดิมและเพิ่มใหม่; node test runner หลัก **696/696**, fail 0 (baseline 692); scripts ใน npm test ผ่าน รวม benchmark ที่มี REVIEW ตามเกณฑ์เดิม
- Meeting suite: **15/15 PASS** (11 เดิม + 4 เพิ่ม)
- Browser handoff TEST 1–8 + สองเมนูจริง + export + privacy negative checks: PASS
- `npm run check:syntax`: PASS; ตรวจ status-copy และ script เพิ่มด้วย `node --check`: PASS
- `npm run build`: PASS — build local เท่านั้น ไม่ใช้ build ผ่านเป็นหลักฐานความถูกต้องของผล AI
- `git diff --check`: PASS
- ตรวจ diff: มีแต่ไฟล์ในตารางขอบเขตนี้ ไม่แก้ index/menu labels/Router หลัก/Official Search/Official Precedent Gate v3.1/Decision Lock หลัก/Privacy Guard หลัก/backend/auth/schema/deployment config

## 7. ข้อจำกัดและสถานะสุดท้าย

**READY WITH CONDITIONS** สำหรับการนำร่องสร้างคำสั่งของ GovPrompt; source/งานข้อความและ regression เสร็จแล้ว. GovPrompt ไม่รับรองการอ่านไฟล์เสียงหรือคำตอบของ AI ภายนอก; ผู้ใช้เลือก runtime ที่อ่านไฟล์นั้นได้จริงและตรวจร่างกับต้นฉบับก่อนรับรอง

เงื่อนไขที่ยังเหลือ: TEST 4 ทดสอบไฟล์แนบจริงได้แล้วแต่ Qwen demo ยังไม่ทำตาม capability/evidence contract ต้องตรวจผ่านกับ runtime ที่จะใช้จริงก่อน audio pilot; เพิ่มกรณีไฟล์แนบที่ไม่รองรับและเสียงไม่ชัดจริง; ตรวจซ้ำตาม model ที่จะใช้จริง. รอบสุดท้ายได้ตรวจข้อความแยกบทสนทนาทุกกรณีแล้ว. Human Review ยังต้องตรวจความตรงกับต้นฉบับ และ legal follow-up ต้องใช้แหล่งทางการ/ฉบับกฎหมายที่ตรวจได้. รอบนี้มีหลักฐาน audio end-to-end FAIL ใน runtime ที่ทดลอง จึงไม่ประกาศ audio end-to-end PASS หรือ READY FOR PILOT แบบไม่มีเงื่อนไข

ยังต้องตรวจ cache/version และ browser/session จริงก่อน deploy ในรอบที่ผู้ใช้สั่งแยก; รอบนี้ไม่เปลี่ยน release/deployment architecture และไม่ได้ deploy production

ยืนยัน: ไม่สร้างเมนูหรือรวม/ย้ายเมนู ไม่เพิ่ม STT/transcription API/audio storage/database schema ไม่เปลี่ยน authentication ไม่แก้ core legal/search gates ไม่เปลี่ยน Production URL ไม่ push หรือ deploy

## 8. Completion pre-flight / post-flight

- รอบปิดงานเริ่มจาก branch เดิม `fix/meeting-minutes-audio-handoff`, HEAD `2ae506f`; ไม่มี tracked modifications มีเพียง symlink `node_modules` เดิม ไม่มีงานผู้ใช้ถูกทับ
- แก้เพิ่มเฉพาะ minutes contract, assertions ของ meeting tests และรายงาน/หลักฐาน; ไม่เปลี่ยนเมนูหรือ runtime infrastructure
- Full `npm test`: PASS 696/696 fail 0; meeting suite 15/15; browser handoff TEST 1–8 และสองเมนู/export/privacy checks PASS; syntax และ local build PASS
- `git diff --check`: PASS; เปรียบเทียบ Router หลัก/agent governance/Official Search/Privacy Guard/access-system/search-worker กับ baseline แล้วไม่มี diff
- Source และ tests ในขอบเขตที่ทำได้เสร็จแล้ว ไม่ขอ login อีก ไม่ push/deploy; audio-positive TEST 4 เดิม BLOCKED; รอบถัดไปทดสอบเสียงจริงใน public demo ได้ แต่ผล FAIL ตามรายละเอียดส่วน 9

## 9. Actual audio completion attempt

- Pre-flight: branch เดิม HEAD `3e5be62`, tracked files สะอาด มีเพียง symlink node_modules เดิม; ไม่แก้ application source เพิ่ม
- ใช้ Qwen/Qwen3-Omni-Demo ที่เปิดได้โดยไม่ login; หน้า Gradio Offline รับไฟล์ WAV จริงหลังเปิดหน้า app โดยตรง (file chooser ใน iframe timeout)
- สร้าง WAV ทดสอบนอก GovPrompt ด้วย ffmpeg flite ที่ติดตั้งอยู่แล้ว: เสียงภาษาอังกฤษคนเดียว 20.125 วินาที, เนื้อหาประชุมคณะกรรมการโครงการ, เริ่ม 09.00 น., วาระความคืบหน้า/ปรับแผน, เห็นชอบตามที่เสนอ, ไม่ประกาศจำนวนเสียง, เลิก 09.30 น. ไม่มีข้อมูลส่วนบุคคลผู้ใช้
- ส่งไฟล์เสียงกับ TEST-4 Prompt ที่คัดลอกจาก built UI โดยตรง โดยไม่ส่งข้อความต้นฉบับสังเคราะห์ให้ AI; Prompt fixture นี้เลือก Council แต่เสียงกล่าวถึง committee จึงมีข้อจำกัดเรื่อง profile ที่ขัดกันด้วย
- ผลตอบให้ข้อความตรงกับเสียงซึ่งไม่ได้อยู่ใน Prompt แต่ระบุผิดว่าไม่มีไฟล์เสียงและเป็นข้อความผู้ใช้; มี metadata PARTIAL/UNVERIFIED และหัวข้อคะแนนไม่มีหลักฐานในฉบับสะอาด
- ส่งคำขอ review แก้ตาม contract เดิม: ผลตอบอ้างว่าอ่านเสียงแล้ว แต่แบ่งผู้พูด 1/2/3 จากเสียงเดียวโดยไม่มีหลักฐาน จึงยัง FAIL No Fabrication/Speaker Segmentation; ไม่ยกระดับผลหลังช่วย review เป็น first-pass PASS
- ไม่ถือว่าการอ่านเนื้อหาเสียงสำเร็จเพียงอย่างเดียวคือ TEST 4 ผ่าน และไม่เพิ่ม backend/API/storage เพื่อแก้ข้อจำกัด model ภายนอก
- Source/UI regression เดิมยัง PASS; `git diff baseline --check` PASS. รอบนี้เพิ่มเฉพาะรายงาน/หลักฐาน และภาพหน้าจอ ไม่ Deploy
- สถานะก่อนรอบแก้ล่าสุด: **READY WITH CONDITIONS สำหรับ source/text workflow; ยังไม่พร้อม audio pilot บน Qwen demo นี้**. ต้องตรวจ runtime ที่จะใช้จริงจนผ่านก่อนใช้งานเสียง

## 10. Source closure after actual audio failure

- Pre-flight: HEAD `c311175`, branch เดิม; tracked files สะอาด, node_modules symlink เดิม; baseline diff บันทึกก่อนแก้ ไม่ทับงานผู้ใช้
- แก้เพิ่ม 3 ไฟล์เดิม: runtime contract (ที่มาของ transcript, ไม่แยกผู้พูดจากเรื่องที่บรรยาย, ตรวจ metadata/คะแนนในฉบับสะอาด), meeting unit assertions และ TEST 4 UI fixture ให้กล่าวถึงไฟล์ที่แนบปัจจุบัน
- Regression `npm test` PASS 696/696, meeting suite PASS 15/15, syntax และ local build PASS, browser TEST 1–8/two menus/export/privacy PASS; logs `audio-final-*` และ prompts `meeting-audio-final/TEST-1..8.txt`
- ทดสอบ WAV สภาภาษาอังกฤษคนเดียวใหม่ 19.99 วินาที ไม่มี source transcript ส่งให้ AI; ทำให้เสียงกับ Council profile ตรงกันโดยไม่ระบุว่าเป็นสภา อบจ./เทศบาล/อบต.
- Qwen Offline ปกติยัง FAIL: คงข้อความเสียงตรงกับ fixture แต่ระบุที่มาผิด, เพิ่มคำว่าเทศบาลโดยไม่มีหลักฐาน, ใส่ metadata/หัวข้อคะแนนในฉบับสะอาด แม้ contract ห้ามไว้; ไม่สร้างผู้พูด 2/3 ในรอบนี้
- ตรวจ diff ของ Router หลัก/governance/Official Search/Privacy Guard/access-system/package/backend กับ baseline แล้วไม่มีการเปลี่ยน
- ไม่เพิ่ม STT/API/audio storage หรือแก้หลักการตรวจ capability เพื่อให้ผลทดสอบผ่าน; การทดสอบ audio model ไม่ใช่การตรวจ build/UI เท่านั้น

- ทดสอบซ้ำแบบ first pass ใน Qwen Thinking ด้วยไฟล์เสียงและ Prompt เดิม หลัง clear บทสนทนา: FAIL — อ้างข้อความเสียงเป็นข้อความผู้ใช้, เติมครั้งที่ 1, metadata UNVERIFIED ในฉบับสะอาด และกล่าวว่าไม่มีการลงคะแนน ทั้งที่ต้นฉบับเพียงไม่ประกาศจำนวนเสียง
- เก็บคำตอบสุดท้ายเท่านั้น ไม่เก็บ reasoning ภายในของ Thinking ลงหลักฐาน; รูปหลักฐานล่าสุดแสดงเลขครั้งที่เติมโดยไม่มีข้อมูลต้นฉบับ
- TEST 1/2/3/5/6/7/8 คำตอบจริงเดิมเป็นผลจากก่อนเพิ่ม audio provenance/speaker/clean checks; ไม่อ้างว่าได้รันคำตอบข้อความทั้งหมดใหม่. รอบปัจจุบันตรวจ runtime/UI/Prompt ทั้ง 8 กรณีครบ และรันคำตอบเสียง TEST 4 ใหม่สองโหมดจริง
- ไม่มี source formatter/validator ที่ควบคุมคำตอบใน AI ภายนอก จึงรับประกันว่าปลายทางทุกตัวทำตาม Prompt ไม่ได้. ไม่เพิ่ม backend/STT/API/storage เพื่อแก้ปัญหานี้ และไม่ลด gate ให้ถือว่าอ่านเสียงได้จากชื่อไฟล์
- Post-flight: JSON evidence valid, git diff --check PASS, application diff เฉพาะ 3 ไฟล์ที่ระบุ; รายงาน/evidence/screenshot อัปเดต. ไม่ push ไม่ Deploy ไม่เปลี่ยน Production URL
- สถานะประเมินก่อนแยกขอบเขตความรับผิดชอบ: NOT READY สำหรับ audio pilot บน runtime ที่ทดลอง. ผลทดสอบจริงนี้คงไว้ แต่ไม่ใช้แทนสถานะฟังก์ชันสร้างคำสั่งของ GovPrompt ตามข้อสรุปส่วน 11

## 11. Final closure — GovPrompt and downstream responsibilities

- ปรับข้อสรุปตามคำชี้แจงผู้ใช้วันที่ 4 ตุลาคม 2569: GovPrompt สร้างคำสั่ง; ผู้ใช้แนบไฟล์เสียงกับ AI ปลายทางเอง. การอ่าน/ถอดเสียงและคำตอบปลายทางไม่ใช่ execution ภายใน GovPrompt
- **READY WITH CONDITIONS** สำหรับการนำร่องฟังก์ชันสร้างคำสั่ง: Profile/เมนูเดิมสองตำแหน่ง, main-chat intake, Prompt ฉบับเต็ม, audio capability/fallback, No Fabrication, สองชั้นหลักฐาน/ฉบับสะอาด, Human Review และ legal follow-up gates ผ่าน source/UI/regression ที่ตรวจแล้ว
- ผล TEST 4 บน Qwen ปกติและ Thinking ยังคง **FAIL** ทุกข้อที่บันทึก; ไม่เปลี่ยนผลเสียงจริงเป็น PASS ไม่รับรองว่าปลายทางทุกตัวทำตาม Prompt และไม่กล่าวว่า TEST 1–8 คำตอบ AI ผ่านทั้งหมด
- เงื่อนไขการใช้งาน: แนบไฟล์ตรงกับ AI ที่อ่านไฟล์นั้นได้จริง; หากอ่านไม่ได้ใช้ transcript/text; ตรวจข้อมูล/ผู้พูด/มติ/คะแนนกับต้นฉบับก่อนรับรอง; ถามความชอบด้วยกฎหมายแยกผ่าน Gate เดิม
- Pre-flight รอบปิดรายงาน: branch เดิม HEAD ed06b39, tracked files สะอาด มี node_modules symlink เดิมเท่านั้น. รอบนี้แก้เฉพาะรายงานและ evidence metadata ไม่แก้ source หรือผลตอบที่เก็บไว้
- ชุดตรวจ source ล่าสุด: regression 696/696, meeting 15/15, UI TEST 1–8/two menus/export/privacy, syntax และ local build PASS. ไม่มีการรัน tests ซ้ำสำหรับการเปลี่ยนข้อความสรุปรายงานเท่านั้น; ตรวจ JSON และ git diff --check อีกครั้ง
- งาน source + tests ในขอบเขตที่อนุญาต **ปิดงานแล้ว**. ไม่ Deploy production ตามข้อห้ามเดิม ไม่เปลี่ยน Production URL ไม่เพิ่มเมนู/STT/API/audio storage/schema/auth และไม่แก้ Official Precedent Gate v3.1 / Decision Lock หลัก

## 12. Production release authorization and pre-flight

- วันที่ 4 ตุลาคม 2569 เวลา 14.51 น. ผู้ใช้สั่ง “ทำให้เสร็จ” หลังยืนยันว่าต้องนำขึ้นเว็บไซต์ จึงอนุญาตการเผยแพร่เว็บเดิมในรอบนี้; ข้อความไม่ Deploy ในส่วนก่อนหน้าเป็นประวัติ source-only รอบเดิม
- ตรวจ main ผ่าน GitHub connector: af5274185fd2909b0d4637e9507ff6cd9ee33aa1 ตรง baseline งานนี้; git mirror แสดง be0679c เก่ากว่า จึงยึด ref จริงจาก GitHub และไม่ force push
- ใช้ workflow GitHub Pages เดิม main-only ไม่มีการเปลี่ยน deployment architecture/backend/URL
- ปรับเฉพาะ cache stamps: home 6.4.23, quick action bridge 1.3.17, status copy 1.4.5, service worker 3.6.11, runtime import query 5.7.3; synchronize build/production verifiers และ iOS copy release assertion; ไม่เปลี่ยน logic service worker
- Full regression หลัง stamps 696/696 PASS, syntax/security/local build PASS, built UI TEST 1–8/menus/export/privacy PASS, git diff --check PASS
- ผล Qwen TEST 4 FAIL ยังคงไว้ตามจริง; release นี้เผยแพร่ความสามารถสร้างคำสั่ง ไม่ใช่รับรองการถอดเสียงของทุก AI ภายนอก
