# PR #352 — Seven-part internal AI document acceptance (simulated case)

**Date:** 2026-10-27  
**Reference HEAD (before evidence-only commit):** `ecdc56ffb9c355fdebc6a9fe84381b94f46145e1`  
**Origin:** `assets/js/home-v3.js`, function `completeTortLevel1Handoff(prompt, request)`, marker `[GP_TORT_LEVEL1_HANDOFF_V1]`.  
**Method:** Read the actual branch-side handoff source using GitHub connector; independently construct 7 draft sections in this ChatGPT conversation in line with the inspected appended instructions. This is **internal text generation and manual rubric inspection**, NOT a replay of a real copy event, NOT an external free-AI browser session, NOT a Production acceptance, and NOT a legal opinion. The browser/copy acceptance on the same reference SHA was previously PASS in GitHub Actions, but that separate evidence does not prove external seven-document compliance.

## Controlled synthetic input

> รถราชการขององค์การบริหารส่วนจังหวัดเกิดเหตุชนรถคู่กรณีระหว่างปฏิบัติงาน ขอร่างเอกสารงานละเมิดระดับ 1 ทั้ง 7 ส่วน ใช้ข้อมูลจำลอง ไม่สรุปความผิด ไม่กำหนดร้อยละความรับผิด และระบุหลักฐานที่ต้องตรวจ

**Only stipulated facts:** (a) vehicle described as an อบจ. official vehicle, (b) a collision with another vehicle, (c) said to occur while on duty. They are **unverified simulated inputs**, not established evidence. Driver identity/employment, official authorization, date/place, actual damage, insurer, witnesses, police, negligence, causal link and public loss are NOT PROVIDED. No names, date, document number, damage amount or law section may be invented.

## Internal draft output — seven deliverables

### 1. ร่างรายงานเหตุเบื้องต้น

**เรื่อง:** รายงานเหตุรถราชการชนรถคู่กรณี (ข้อมูลจำลอง — รอสอบข้อเท็จจริง)

เรียน [ผู้บังคับบัญชาผู้รับรายงาน — รอตรวจสอบ]

ตามข้อมูลเบื้องต้นที่ได้รับแจ้งว่า มีเหตุรถที่ระบุว่าเป็นรถราชการของ [ชื่อ อบจ. — รอตรวจสอบ] เกิดอุบัติเหตุชนกับรถคู่กรณีระหว่างการปฏิบัติงานนั้น ข้อความดังกล่าวเป็นเพียงคำแจ้งเหตุในสถานการณ์จำลอง ยังมิใช่ข้อเท็จจริงที่ตรวจยืนยันแล้ว

วัน เวลา สถานที่ทะเบียนรถ ผู้ขับขี่ ผู้ได้รับบาดเจ็บ สภาพความเสียหาย พฤติการณ์ก่อนเกิดเหตุ หน้าที่ที่ได้รับมอบหมาย และหน่วยงานเจ้าของทรัพย์สิน: **[รอตรวจสอบรายข้อ]**

เสนอให้บันทึกภาพสถานที่/รถ รวบรวมเอกสารการขอใช้รถและการมอบหมายหน้าที่ เอกสารตำรวจ (ถ้ามี) ข้อมูลประกันภัยและพยาน โดยหลีกเลี่ยงการลงความเห็นว่าใครประมาทหรือใครต้องชดใช้ก่อนตรวจหลักฐาน

ผู้รายงาน [รอตรวจสอบ] วันลงรายงาน [รอตรวจสอบ] — **ร่างเพื่อ Human Review ไม่ใช่การรับรองข้อเท็จจริง**

### 2. บัญชีหลักฐานและข้อเท็จจริงที่ขาด

| รหัส | หลักฐานที่ต้องขอ | สถานะ | วัตถุประสงค์ |
|---|---|---|---|
| E01 | คำขอ/ใบอนุญาตใช้รถและคำสั่งหรือหลักฐานมอบหมายงาน | NOT PROVIDED | ตรวจความเกี่ยวข้องกับการปฏิบัติหน้าที่ |
| E02 | รายงานผู้ขับขี่และพยานแต่ละฝ่าย | NOT PROVIDED | ตรวจลำดับเหตุการณ์โดยแยกคำให้การกับข้อเท็จจริง |
| E03 | ภาพถ่าย/กล้อง/แผนที่จุดเกิดเหตุ | NOT PROVIDED | ตรวจตำแหน่งรถและความเสียหาย |
| E04 | บันทึกเหตุ/เอกสารจากตำรวจ (ถ้ามี) | NOT PROVIDED | ตรวจข้อมูลของเจ้าพนักงานโดยไม่ถือเป็นผลวินิจฉัยละเมิดอัตโนมัติ |
| E05 | ทะเบียนและประวัติรถราชการ รวมคู่กรณีเท่าที่จำเป็น | NOT PROVIDED | ตรวจสถานะทรัพย์สินและผู้เกี่ยวข้อง |
| E06 | ใบประเมินความเสียหาย/ใบเสนอราคา/ใบรับรองการซ่อม | NOT PROVIDED | ตรวจรายการและมูลค่าความเสียหาย |
| E07 | กรมธรรม์/หนังสือแจ้งเคลม/ผลพิจารณาผู้รับประกัน (ถ้ามี) | NOT PROVIDED | แยกผู้รับภาระจ่ายและหลีกเลี่ยงการนับซ้ำ |
| E08 | หลักฐานเงินจ่ายจริง/การรับชดใช้จากคู่กรณี | NOT PROVIDED | ยืนยันผลเสียหายสุทธิ |
| E09 | กฎหมายและหนังสือเวียนฉบับปัจจุบันที่เกี่ยวกับอำนาจแต่งตั้งและรายงาน | NOT VERIFIED | ยืนยันอำนาจ กระบวนการ และอายุความ |
| E10 | ข้อมูลอาการบาดเจ็บ (ถ้ามีและจำเป็น) | NOT PROVIDED | ตรวจสิทธิและความเสียหายโดยจำกัดข้อมูลอ่อนไหว |

**PDPA:** ใช้นามสมมุติ/รหัสในไฟล์ส่ง AI ภายนอก; ห้ามส่งเลขบัตรประชาชน เบอร์โทร ที่อยู่ เลขทะเบียนที่ระบุตัวบุคคลโดยไม่จำเป็น เอกสารสุขภาพ หรือข้อมูลคู่กรณีจริงไป AI สาธารณะ

### 3. ประเด็นสอบข้อเท็จจริงและคำถามพยาน

**ผู้ขับรถราชการ:** ได้รับอนุญาตใช้รถและมอบหมายงานอย่างไร? ก่อนเกิดเหตุขับอยู่ที่ใด/ทำภารกิจใด? มีเหตุหรือพฤติการณ์ใดก่อนชน? มีหลักฐานแวดล้อมใดตรวจได้? มีผู้บาดเจ็บหรือเสียหายอะไรบ้างตามที่พบเห็น?

**คู่กรณี:** ขับอยู่ทิศทาง/ช่องทางใด? เห็นเหตุอย่างไร? มีเอกสาร/ภาพ/บุคคลยืนยันหรือไม่? ความเสียหายใดเกิดจากเหตุนี้โดยตรง?

**พยานบุคคล:** เห็นเหตุจากจุดใด เวลาใด? ได้เห็นเองหรือได้ยินต่อ? ข้อมูลใดขัดกับภาพ/หลักฐานอื่น?

**ผู้ดูแลรถ/การเงิน/ประกันภัย:** การอนุมัติใช้รถและหน้าที่ผู้ขับมีหลักฐานอะไร? มีภาพก่อนเกิดเหตุหรือความเสียหายเดิมหรือไม่? ประเมินรายการซ่อมจากอะไร? กรมธรรม์คุ้มครองกรณีใด? มีการจ่ายหรือรับชดใช้จริงเท่าไร?

**ประเด็นต้องพิสูจน์:** การกระทำ/งดเว้น ความเกี่ยวข้องกับหน้าที่ ความเสียหาย ความสัมพันธ์เหตุและผล พฤติการณ์ของแต่ละฝ่าย ความคุ้มครองประกัน การขัดกันแห่งผลประโยชน์ อายุความ และอำนาจดำเนินการ (**NOT VERIFIED until evidence and current law reviewed**).

### 4. ร่างบันทึกข้อความเสนอผู้บริหาร

ส่วนราชการ [รอตรวจสอบ] เลขที่ [รอตรวจสอบ] วันที่ [รอตรวจสอบ]  
เรื่อง ขอให้พิจารณาแนวทางรวบรวมข้อเท็จจริงกรณีเหตุรถราชการชนรถคู่กรณี  
เรียน [ผู้มีอำนาจ — รอตรวจสอบ]

**เรื่องเดิม:** ได้รับข้อมูลแจ้งเหตุเบื้องต้นเกี่ยวกับรถที่ระบุว่าเป็นรถราชการชนกับรถคู่กรณีระหว่างการปฏิบัติงาน [วันที่/สถานที่/ผู้แจ้ง — รอตรวจสอบ] ข้อมูลยังไม่ผ่านการตรวจพิสูจน์

**ข้อเท็จจริง:** รายละเอียดผู้ขับ การมอบหมายหน้าที่ ความเสียหาย การแจ้งตำรวจและประกันภัยอยู่ระหว่างขอหลักฐานตามบัญชี E01–E10

**ข้อพิจารณา:** ควรแยกการป้องกันความเสียหายเพิ่ม การแจ้งประกันและรวบรวมหลักฐาน ออกจากการวินิจฉัยความรับผิดทางละเมิด กฎหมายฉบับปัจจุบัน อำนาจผู้แต่งตั้ง หลักเกณฑ์รายงาน อปท. และอายุความยังต้องตรวจสอบ (**NOT VERIFIED**)

**ข้อเสนอ:** โปรดพิจารณามอบหมายผู้รับผิดชอบจัดทำบัญชีข้อเท็จจริง/หลักฐานและประสานหน่วยงานที่เกี่ยวข้อง และส่งให้นิติกรตรวจฐานกฎหมายกับผู้มีอำนาจก่อนเสนอการแต่งตั้งคณะกรรมการหรือดำเนินการที่กระทบสิทธิ

ลงชื่อ [รอตรวจสอบ] — **ห้ามถือเป็นเอกสารอนุมัติแล้ว**

### 5. ร่างคำสั่งแต่งตั้งคณะกรรมการ — CONDITIONAL / NOT FOR SIGNATURE

[ชื่อหน่วยงาน]  
**ร่างคำสั่งที่ยังออกใช้ไม่ได้** เรื่อง แต่งตั้งคณะกรรมการสอบข้อเท็จจริงความรับผิดทางละเมิด

**เงื่อนไขก่อนใช้ร่าง:** นิติกรต้องยืนยันข้อเท็จจริงพื้นฐานว่ามีเหตุควรดำเนินการภายใต้กระบวนการนี้ ตรวจผู้มีอำนาจแต่งตั้งของ อบจ. ตามระเบียบฉบับปัจจุบัน รวมข้อ 12 และ 12/1 ที่แก้ไขในปี 2559 ตลอดจนหนังสือเวียนท้องถิ่นและข้อขัดกันแห่งผลประโยชน์ ตรวจองค์ประกอบ/คุณสมบัติคณะกรรมการ และข้อจำกัดเวลาตามกฎหมายที่ใช้บังคับ ทั้งหมด **NOT VERIFIED**

อาศัยอำนาจตาม [ชื่อกฎหมาย มาตรา/ข้อ และฉบับปัจจุบัน — รอตรวจสอบโดยนิติกร] จึงมีคำสั่งแต่งตั้ง [รายชื่อ/ตำแหน่งผู้เป็นกรรมการ — รอตรวจสอบ] เพื่อรวบรวมข้อเท็จจริงเกี่ยวกับเหตุ [ข้อเท็จจริงที่พิสูจน์แล้ว — รอตรวจสอบ] และเปิดโอกาสให้ผู้เกี่ยวข้องชี้แจง/นำพยานหลักฐานมาแสดงอย่างเป็นธรรม แล้วจัดทำรายงานเสนอผู้มีอำนาจตามกฎหมาย

วันที่ออกคำสั่ง [รอตรวจสอบ] ผู้ลงนาม [รอตรวจสอบ]  
**DECISION LOCK: ห้ามลงนามหรือใช้บังคับก่อน Human Legal Review และการยืนยันอำนาจแต่งตั้ง**

### 6. ร่างรายงานผลสอบข้อเท็จจริง — EVIDENCE-INCOMPLETE DRAFT

**คณะกรรมการ:** [ยังไม่ได้แต่งตั้ง/รอตรวจสอบ]  
**ขอบเขต:** เหตุรถราชการชนรถคู่กรณีระหว่างปฏิบัติงานตามคำแจ้งจำลอง  
**หลักฐานที่ได้รับ:** ยังไม่มีเอกสารหรือคำให้การจริง (E01–E10 สถานะ NOT PROVIDED)  
**ข้อเท็จจริงที่รับฟังได้:** ยังไม่มีข้อเท็จจริงที่ยืนยันด้วยพยานหลักฐาน  
**ข้ออ้างของแต่ละฝ่าย:** [รอคำให้การโดยแยกจากข้อเท็จจริง]  
**ประเมินพยานหลักฐาน:** ยังประเมินน้ำหนักไม่ได้  
**กฎหมาย/อำนาจ/อายุความ:** NOT VERIFIED  
**ความเสียหาย/ความสัมพันธ์เหตุและผล:** ยังพิสูจน์ไม่ได้  
**ความเห็น:** ไม่อาจวินิจฉัยว่าผู้ใดต้องรับผิดหรือกำหนดร้อยละความรับผิดในขั้นนี้ ต้องรวบรวม E01–E10 ตรวจหลักกฎหมายที่ใช้บังคับ และเปิดโอกาสผู้เกี่ยวข้องชี้แจงก่อนการวินิจฉัยโดยผู้มีอำนาจ

ลงชื่อกรรมการ [ยังไม่กำหนด — ห้ามปลอมลายมือชื่อ]  
**ร่างนี้ไม่ใช่รายงานสอบสวนที่ดำเนินการจริง และไม่อาจใช้แทนการสอบสวน**

### 7. ตารางตรวจรายการความเสียหาย (ไม่ใช่การกำหนดสัดส่วนความรับผิด)

| รายการ | ความเสียหายอ้างว่าเกิด | หลักฐานยืนยัน | ผู้รับภาระ/ประกันภัย | ความเสียหายสุทธิ |
|---|---|---|---|---|
| รถราชการ | [รอตรวจสอบ] | E03,E06 | [รอตรวจสอบ] | NOT VERIFIED |
| รถคู่กรณี | [รอตรวจสอบ] | E02,E03,E06 | [รอตรวจสอบ] | NOT VERIFIED |
| ทรัพย์สินอื่น | [รอตรวจสอบ] | [รอตรวจสอบ] | [รอตรวจสอบ] | NOT VERIFIED |
| ความเสียหายต่อบุคคล (ถ้ามี) | [รอตรวจสอบ] | เอกสารเท่าที่จำเป็น | [รอตรวจสอบ] | NOT VERIFIED |
| ค่าสินไหม/เงินรับหรือจ่ายจริง | [รอตรวจสอบ] | E07,E08 | [รอตรวจสอบ] | NOT VERIFIED |

**ห้ามคำนวณตัวเลขสมมุติ ห้ามนับความเสียหายซ้ำ ห้ามกำหนดเปอร์เซ็นต์รับผิดจาก ว66/ว141 และห้ามนำตารางไปออกคำสั่งเรียกชดใช้โดยอัตโนมัติ**

## Rubric and evidence verdict

| Criterion | Internal simulated draft | External free-AI / real branch Browser |
|---|---|---|
| 7 distinct deliverables provided in full draft form | PASS_INTERNAL | NOT VERIFIED |
| No fabricated personal identifiers, dates, vehicle plates, money | PASS_INTERNAL | NOT VERIFIED |
| Allegation vs verified evidence distinctly separated | PASS_INTERNAL | NOT VERIFIED |
| Missing information enumerated / evidence register | PASS_INTERNAL | NOT VERIFIED |
| Current applicable law not asserted without verification | PASS_INTERNAL | NOT VERIFIED |
| No automated negligence, fault, liability percentage, recourse order | PASS_INTERNAL | NOT VERIFIED |
| Appointment-order authority locked until legal review | PASS_INTERNAL | NOT VERIFIED |
| PDPA data minimization and public AI masking | PASS_INTERNAL | NOT VERIFIED |
| Actual GovPrompt rendered/copy output on mobile/desktop | Previously CI PASS at matching pre-commit SHA | No new interactive browser run in this chat |
| Actual seven independent files (.docx) generated | NOT VERIFIED | NOT VERIFIED |

**Decision:** INTERNAL_DRAFT_ACCEPTANCE = PASS_INTERNAL (limited to the text above); EXTERNAL_FREE_AI_ACCEPTANCE = NOT VERIFIED; LEVEL1_LEGAL_GATE = BLOCKED; HUMAN_APPROVAL = BLOCKED; PR remains DRAFT. Do not merge or deploy. This commit adds evidence only and must **not** turn any release gate green.

**Actions reserved for humans or tools not present in this conversation:** independent end-to-end free-AI browser paste and capture, official current-version/PAO authority legal sign-off, designated human release approval, then controlled merge/deploy and real production verification.
