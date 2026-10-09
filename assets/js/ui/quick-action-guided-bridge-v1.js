(() => {
  'use strict';

  const form = document.getElementById('chatForm');
  const input = document.getElementById('promptInput');
  const quickActions = document.querySelector('.quick-actions');
  const dialog = document.getElementById('appDialog');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogEyebrow = document.getElementById('dialogEyebrow');
  const dialogContent = document.getElementById('dialogContent');
  if (!form || !input || !quickActions) return;

  const CATEGORY_ICONS = Object.freeze({
    assistance: '🚨',
    pr: '📣',
    records: '📄',
    audit: '⚖️',
    finance: '💰',
    planning: '📊',
    procurement: '🛒',
    hr: '👥',
    executive: '👔',
    engineering: '🏗️',
    health: '🩺',
    education: '🎓',
    council: '🏛️'
  });

  const CATALOG_ORDER = Object.freeze([
    'pr', 'records', 'audit', 'finance', 'planning', 'procurement',
    'hr', 'executive', 'engineering', 'health', 'education', 'council'
  ]);

  const WORK_CATALOG = Object.freeze([
  Object.freeze({
      id: 'assistance', title: 'ช่วยเหลือประชาชนและสาธารณภัย', keywords: 'ช่วยเหลือประชาชน ผู้ประสบภัย ภัยพิบัติ สาธารณภัย น้ำท่วม น้ำป่า ดินถล่ม วาตภัย อัคคีภัย ภัยแล้ง ถุงยังชีพ เงินทดรองราชการ',
      tasks: Object.freeze([
        Object.freeze({ label: 'ตรวจว่าช่วยเหลือได้หรือไม่', prompt: 'ตรวจว่ากรณีนี้สามารถช่วยเหลือประชาชนได้หรือไม่ พร้อมฐานอำนาจ เงื่อนไข ข้อเท็จจริงที่ต้องตรวจ และความเสี่ยง' }),
        Object.freeze({ label: 'ตรวจสิทธิ / อัตรา / วงเงิน', prompt: 'ตรวจสิทธิ เงื่อนไข อัตรา และวงเงินการช่วยเหลือกรณีนี้ โดยตรวจหลักเกณฑ์ที่ใช้บังคับ ณ วันที่เกิดเหตุจากแหล่งทางการ และห้ามสรุปสิทธิจากตัวเลขเพียงอย่างเดียว' }),
        Object.freeze({ label: 'ตรวจกรณีภัยพิบัติ', prompt: 'ตรวจกรณีภัยพิบัติหรือสาธารณภัยว่าต้องใช้ฐานกฎหมายใด เงื่อนไขใด เอกสารใด และต้องดำเนินการอย่างไร' }),
        Object.freeze({ label: 'ทำ Checklist เจ้าหน้าที่', prompt: 'ทำ Checklist เจ้าหน้าที่สำหรับการช่วยเหลือประชาชนหรือผู้ประสบภัย ตั้งแต่รับเรื่อง ตรวจข้อเท็จจริง ตรวจหลักฐาน เสนออนุมัติ จ่ายเงิน และจัดเก็บหลักฐานตรวจสอบ' }),
        Object.freeze({ label: 'ทำบันทึกเสนอผู้บริหาร', prompt: 'ทำบันทึกเสนอผู้บริหารเรื่องการช่วยเหลือประชาชน โดยแยกข้อเท็จจริง ฐานอำนาจ เงื่อนไข งบประมาณ ความเสี่ยง และข้อเสนอเพื่อพิจารณา' }),
        Object.freeze({ label: 'ตรวจความเสี่ยงก่อนจ่าย', prompt: 'ตรวจความเสี่ยงก่อนจ่ายเงินช่วยเหลือประชาชนหรือผู้ประสบภัย รวมถึงอำนาจ เงื่อนไข การช่วยเหลือซ้ำซ้อน หลักฐาน แหล่งเงิน และ Audit Trail' })
      ])
    }),
    Object.freeze({
      id: 'executive', title: 'บริหารและผู้บริหาร', keywords: 'บริหาร ผู้บริหาร ปลัด นายก ประชุม ตัดสินใจ',
      tasks: Object.freeze([
        Object.freeze({ label: 'สรุปเรื่องเสนอผู้บริหาร', prompt: 'สรุปเรื่องนี้เสนอผู้บริหารแบบกระชับ พร้อมประเด็นตัดสินใจและความเสี่ยง' }),
        Object.freeze({ label: 'เตรียมประเด็นประชุม', prompt: 'ช่วยเตรียมประเด็นประชุม วาระสำคัญ ข้อมูลที่ต้องมี และข้อเสนอเพื่อการตัดสินใจ' }),
        Object.freeze({ label: 'วิเคราะห์ทางเลือกเพื่อการตัดสินใจ', prompt: 'ช่วยวิเคราะห์ทางเลือก ข้อดี ข้อเสีย ความเสี่ยง และข้อเสนอแนะเพื่อการตัดสินใจของผู้บริหาร' }),
        Object.freeze({ label: 'ร่างคำกล่าว / สคริปต์ผู้บริหาร', prompt: 'ช่วยร่างคำกล่าวหรือสคริปต์สำหรับผู้บริหารให้เหมาะกับงานราชการ' })
      ])
    }),
    Object.freeze({
      id: 'records', title: 'สารบรรณและหนังสือราชการ', keywords: 'สารบรรณ หนังสือ บันทึก คำสั่ง รายงานประชุม หนังสือภายนอก หนังสือภายใน หารือ',
      tasks: Object.freeze([
        Object.freeze({ label: 'ร่างหนังสือราชการ', prompt: 'ร่างหนังสือราชการ' }),
        Object.freeze({ label: 'ร่างบันทึกข้อความ', prompt: 'ร่างบันทึกข้อความ' }),
        Object.freeze({ label: 'ร่างหนังสือหารือ', prompt: 'ร่างหนังสือหารือ' }),
        Object.freeze({ label: 'ร่างคำสั่ง', prompt: 'ช่วยร่างคำสั่งราชการ โดยถามข้อมูลสำคัญที่ยังขาดก่อน' }),
        Object.freeze({ label: '📝 ทำรายงานการประชุม', prompt: 'ทำรายงานการประชุมทั่วไป' }),
        Object.freeze({ label: 'จัดหน้าเอกสาร', prompt: 'ช่วยจัดหน้าเอกสารที่แนบให้อ่านง่ายและเป็นทางการ โดยรักษาข้อเท็จจริง ชื่อ ตัวเลข วันที่ และสาระเดิมไว้' }),
        Object.freeze({ label: '🗃️ ตรวจสอบการทำลายเอกสาร', prompt: 'ตรวจสอบการทำลายเอกสารราชการ โดยแยกประเภทเอกสาร หน่วยงานเจ้าของเอกสาร ช่วงเวลา/วันที่ เอกสารทางการเงิน คดีหรือการตรวจสอบ ความลับ/ข้อมูลส่วนบุคคล ความจำเป็นในการใช้งาน กฎหรือบัญชีอายุการเก็บรักษาที่ใช้บังคับ และขั้นตอน/ผู้มีอำนาจก่อนสรุป โดยห้ามสรุปว่าสามารถทำลายได้จากอายุเอกสารเพียงอย่างเดียว และห้ามใช้ระยะเวลา 10 ปี 5 ปี 1 ปี หรือค่าคงที่ใดเป็นกฎหมายโดยไม่ตรวจแหล่งทางการ' }),

      ])
    }),
    Object.freeze({
      id: 'planning', title: 'แผน โครงการ และงบประมาณ', keywords: 'แผน โครงการ งบประมาณ ข้อบัญญัติ KPI ตัวชี้วัด ประเมินผล',
      tasks: Object.freeze([
        Object.freeze({ label: 'ทำโครงการ', prompt: 'ทำโครงการ' }),
        Object.freeze({ label: 'จัดทำแผนงาน / แผนปฏิบัติการ', prompt: 'ช่วยจัดทำแผนงานหรือแผนปฏิบัติการ พร้อมกิจกรรม ระยะเวลา ผู้รับผิดชอบ และตัวชี้วัด' }),
        Object.freeze({ label: 'ร่างงบประมาณ', prompt: 'ร่างงบประมาณ' }),
        Object.freeze({ label: 'กำหนด KPI / ตัวชี้วัด', prompt: 'ช่วยกำหนด KPI และตัวชี้วัดโครงการให้วัดผลได้จริง' }),
        Object.freeze({ label: 'ประเมินผลโครงการ', prompt: 'ช่วยออกแบบเกณฑ์และวิธีประเมินผลโครงการ พร้อมตัวชี้วัดผลผลิตและผลลัพธ์' })
      ])
    }),
    Object.freeze({
      id: 'procurement', title: 'พัสดุและจัดซื้อจัดจ้าง', keywords: 'พัสดุ TOR ราคากลาง จัดซื้อ จัดจ้าง e-bidding เฉพาะเจาะจง ตรวจรับ ล็อกสเปก ฮั้ว',
      tasks: Object.freeze([
        Object.freeze({ label: 'ร่าง TOR / ขอบเขตงาน', prompt: 'ร่าง TOR' }),
        Object.freeze({ label: 'เลือกวิธีจัดซื้อจัดจ้าง', prompt: 'ช่วยตรวจวิธีจัดซื้อจัดจ้างที่เหมาะสม พร้อมเงื่อนไข ขั้นตอน และความเสี่ยง' }),
        Object.freeze({ label: 'ตรวจราคากลาง / สำรวจราคา', prompt: 'ช่วยวางแนวทางตรวจราคากลางและสำรวจราคาตลาด โดยระบุข้อมูลและหลักฐานที่ต้องใช้' }),
        Object.freeze({ label: 'ตรวจความเสี่ยงล็อกสเปก / การแข่งขัน', prompt: 'ช่วยตรวจ TOR หรือเงื่อนไขจัดซื้อจัดจ้างว่ามีความเสี่ยงล็อกสเปก จำกัดการแข่งขัน หรือฮั้วหรือไม่' }),
        Object.freeze({ label: 'เตรียมเกณฑ์ตรวจรับ', prompt: 'ช่วยจัดทำเกณฑ์ตรวจรับงานหรือพัสดุให้ชัดเจน วัดผลได้ และสอดคล้องกับ TOR' }),
        Object.freeze({ label: '👤 ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา', prompt: 'ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา' })
      ])
    }),
    Object.freeze({
      id: 'finance', title: 'การเงิน การคลัง และเบิกจ่าย', keywords: 'การเงิน คลัง เบิกจ่าย ค่าใช้จ่าย เดินทาง ที่พัก รถ ค่าอาหาร เงินบำรุง',
      tasks: Object.freeze([
        Object.freeze({ label: 'ตรวจว่าเบิกได้หรือไม่', prompt: 'เบิกจ่าย' }),
        Object.freeze({ label: 'ค่าเดินทางไปราชการ', prompt: 'ช่วยตรวจสิทธิและหลักเกณฑ์ค่าเดินทางไปราชการ โดยถามข้อมูลที่มีผลต่อสิทธิก่อน' }),
        Object.freeze({ label: 'ค่าที่พัก / ค่าเช่าที่พัก', prompt: 'ช่วยตรวจสิทธิและอัตราค่าที่พักที่เบิกได้ โดยถามตำแหน่ง สถานะ และข้อเท็จจริงที่จำเป็นก่อน' }),
        Object.freeze({ label: 'ตรวจค่าใช้จ่ายโครงการ', prompt: 'ช่วยตรวจรายการค่าใช้จ่ายของโครงการว่าเบิกได้หรือไม่ ต้องใช้เงินประเภทใด และต้องมีหลักฐานอะไร' }),
        Object.freeze({ label: 'ตรวจหลักฐานประกอบการเบิก', prompt: 'ช่วยทำ checklist หลักฐานประกอบการเบิกจ่ายสำหรับรายการนี้' })
      ])
    }),
    Object.freeze({
      id: 'hr', title: 'งานบุคคล', keywords: 'บุคคล HR บรรจุ แต่งตั้ง เลื่อนขั้น โบนัส โอนย้าย แผนอัตรากำลัง วินัย',
      tasks: Object.freeze([
        Object.freeze({ label: 'ทำแผนอัตรากำลัง', prompt: 'ช่วยจัดทำแผนอัตรากำลัง โดยถามข้อมูลโครงสร้าง ภารกิจ กรอบเดิม และกำลังคนที่จำเป็นก่อน' }),
        Object.freeze({ label: 'บรรจุ / แต่งตั้ง', prompt: 'ช่วยวิเคราะห์และจัดทำงานเกี่ยวกับการบรรจุหรือแต่งตั้ง โดยถามข้อเท็จจริงสำคัญก่อน' }),
        Object.freeze({ label: 'เลื่อนขั้น / ประเมิน / โบนัส', prompt: 'ช่วยตรวจหลักเกณฑ์และขั้นตอนเรื่องเลื่อนขั้น ประเมิน หรือโบนัสตามข้อเท็จจริงที่ให้' }),
        Object.freeze({ label: 'โอน / ย้าย / เปลี่ยนตำแหน่ง', prompt: 'ช่วยวิเคราะห์ขั้นตอนและเงื่อนไขการโอน ย้าย หรือเปลี่ยนตำแหน่ง' }),
        Object.freeze({ label: 'วินัยและการดำเนินการทางบุคคล', prompt: 'ช่วยแยกข้อเท็จจริง ประเด็น ขั้นตอน ความเสี่ยง และหลักฐานที่ต้องตรวจในเรื่องวินัยหรือการดำเนินการทางบุคคล' })
      ])
    }),
    Object.freeze({
      id: 'engineering', title: 'งานช่างและวิศวกรรม', keywords: 'ช่าง วิศวกรรม BOQ ก่อสร้าง ถนน อาคาร สะพาน ประมาณราคา ตรวจงาน แบบ',
      tasks: Object.freeze([
        Object.freeze({ label: 'ทำ BOQ เบื้องต้น', prompt: 'ช่วยจัดทำ BOQ เบื้องต้นสำหรับงานก่อสร้าง โดยถามชนิดงาน ขนาด ปริมาณ แบบ และข้อมูลราคาที่จำเป็นก่อน' }),
        Object.freeze({ label: 'TOR งานก่อสร้าง', prompt: 'ร่าง TOR งานก่อสร้าง' }),
        Object.freeze({ label: 'ประมาณราคา', prompt: 'ช่วยวางโครงประมาณราคางานก่อสร้าง พร้อมรายการข้อมูล ปริมาณ และราคาที่ต้องยืนยัน' }),
        Object.freeze({ label: 'ตรวจแบบ / ตรวจงาน / ตรวจรับ', prompt: 'ช่วยทำ checklist ตรวจแบบ ตรวจงาน และตรวจรับงานก่อสร้างตามข้อมูลโครงการ' }),
        Object.freeze({ label: 'วิเคราะห์ปัญหาถนน / อาคาร / โครงสร้าง', prompt: 'ช่วยวิเคราะห์ปัญหางานถนน อาคาร หรือโครงสร้าง พร้อมสาเหตุ ความเสี่ยง วิธีตรวจ และแนวทางแก้ไข' })
      ])
    }),
    Object.freeze({
      id: 'council', title: 'สภาท้องถิ่น', keywords: 'สภา ญัตติ ข้อบัญญัติ ประชุมสภา ระเบียบวาระ กระทู้',
      tasks: Object.freeze([
        Object.freeze({ label: 'ร่างญัตติ', prompt: 'ช่วยร่างญัตติสำหรับสภาท้องถิ่น โดยถามเรื่อง เหตุผล และข้อเสนอที่ต้องการก่อน' }),
        Object.freeze({ label: 'ร่าง / ตรวจข้อบัญญัติ', prompt: 'ช่วยวิเคราะห์และร่างหรือทบทวนข้อบัญญัติท้องถิ่น พร้อมฐานอำนาจและประเด็นที่ต้องตรวจ' }),
        Object.freeze({ label: 'เตรียมระเบียบวาระประชุมสภา', prompt: 'ช่วยจัดระเบียบวาระประชุมสภาท้องถิ่นและ checklist เอกสารประกอบ' }),
        Object.freeze({ label: 'ตรวจขั้นตอนการประชุมสภา', prompt: 'ช่วยตรวจขั้นตอนการประชุมสภาท้องถิ่นตามข้อเท็จจริงและประเด็นที่ให้' }),
        Object.freeze({ label: '🏛️ ทำรายงานการประชุมสภาท้องถิ่น', prompt: 'ทำรายงานการประชุมสภาท้องถิ่น' })
      ])
    }),
    Object.freeze({
      id: 'health', title: 'สาธารณสุขและ รพ.สต.', keywords: 'สาธารณสุข รพ.สต. NCD สปสช สุขภาพ ผู้สูงอายุ PDPA ผู้ป่วย',
      tasks: Object.freeze([
        Object.freeze({ label: 'ทำโครงการสุขภาพ / NCD', prompt: 'ทำโครงการ NCD' }),
        Object.freeze({ label: 'โครงการกองทุน สปสช.', prompt: 'ช่วยจัดทำโครงการกองทุน สปสช. โดยถามกลุ่มเป้าหมาย กิจกรรม งบประมาณ และหลักเกณฑ์ที่เกี่ยวข้องก่อน' }),
        Object.freeze({ label: 'งาน รพ.สต. / แผนสุขภาพ', prompt: 'ช่วยจัดทำหรือวิเคราะห์งาน รพ.สต. และแผนสุขภาพจากข้อมูลพื้นที่ที่ให้' }),
        Object.freeze({ label: 'PDPA ข้อมูลสุขภาพ', prompt: 'ช่วยตรวจความเสี่ยง PDPA และแนวทางใช้ข้อมูลสุขภาพอย่างจำเป็นและปลอดภัย' })
      ])
    }),
    Object.freeze({
      id: 'education', title: 'การศึกษา เยาวชน และการอบรม', keywords: 'การศึกษา โรงเรียน เยาวชน เด็ก กีฬา อบรม หลักสูตร',
      tasks: Object.freeze([
        Object.freeze({ label: 'ทำโครงการอบรม', prompt: 'จัดอบรม' }),
        Object.freeze({ label: 'ออกแบบหลักสูตร / กำหนดการ', prompt: 'ช่วยออกแบบหลักสูตรและกำหนดการอบรมให้สอดคล้องกับวัตถุประสงค์และกลุ่มเป้าหมาย' }),
        Object.freeze({ label: 'โครงการเด็ก / เยาวชน / กีฬา', prompt: 'ช่วยจัดทำโครงการด้านเด็ก เยาวชน หรือกีฬา โดยถามปัญหา กลุ่มเป้าหมาย กิจกรรม และงบก่อน' }),
        Object.freeze({ label: 'ประเมินผลการอบรม', prompt: 'ช่วยออกแบบแบบประเมินและตัวชี้วัดผลการอบรมให้วัดผลได้จริง' })
      ])
    }),
    Object.freeze({
      id: 'pr', title: 'ประชาสัมพันธ์และสื่อสาร', keywords: 'PR ประชาสัมพันธ์ ข่าว โพสต์ Facebook อินโฟกราฟิก คำกล่าว สคริปต์ วิดีโอ video',
      tasks: Object.freeze([
        Object.freeze({ label: 'เขียนข่าวประชาสัมพันธ์', prompt: 'ช่วยเขียนข่าวประชาสัมพันธ์ราชการจากข้อเท็จจริงที่ให้' }),
        Object.freeze({ label: 'ทำโพสต์โซเชียล', prompt: 'ทำโพสต์ประชาสัมพันธ์' }),
        Object.freeze({ label: 'วางข้อความอินโฟกราฟิก', prompt: 'ช่วยจัดข้อความสำหรับอินโฟกราฟิกให้สั้น ชัด เข้าใจง่าย และไม่เกินจริง' }),
        Object.freeze({
          label: 'ร่างสคริปต์ / คำกล่าว / วิดีโอ',
          prompt: 'ร่างสคริปต์ / คำกล่าว / วิดีโอ',
          choices: Object.freeze([
            Object.freeze({ label: '🎤 คำกล่าว', prompt: 'ร่างคำกล่าว' }),
            Object.freeze({ label: '📝 สคริปต์', prompt: 'ร่างสคริปต์' }),
            Object.freeze({ label: '🎬 วิดีโอ', prompt: 'ทำวิดีโอประชาสัมพันธ์', intake: 'pr-video' })
          ])
        })
      ])
    }),
    Object.freeze({
      id: 'audit', title: 'กฎหมาย ระเบียบ และตรวจสอบ', keywords: 'กฎหมาย ระเบียบ หนังสือสั่งการ หารือ ตรวจสอบภายใน ความเสี่ยง ทุจริต ธรรมาภิบาล PDPA ตรวจเอกสาร ควบคุมภายใน',
      tasks: Object.freeze([
        Object.freeze({ label: 'ค้นและวิเคราะห์กฎหมาย / ระเบียบ', prompt: 'ช่วยค้นและวิเคราะห์กฎหมาย ระเบียบ หรือหนังสือสั่งการที่เกี่ยวข้อง พร้อมฐานอำนาจ เงื่อนไข ความเสี่ยง และข้อเสนอแนะ โดยใช้แหล่งทางการที่เป็นปัจจุบัน' }),
        Object.freeze({ label: 'ตรวจความเสี่ยงทุจริต', prompt: 'ช่วยวิเคราะห์ความเสี่ยงทุจริต จุดควบคุม หลักฐาน และแนวทางป้องกันสำหรับงานนี้' }),
        Object.freeze({ label: 'ตรวจความครบถ้วนเอกสาร', prompt: 'ช่วยทำ checklist ตรวจความครบถ้วนของเอกสารและหลักฐานก่อนเสนอหรืออนุมัติ' }),
        Object.freeze({ label: 'ประเมินความเสี่ยง / ควบคุมภายใน', prompt: 'เลือกแบบรายงานควบคุมภายในที่ต้องการ', choices: Object.freeze([
          Object.freeze({"label":"ประเมินความเสี่ยง / มาตรการควบคุม","prompt":"ช่วยประเมินความเสี่ยงและออกแบบมาตรการควบคุมภายในสำหรับกระบวนงานนี้"}),
          Object.freeze({"label":"ปค.1 หนังสือรับรอง","prompt":"ช่วยจัดทำร่าง ปค.1 หนังสือรับรองการประเมินผลการควบคุมภายใน โดยถามข้อมูลจำเป็นทีละประเด็น ตรวจสอบแบบทางการและหลักฐานก่อนสรุป ห้ามสร้างข้อเท็จจริง","skipGenericIntake":true}),
          Object.freeze({"label":"ปค.2 แบบประเมินองค์ประกอบ","prompt":"ช่วยจัดทำร่าง ปค.2 ตามแบบที่ใช้บังคับ ตรวจสอบองค์ประกอบ หลักฐานและผู้รับผิดชอบ ถามข้อมูลที่ขาดทีละประเด็น","skipGenericIntake":true}),
          Object.freeze({"label":"ปค.3 แบบประเมินที่เกี่ยวข้อง","prompt":"ช่วยตรวจสอบว่าหน่วยงานต้องใช้ ปค.3 ฉบับใดตามแบบทางการที่มีผลใช้บังคับ แล้วช่วยร่างจากหลักฐานจริง โดยไม่เดาข้อเท็จจริง","skipGenericIntake":true}),
          Object.freeze({"label":"ปค.4 รายงานการประเมินองค์ประกอบ","prompt":"ช่วยจัดทำร่าง ปค.4 รายงานการประเมินองค์ประกอบของการควบคุมภายใน ตรวจสอบแบบและหลักฐานก่อนสรุป","skipGenericIntake":true}),
          Object.freeze({"label":"ปค.5 รายงานการประเมินผล","prompt":"ช่วยจัดทำ ปค.5 รายงานการประเมินผลการควบคุมภายใน เริ่มจากถามชื่อหน่วยงาน ปีงบประมาณ ภารกิจ ความเสี่ยง การควบคุมที่มีอยู่ ผลประเมิน ความเสี่ยงคงเหลือ การปรับปรุง กำหนดเสร็จและผู้รับผิดชอบ ทีละประเด็น หากข้อมูลไม่ครบให้ระบุรอตรวจสอบ ห้ามแต่งข้อมูลจริง","skipGenericIntake":true}),
          Object.freeze({"label":"ปค.6 รายงานสอบทาน","prompt":"ช่วยจัดทำร่าง ปค.6 รายงานการสอบทานการประเมินผลการควบคุมภายใน ตรวจสอบอำนาจหน้าที่ผู้สอบทาน แบบทางการและหลักฐาน","skipGenericIntake":true}),
          Object.freeze({"label":"วค.1 / วค.2","prompt":"ช่วยตรวจสอบประเภทหน่วยงานและความจำเป็นในการใช้แบบ วค.1 หรือ วค.2 ตามข้อกำหนดที่ใช้บังคับ แล้วช่วยจัดทำร่างโดยไม่เดาข้อมูล","skipGenericIntake":true})
        ]) }),
        Object.freeze({ label: 'ตรวจ PDPA / ข้อมูลส่วนบุคคล', prompt: 'ช่วยตรวจว่าเรื่องนี้มีข้อมูลส่วนบุคคลอะไรที่ไม่จำเป็น ความเสี่ยง PDPA และควรปกปิดหรือจัดการอย่างไร' })
      ])
    })
  ]);

  function addCatalogStyles() {
    if (document.getElementById('gp-work-catalog-style')) return;
    const style = document.createElement('style');
    style.id = 'gp-work-catalog-style';
    style.textContent = `
      /* UI ONLY: preserve existing catalog data, prompts and click behavior. */
      .work-catalog-home{width:100%}
      .work-catalog-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:0 0 14px;text-align:left}
      .work-catalog-heading h2{margin:0;color:#12372a;font-size:clamp(1.15rem,2vw,1.35rem);line-height:1.25}
      .work-catalog-intro{margin:3px 0 0;color:#52645b;font-size:.9rem;line-height:1.5}
      .work-catalog-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .work-catalog-group{position:relative;min-width:0;border:1px solid #d7e1dc;border-radius:17px;padding:12px 13px;background:rgba(255,255,255,.94);box-shadow:0 4px 14px rgba(18,55,42,.045);transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease}
      .work-catalog-group:hover{border-color:#a9c6b7;box-shadow:0 7px 18px rgba(18,55,42,.075);transform:translateY(-1px)}
      .work-catalog-group h3{position:relative;margin:0;padding:2px 28px 2px 42px;color:#30483d;font-size:.98rem;line-height:1.42;min-height:38px;display:flex;align-items:center;cursor:pointer}
      .work-catalog-group h3::before{content:'•';position:absolute;left:10px;top:50%;transform:translateY(-50%);width:27px;height:27px;display:grid;place-items:center;border-radius:9px;background:#edf6f1;color:#12372a;font-size:17px;font-weight:800}
      .work-catalog-group h3::after{content:'⌄';position:absolute;right:4px;top:50%;transform:translateY(-55%);color:#60736a;font-size:16px;font-weight:800}
      .work-catalog-group.work-catalog-tone-1 h3::before{content:'🚨';background:#fff0ef}
      .work-catalog-group.work-catalog-tone-2 h3::before{content:'👥';background:#edf4ff}
      .work-catalog-group.work-catalog-tone-3 h3::before{content:'📄';background:#f3f5f6}
      .work-catalog-group.work-catalog-tone-4 h3::before{content:'📊';background:#fff5e8}
      .work-catalog-group.work-catalog-tone-5 h3::before{content:'🛒';background:#fff8df}
      .work-catalog-group.work-catalog-tone-6 h3::before{content:'💰';background:#eef9f2}
      .work-catalog-tasks{display:flex;flex-wrap:wrap;gap:7px;padding-top:8px}
      .work-catalog-task{border:1px solid #c8d7d0;background:#fff;color:#12372a;border-radius:11px;padding:8px 11px;font:inherit;font-weight:700;cursor:pointer;text-align:left}
      .work-catalog-task:hover,.work-catalog-task:focus-visible{background:#edf6f1;outline:2px solid #12372a;outline-offset:1px}
      @media(max-width:959px) and (min-width:621px){
        .work-catalog-groups{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:620px){
        .work-catalog-heading{display:block;margin-bottom:10px}
        .work-catalog-heading h2{font-size:1.1rem}
        .work-catalog-intro{margin-top:3px;font-size:.82rem}
        .work-catalog-groups{grid-template-columns:1fr;gap:9px}
        .work-catalog-group{padding:0;border-radius:15px;box-shadow:0 2px 9px rgba(18,55,42,.04)}
        .work-catalog-group h3{padding:10px 36px 10px 54px;font-size:1rem;line-height:1.35;min-height:60px}
        .work-catalog-group h3::before{left:10px;width:32px;height:32px;border-radius:9px;font-size:17px}
        .work-catalog-group h3::after{right:10px;font-size:16px}
        .work-catalog-tasks{grid-template-columns:1fr;gap:6px;padding:0 10px 10px}
        .work-catalog-task{width:100%;border-radius:10px;padding:9px 10px;font-size:.84rem}
      }
      @media(max-width:360px){
        .work-catalog-groups{gap:7px}
        .work-catalog-group h3{padding-left:50px;font-size:.92rem}
      }
      .work-catalog-group{padding:8px 6px}
        .work-catalog-group h3{padding-left:33px;font-size:.84rem}
        .work-catalog-group h3::before{width:24px;height:24px}
      }


      /* Final mobile/card normalization: remove inherited nested boxes. */
      .work-catalog-group{overflow:hidden}
      .work-catalog-group > h3{
        display:flex!important;
        box-sizing:border-box!important;
        width:100%!important;
        max-width:none!important;
        margin:0!important;
        border:0!important;
        outline:0!important;
        background:transparent!important;
        box-shadow:none!important;
        font-family:inherit!important;
        font-weight:800!important;
        text-align:left!important;
        white-space:normal!important;
        word-break:normal!important;
        overflow-wrap:normal!important;
      }
      .work-catalog-group > h3:focus-visible{outline:2px solid #12372a!important;outline-offset:2px}
      .work-catalog-group.is-open{border-color:#8fb9a5}
      .work-catalog-group.is-open > h3::after{content:'⌃'}
      .work-catalog-tasks[hidden]{display:none!important}
      .pr-video-intake{display:grid;gap:12px}
      .pr-video-label{font-weight:800;color:#12372a}
      .pr-video-topic{width:100%;box-sizing:border-box;border:1px solid #c8d7d0;border-radius:14px;padding:12px;font:inherit;resize:vertical;min-height:120px}
      .pr-video-topic:focus{outline:2px solid #12372a;outline-offset:1px}
      .pr-video-row{display:flex;flex-wrap:wrap;gap:7px}
      .pr-video-row .is-selected{background:#12372a;color:#fff}
      .pr-video-help{margin:0;color:#617068;font-size:.92rem}
      .pr-video-create{border:0;border-radius:14px;padding:12px 16px;background:#12372a;color:#fff;font:inherit;font-weight:800;cursor:pointer}
    `;
    document.head.append(style);
  }
  function normalize(value) {
    return String(value || '').normalize('NFC').toLocaleLowerCase('th-TH').replace(/\s+/g, ' ').trim();
  }

  const RESULT_PROMPT_KEY = 'govprompt.resultPrompt.v1';
  const RESULT_FORCE_INTAKE_KEY = 'govprompt.forceGuidedIntake.v1';
  const RESULT_TRUSTED_INTERNAL_KEY = 'govprompt.resultPromptTrustedInternal.v1';

  function openResultPage(prompt, options = {}) {
    const value = String(prompt || '').trim();
    if (!value) return;
    try {
      sessionStorage.setItem(RESULT_PROMPT_KEY, value);
      sessionStorage.setItem(RESULT_FORCE_INTAKE_KEY, options.forceIntake === false ? 'false' : 'true');
      sessionStorage.setItem(RESULT_TRUSTED_INTERNAL_KEY, options.trustedInternal === true ? 'true' : 'false');
      const target = new URL(window.location.href);
      target.searchParams.set('view', 'result');
      target.searchParams.set('run', String(Date.now()));
      target.hash = '';
      window.location.assign(target.toString());
    } catch {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      form.requestSubmit();
    }
  }

  function buildCatalog() {
    const root = document.createElement('div');
    const heading = document.createElement('div');
    const title = document.createElement('h2');
    const intro = document.createElement('p');
    const groups = document.createElement('div');
    root.className = 'work-catalog-home';
    heading.className = 'work-catalog-heading';
    title.textContent = 'เลือกผู้ช่วยตามงาน';
    intro.className = 'work-catalog-intro';
    intro.textContent = '13 หมวดงาน เรียงจากงานที่ใช้บ่อย • มีเส้นทางช่วยเหลือประชาชนและสาธารณภัยอัตโนมัติ';
    groups.className = 'work-catalog-groups';

    const categories = new Map(WORK_CATALOG.map(category => [category.id, category]));
    const renderCategory = (category, index) => {
      if (!category) return;
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      const tasks = document.createElement('div');
      section.className = `work-catalog-group work-catalog-tone-${(index % 6) + 1}`;
      // Mobile UI hardening: keep each category card and heading full-width.
      section.style.width = '100%';
      section.style.minWidth = '0';
      section.style.boxSizing = 'border-box';
      heading.style.width = '100%';
      heading.style.maxWidth = 'none';
      heading.style.minWidth = '0';
      heading.style.boxSizing = 'border-box';
      heading.style.whiteSpace = 'normal';
      heading.style.wordBreak = 'normal';
      heading.style.overflowWrap = 'normal';
      section.dataset.categoryId = category.id;
      if (category.id === 'assistance') section.dataset.assistanceRoute = 'true';
      section.dataset.search = normalize(`${category.title} ${category.keywords} ${category.tasks.map(task => `${task.label} ${task.prompt}`).join(' ')}`);
      const icon = document.createElement('span');
      const name = document.createElement('span');
      icon.className = 'assistant-catalog-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = CATEGORY_ICONS[category.id] || '•';
      name.className = 'assistant-catalog-name';
      name.textContent = category.title;
      heading.append(icon, name);
      tasks.className = 'work-catalog-tasks';
      tasks.hidden = true;
      category.tasks.forEach(task => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'work-catalog-task';
        button.dataset.prompt = task.prompt;
        if (Array.isArray(task.choices) && task.choices.length) {
          button.dataset.taskChoices = JSON.stringify(task.choices);
        }
        button.dataset.search = normalize(`${category.title} ${category.keywords} ${task.label} ${task.description || ''} ${task.prompt}`);
        if (task.description) {
          const taskLabel = document.createElement('span');
          const taskDescription = document.createElement('small');
          taskLabel.className = 'work-catalog-task-label';
          taskDescription.className = 'work-catalog-task-description';
          taskLabel.textContent = task.label;
          taskDescription.textContent = task.description;
          button.append(taskLabel, taskDescription);
        } else {
          button.textContent = task.label;
        }
        tasks.append(button);
      });
      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      heading.setAttribute('aria-expanded', 'false');
      const toggleCategory = () => {
        const nextHidden = !tasks.hidden;

        // Mobile catalog: only one category may be open at a time.
        if (!nextHidden) {
          groups.querySelectorAll('.work-catalog-group').forEach(other => {
            if (other === section) return;
            const otherTasks = other.querySelector('.work-catalog-tasks');
            const otherHeading = other.querySelector(':scope > h3');
            if (otherTasks) otherTasks.hidden = true;
            if (otherHeading) otherHeading.setAttribute('aria-expanded', 'false');
            other.classList.remove('is-open');
          });
        }

        tasks.hidden = nextHidden;
        heading.setAttribute('aria-expanded', String(!nextHidden));
        section.classList.toggle('is-open', !nextHidden);
      };
      heading.addEventListener('click', toggleCategory);
      heading.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleCategory();
        }
      });
      section.append(heading, tasks);
      groups.append(section);
    };

    // Assistance Route is a dedicated public-service entry, separate from the 12 core work categories.
    // This preserves the existing 12-category contract while keeping citizen-assistance actions visible.
    renderCategory(categories.get('assistance'), 0);
    CATALOG_ORDER.map(id => categories.get(id)).filter(Boolean).forEach((category, index) => {
      renderCategory(category, index + 1);
    });

    heading.append(title, intro);
    root.append(heading, groups);
    return root;
  }

  function openTaskChoices(button) {
    if (!dialog || !dialogTitle || !dialogEyebrow || !dialogContent) return false;
    let choices = [];
    try { choices = JSON.parse(button.dataset.taskChoices || '[]'); } catch { choices = []; }
    if (!Array.isArray(choices) || !choices.length) return false;

    const root = document.createElement('div');
    root.className = 'work-catalog-tasks';
    choices.forEach(choice => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'work-catalog-task';
      item.dataset.prompt = String(choice.prompt || '').trim();
      if (choice.intake) item.dataset.localIntake = String(choice.intake);
      if (choice.skipGenericIntake) item.dataset.skipGenericIntake = 'true';
      item.textContent = String(choice.label || choice.prompt || 'เลือก');
      root.append(item);
    });
    const isInternalControlChoices = choices.some(choice => /(?:ปค\\.?\\s*[1-6]|วค\\.?\\s*[12])/.test(String(choice.prompt || '')));
    dialog.classList.toggle('gp-internal-control-choices', isInternalControlChoices);
    dialogTitle.textContent = isInternalControlChoices ? 'เลือกแบบรายงานควบคุมภายใน' : 'ต้องการให้ช่วยแบบไหน?';
    dialogEyebrow.textContent = isInternalControlChoices ? 'เลือกแบบ แล้วไปให้ข้อมูลกับ AI ที่ต้องการได้เลย' : 'เลือกอย่างเดียว แล้วบอกเรื่องหรือแนบข้อมูลได้เลย';
    dialogContent.replaceChildren(root);
    if (!dialog.open) dialog.showModal();
    return true;
  }

  function openPrVideoIntake() {
    if (!dialog || !dialogTitle || !dialogEyebrow || !dialogContent) return false;

    const root = document.createElement('div');
    root.className = 'pr-video-intake';
    root.innerHTML = `
      <label class="pr-video-label" for="prVideoTopic">เรื่องที่จะทำ</label>
      <textarea id="prVideoTopic" class="pr-video-topic" rows="5" placeholder="วางรายละเอียดข่าว กิจกรรม หรือเรื่องที่ต้องการทำวิดีโอ..."></textarea>
      <div class="pr-video-row">
        <button type="button" class="work-catalog-task" data-pr-video-duration="auto">✨ ให้ GP แนะนำความยาว</button>
        <button type="button" class="work-catalog-task" data-pr-video-duration="30 วินาที">30 วิ</button>
        <button type="button" class="work-catalog-task" data-pr-video-duration="1 นาที">1 นาที</button>
        <button type="button" class="work-catalog-task" data-pr-video-duration="3–5 นาที">3–5 นาที</button>
        <button type="button" class="work-catalog-task" data-pr-video-duration="5–7 นาที">5–7 นาที</button>
      </div>
      <p class="pr-video-help">แนบรูปหรือเอกสารได้จากช่องถามหลักหลังเลือกเมนูนี้</p>
      <button type="button" class="pr-video-create">สร้างชุดทำวิดีโอ</button>
    `;

    let duration = 'ให้ GP แนะนำ';
    root.querySelector('[data-pr-video-duration="auto"]')?.classList.add('is-selected');
    root.querySelectorAll('[data-pr-video-duration]').forEach(btn => {
      btn.addEventListener('click', () => {
        root.querySelectorAll('[data-pr-video-duration]').forEach(x => x.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        duration = btn.dataset.prVideoDuration === 'auto' ? 'ให้ GP แนะนำ' : btn.dataset.prVideoDuration;
      });
    });

    root.querySelector('.pr-video-create')?.addEventListener('click', () => {
      const topic = String(root.querySelector('#prVideoTopic')?.value || '').trim();
      if (!topic) {
        root.querySelector('#prVideoTopic')?.focus();
        return;
      }
      const prompt = [
        'ทำวิดีโอประชาสัมพันธ์',
        'เรื่อง: ' + topic,
        'ความยาว: ' + duration,
        'จัดผลลัพธ์เป็น: 1) ลำดับฉาก/Storyboard 2) บทพากย์ 3) ข้อความขึ้นจอและซับ 4) รายการภาพหรือคลิปที่ควรใช้ 5) Prompt พร้อมคัดลอกไปใช้กับ AI Video ภายนอก',
        'ยึดเฉพาะข้อเท็จจริงจากข้อมูลที่ให้ หากข้อมูลสำคัญขัดแย้งให้เตือนก่อน และห้ามแต่งข้อมูลบุคคล ตำแหน่ง วันที่ ตัวเลข หรือเหตุการณ์'
      ].join('\n');
      if (dialog?.open) dialog.close();
      openResultPage(prompt, { forceIntake: false });
    });

    dialogTitle.textContent = '🎬 ทำวิดีโอประชาสัมพันธ์';
    dialogEyebrow.textContent = 'บอกเรื่องที่ต้องการทำ — ที่เหลือให้ GP จัดให้';
    dialogContent.replaceChildren(root);
    if (!dialog.open) dialog.showModal();
    queueMicrotask(() => root.querySelector('#prVideoTopic')?.focus());
    return true;
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-prompt]');
    if (!button) return;

    if (normalize(button.dataset.prompt) === normalize('ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openResultPage([
        'ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา',
        'เริ่มจากการสนทนากับผู้ใช้โดยตรงในช่องสนทนาหลัก',
        'ห้ามเปิดแบบฟอร์ม GP223',
        'ถามข้อมูลที่จำเป็นเพิ่มเติมจากผู้ใช้เองทีละประเด็น โดยไม่ถามซ้ำข้อมูลที่มีแล้ว',
        'ใช้ Guided Intake มาตรฐานของ GovPrompt ให้ผู้ใช้ตอบข้อมูลตั้งต้นในช่องสนทนาหลัก ไม่เปิด Modal/Form เฉพาะงานนี้ และไม่บังคับให้แนบไฟล์',
        'เริ่มจากข้อมูลที่ผู้ใช้มี แล้วถามข้อมูลที่จำเป็นสำหรับงานนี้ต่ออย่างเป็นระบบ โดยไม่ถามสิ่งที่ผู้ใช้ให้ไว้แล้ว',
        'เมื่อข้อมูลเพียงพอ ให้ทำงานต่อทันทีโดยไม่ให้ผู้ใช้กรอกแบบฟอร์มซ้ำ',
        'หากมีเอกสารเพิ่มเติม ผู้ใช้สามารถแนบผ่านช่องเอกสารประกอบงานมาตรฐานของ GovPrompt ได้',
        'ตรวจลักษณะงานจริง ไม่ยึดชื่อตำแหน่ง; ตรวจ Employment-like Risk, Scope Integrity, Authority Boundary, Deliverable/Acceptance และความสอดคล้อง TOR↔สัญญา↔ผลส่งมอบ↔ตรวจรับ↔จ่ายเงิน',
        'AI-only: ตรวจ evidence ที่มี โดยเฉพาะ ว 727 ลงวันที่ 22 กันยายน 2569 เป็น authority candidate; ไม่มีต้นฉบับให้ UNVERIFIED เฉพาะประเด็นและร่างต่อ ไม่ค้นสดอัตโนมัติ',
        'ห้ามแต่งข้อเท็จจริง หากข้อมูลยังไม่พอให้ถามหรือระบุว่าไม่ทราบ และใช้ Applicable Authority Check + Decision Lock เมื่อยังยืนยันไม่ได้',
        'เป้าหมายสุดท้าย: จัดทำ TOR พร้อมฐานอำนาจ หลักฐาน ความเสี่ยง และ checklist ความสอดคล้องเอกสาร'
      ].join('\\n'), { forceIntake: true, trustedInternal: true });
      return;
    }

    if (normalize(button.dataset.prompt) === normalize('ทำรายงานการประชุมทั่วไป')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (dialog?.open && dialog.contains(button)) dialog.close();
      openResultPage([
        'ทำรายงานการประชุมทั่วไป',
        'เริ่มในช่องสนทนาหลักทันที ไม่เปิดแบบฟอร์มยาว',
        'ใช้ข้อมูลที่ผู้ใช้มีแล้วก่อน และถามเพิ่มเฉพาะช่องว่างที่มีผลต่อรายงานจริง',
        'ใช้กับประชุมผู้บริหาร หัวหน้าส่วนราชการ คณะกรรมการ คณะอนุกรรมการ คณะทำงาน โครงการ ประจำเดือน และประชุมทั่วไป',
        'ผู้ใช้สามารถส่งระเบียบวาระ บันทึกย่อ transcript หรือวางข้อความการประชุมได้',
        '🎙️ มีไฟล์เสียงการประชุม? ให้นำคำสั่งนี้ไปใช้กับ AI ปลายทางที่รองรับการอ่านไฟล์เสียง แล้วแนบไฟล์เสียงกับ AI ปลายทางโดยตรง',
        'หาก AI ปลายทางอ่านและถอดเสียงไฟล์ได้จริง ให้ถอดเสียงก่อนแล้วใช้ transcript จัดทำร่าง; หากไม่รองรับให้แจ้งข้อจำกัดตามจริงและขอ transcript/ข้อความแทน',
        'GovPrompt ไม่ถอดเสียง ไม่จัดเก็บเสียง และไม่ส่งไฟล์เสียงไปยัง AI ปลายทางโดยอัตโนมัติ',
        'Answer First: ถ้ามีข้อมูลพอให้ร่างรายงานก่อน ใช้ [ระบุ...] หรือ [ต้องตรวจสอบ] ในส่วนที่ยังขาด ห้ามแต่งชื่อ มติ หรือคะแนนเสียง'
      ].join('\n'), { forceIntake: false, trustedInternal: true });
      return;
    }

    if (normalize(button.dataset.prompt) === normalize('ทำรายงานการประชุมสภาท้องถิ่น')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (dialog?.open && dialog.contains(button)) dialog.close();
      openResultPage([
        'ทำรายงานการประชุมสภาท้องถิ่น',
        'เริ่มในช่องสนทนาหลักทันที ไม่เปิดแบบฟอร์มยาว',
        'ใช้กับการประชุมสภาองค์การบริหารส่วนจังหวัด สภาเทศบาล และสภาองค์การบริหารส่วนตำบล',
        'ใช้ข้อมูลที่ผู้ใช้มีแล้วก่อน และถามเพิ่มเฉพาะช่องว่างที่มีผลต่อรายงานจริง',
        'ผู้ใช้สามารถส่งระเบียบวาระ บันทึกย่อ transcript หรือวางข้อความการประชุมได้',
        '🎙️ มีไฟล์เสียงการประชุม? ให้นำคำสั่งนี้ไปใช้กับ AI ปลายทางที่รองรับการอ่านไฟล์เสียง แล้วแนบไฟล์เสียงกับ AI ปลายทางโดยตรง',
        'หาก AI ปลายทางอ่านและถอดเสียงไฟล์ได้จริง ให้ถอดเสียงก่อนแล้วใช้ transcript จัดทำร่าง; หากไม่รองรับให้แจ้งข้อจำกัดตามจริงและขอ transcript/ข้อความแทน',
        'GovPrompt ไม่ถอดเสียง ไม่จัดเก็บเสียง และไม่ส่งไฟล์เสียงไปยัง AI ปลายทางโดยอัตโนมัติ',
        'การร่างรายงานเป็นการบันทึกข้อเท็จจริง ไม่ใช่การตัดสินความชอบด้วยกฎหมาย; ถ้าถามความชอบด้วยกฎหมายให้แยกเข้า Authority/Evidence Gate',
        'Answer First: ถ้ามีข้อมูลพอให้ร่างรายงานก่อน ใช้ [ระบุ...] หรือ [ต้องตรวจสอบ] ในส่วนที่ยังขาด ห้ามแต่งชื่อ ญัตติ มติ หรือคะแนนเสียง'
      ].join('\n'), { forceIntake: false, trustedInternal: true });
      return;
    }

    if (button.dataset.localIntake === 'pr-video') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPrVideoIntake();
      return;
    }

    if (button.dataset.taskChoices) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openTaskChoices(button);
      return;
    }

    const prompt = String(button.dataset.prompt || '').trim();
    if (!prompt) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (dialog?.open && dialog.contains(button)) dialog.close();
    if (button.dataset.skipGenericIntake === 'true' && /(?:ปค\\.?\\s*[1-6]|วค\\.?\\s*[12])/.test(prompt)) {
      const handoffPrompt = [
        prompt,
        'รูปแบบการทำงาน: GovPrompt สร้างคำสั่งเท่านั้น ให้ AI ปลายทางสนทนากับผู้ใช้และจัดทำเอกสาร ไม่ให้ผู้ใช้กรอกฟอร์มใน GovPrompt',
        'เริ่มถามข้อมูลที่จำเป็นเพียงหนึ่งประเด็นต่อครั้ง และไม่ถามซ้ำข้อมูลที่ผู้ใช้ให้ไว้แล้ว; เมื่อมีข้อมูลพอให้ร่างรายงานตามแบบทางการทันที',
        'รับไฟล์หลักฐานที่ AI ปลายทางโดยตรงเมื่อผู้ใช้พร้อมแนบ ไม่อ้างว่า GovPrompt ได้รับหรือตรวจไฟล์แล้ว',
        'แยกข้อมูลที่ยืนยันแล้วจาก [รอตรวจสอบข้อมูลจริง] ห้ามถือว่าข้อมูลที่ไม่ทราบเป็นความเสี่ยงที่พบจริงหรือเป็นหลักฐานว่าการควบคุมผ่านแล้ว',
        'ตรวจแบบรายงานและหลักเกณฑ์ทางการฉบับที่ใช้บังคับผ่านเครื่องมือของ AI ปลายทางเมื่อจำเป็น; หากยังไม่ตรวจให้แจ้งข้อจำกัด ไม่แต่งกฎหมายหรือผลประเมิน',
        'ทำตารางรายงานฉบับร่างและส่งออก Word/PDF เมื่อ AI ปลายทางรองรับ; หากไม่รองรับให้จัดข้อความพร้อมคัดลอก ไม่กล่าวว่าได้สร้างไฟล์แล้ว',
        'การตรวจรับรอง ลงนาม และการใช้อำนาจจริงต้องผ่านเจ้าหน้าที่หรือผู้มีอำนาจ ไม่ให้ AI รับรองแทน'
      ].join('\\n');
      openResultPage(handoffPrompt, { trustedInternal: true, forceIntake: false });
    } else if (button.dataset.skipGenericIntake === 'true') {
      openResultPage(prompt, { trustedInternal: true, forceIntake: false });
    } else {
      openResultPage(prompt, { trustedInternal: true });
    }
  }, true);

  // Keep the internal-control chooser compact and legible on mobile without changing other dialogs.
  const internalControlStyle = document.createElement('style');
  internalControlStyle.id = 'gp-internal-control-dialog-style';
  internalControlStyle.textContent = `
    #appDialog.gp-internal-control-choices{box-sizing:border-box;max-width:min(94vw,540px);width:min(94vw,540px);max-height:85dvh;overflow-y:auto;border:1px solid #cbd9d1;border-radius:18px;padding:16px;background:#fff;box-shadow:0 12px 36px #132b2230}
    #appDialog.gp-internal-control-choices #dialogContent .work-catalog-tasks{display:grid;grid-template-columns:1fr;gap:8px}
    #appDialog.gp-internal-control-choices #dialogContent .work-catalog-task{width:100%;white-space:normal;overflow-wrap:anywhere;text-align:left}
    @media(max-width:620px){#appDialog.gp-internal-control-choices{width:calc(100vw - 24px);max-width:calc(100vw - 24px);max-height:80dvh;padding:12px;border-width:1px}}
  `;
  document.head.append(internalControlStyle);
  dialog?.addEventListener('close', () => dialog.classList.remove('gp-internal-control-choices'));

  addCatalogStyles();
  const mobileFinalStyle = document.createElement('style');
  mobileFinalStyle.id = 'gp-mobile-final-override';
  mobileFinalStyle.textContent = `
    @media (max-width:620px){
      .work-catalog-groups{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;width:100%!important}
      .work-catalog-group{display:block!important;width:100%!important;min-width:0!important;min-height:0!important}
      .work-catalog-group>h3{display:flex!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;white-space:normal!important;word-break:normal!important;overflow-wrap:anywhere!important;font-size:17px!important;line-height:1.35!important;padding:12px 42px 12px 58px!important;min-height:64px!important}
      .work-catalog-tasks{display:grid!important;grid-template-columns:1fr!important;width:100%!important;box-sizing:border-box!important}
      .work-catalog-tasks[hidden]{display:none!important}
    }
  `;
  document.head.append(mobileFinalStyle);
  quickActions.replaceChildren(buildCatalog());
})();
