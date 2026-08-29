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

  const PRIMARY_ACTIONS = Object.freeze([
    Object.freeze({ label: 'ร่างหนังสือ / บันทึก', prompt: 'ร่างหนังสือราชการ' }),
    Object.freeze({ label: 'ทำโครงการ', prompt: 'ทำโครงการ' }),
    Object.freeze({ label: 'พัสดุ / TOR', prompt: 'ร่าง TOR' }),
    Object.freeze({ label: 'เบิกจ่าย / ค่าใช้จ่าย', prompt: 'เบิกจ่าย' }),
    Object.freeze({ label: 'กฎหมาย / ระเบียบ', prompt: 'วิเคราะห์กฎหมาย' }),
    Object.freeze({ label: 'งานบุคคล', prompt: 'ทำงานบุคคล' })
  ]);

  const WORK_CATALOG = Object.freeze([
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
        Object.freeze({ label: 'สรุป / ร่างรายงานการประชุม', prompt: 'ช่วยสรุปและจัดทำรายงานการประชุมจากข้อมูลที่ให้' })
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
        Object.freeze({ label: 'เตรียมเกณฑ์ตรวจรับ', prompt: 'ช่วยจัดทำเกณฑ์ตรวจรับงานหรือพัสดุให้ชัดเจน วัดผลได้ และสอดคล้องกับ TOR' })
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
        Object.freeze({ label: 'ตรวจขั้นตอนการประชุมสภา', prompt: 'ช่วยตรวจขั้นตอนการประชุมสภาท้องถิ่นตามข้อเท็จจริงและประเด็นที่ให้' })
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
        Object.freeze({ label: 'ร่างสคริปต์ / คำกล่าว / วิดีโอ', prompt: 'ช่วยร่างสคริปต์ คำกล่าว หรือชุดทำวิดีโอประชาสัมพันธ์ให้เหมาะกับวัตถุประสงค์ ผู้พูด ผู้ฟัง และช่องทาง หากเป็นวิดีโอ ให้แนะนำความยาวตามงานก่อน แล้วจัด Storyboard บทพากย์ ข้อความขึ้นจอ/ซับ รายการภาพที่ควรใช้ และ Prompt พร้อมคัดลอกไปใช้กับ AI Video ภายนอก โดยยึดข้อเท็จจริงจากข้อมูลต้นฉบับ ห้ามแต่งชื่อ ตำแหน่ง วันที่ ตัวเลข หรือเหตุการณ์ และเตือนเมื่อพบข้อมูลขัดแย้งก่อนเผยแพร่' })
      ])
    }),
    Object.freeze({
      id: 'audit', title: 'ตรวจสอบ ความเสี่ยง และธรรมาภิบาล', keywords: 'ตรวจสอบภายใน ความเสี่ยง ทุจริต ธรรมาภิบาล PDPA ตรวจเอกสาร ควบคุมภายใน',
      tasks: Object.freeze([
        Object.freeze({ label: 'ตรวจความเสี่ยงทุจริต', prompt: 'ช่วยวิเคราะห์ความเสี่ยงทุจริต จุดควบคุม หลักฐาน และแนวทางป้องกันสำหรับงานนี้' }),
        Object.freeze({ label: 'ตรวจความครบถ้วนเอกสาร', prompt: 'ช่วยทำ checklist ตรวจความครบถ้วนของเอกสารและหลักฐานก่อนเสนอหรืออนุมัติ' }),
        Object.freeze({ label: 'ประเมินความเสี่ยง / ควบคุมภายใน', prompt: 'ช่วยประเมินความเสี่ยงและออกแบบมาตรการควบคุมภายในสำหรับกระบวนงานนี้' }),
        Object.freeze({ label: 'ตรวจ PDPA / ข้อมูลส่วนบุคคล', prompt: 'ช่วยตรวจว่าเรื่องนี้มีข้อมูลส่วนบุคคลอะไรที่ไม่จำเป็น ความเสี่ยง PDPA และควรปกปิดหรือจัดการอย่างไร' })
      ])
    })
  ]);

  function addCatalogStyles() {
    if (document.getElementById('gp-work-catalog-style')) return;
    const style = document.createElement('style');
    style.id = 'gp-work-catalog-style';
    style.textContent = `
      .quick-actions .work-catalog-open{border-style:dashed;background:#f7fbf9;color:#12372a}
      .work-catalog-intro{margin:0 0 12px;color:#44534d}
      .work-catalog-search{width:100%;min-height:44px;border:1px solid #b9c9c1;border-radius:12px;padding:10px 12px;font:inherit;background:#fff;color:#17201c;box-sizing:border-box;margin:0 0 14px}
      .work-catalog-search:focus{outline:2px solid #12372a;outline-offset:1px}
      .work-catalog-groups{display:grid;gap:12px}
      .work-catalog-group{border:1px solid #d7e1dc;border-radius:14px;padding:12px;background:#fbfdfc}
      .work-catalog-group h3{margin:0 0 8px;color:#12372a;font-size:1rem}
      .work-catalog-tasks{display:flex;flex-wrap:wrap;gap:7px}
      .work-catalog-task{border:1px solid #c8d7d0;background:#fff;color:#12372a;border-radius:999px;padding:8px 11px;font:inherit;font-weight:700;cursor:pointer;text-align:left}
      .work-catalog-task:hover,.work-catalog-task:focus-visible{background:#edf6f1;outline:2px solid #12372a;outline-offset:1px}
      .work-catalog-empty{padding:18px;text-align:center;border:1px dashed #cbd7d1;border-radius:14px;color:#59665f}
      @media(max-width:620px){.work-catalog-group{padding:10px}.work-catalog-task{width:100%;border-radius:12px;padding:10px 11px}.work-catalog-search{font-size:16px}}
    `;
    document.head.append(style);
  }

  function installPrimaryActions() {
    const fragment = document.createDocumentFragment();
    PRIMARY_ACTIONS.forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.prompt = action.prompt;
      button.textContent = action.label;
      fragment.append(button);
    });
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'work-catalog-open';
    more.dataset.workCatalogOpen = 'true';
    more.textContent = 'งานอื่น ๆ';
    more.setAttribute('aria-label', 'เปิดรายการงานอื่น ๆ ทั้งหมด');
    fragment.append(more);
    quickActions.replaceChildren(fragment);
  }

  function normalize(value) {
    return String(value || '').normalize('NFC').toLocaleLowerCase('th-TH').replace(/\s+/g, ' ').trim();
  }

  function buildCatalog() {
    const root = document.createElement('div');
    const intro = document.createElement('p');
    const search = document.createElement('input');
    const groups = document.createElement('div');
    const empty = document.createElement('div');
    intro.className = 'work-catalog-intro';
    intro.textContent = 'เลือกจากหมวด หรือพิมพ์คำที่นึกออก เช่น BOQ, โบนัส, NCD, งบประมาณ, ข่าว — ไม่ต้องรู้ชื่อเมนู';
    search.className = 'work-catalog-search';
    search.type = 'search';
    search.placeholder = 'ค้นหางานที่ต้องการ...';
    search.setAttribute('aria-label', 'ค้นหางานที่ต้องการ');
    groups.className = 'work-catalog-groups';
    empty.className = 'work-catalog-empty';
    empty.textContent = 'ยังไม่พบงานที่ตรงคำค้น — ลองพิมพ์คำสั้นลง หรือถามในช่องหลักได้เลย';
    empty.hidden = true;

    WORK_CATALOG.forEach(category => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      const tasks = document.createElement('div');
      section.className = 'work-catalog-group';
      section.dataset.search = normalize(`${category.title} ${category.keywords} ${category.tasks.map(task => `${task.label} ${task.prompt}`).join(' ')}`);
      heading.textContent = category.title;
      tasks.className = 'work-catalog-tasks';
      category.tasks.forEach(task => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'work-catalog-task';
        button.dataset.prompt = task.prompt;
        button.dataset.search = normalize(`${category.title} ${category.keywords} ${task.label} ${task.prompt}`);
        button.textContent = task.label;
        tasks.append(button);
      });
      section.append(heading, tasks);
      groups.append(section);
    });

    search.addEventListener('input', () => {
      const query = normalize(search.value);
      let visibleCount = 0;
      groups.querySelectorAll('.work-catalog-group').forEach(section => {
        let sectionVisible = false;
        section.querySelectorAll('.work-catalog-task').forEach(button => {
          const visible = !query || button.dataset.search.includes(query);
          button.hidden = !visible;
          if (visible) { sectionVisible = true; visibleCount += 1; }
        });
        section.hidden = !sectionVisible;
      });
      empty.hidden = visibleCount !== 0;
    });

    root.append(intro, search, groups, empty);
    return { root, search };
  }

  function openCatalog() {
    if (!dialog || !dialogTitle || !dialogEyebrow || !dialogContent) return;
    const { root, search } = buildCatalog();
    dialogTitle.textContent = 'งานอื่น ๆ ที่ GP ช่วยได้';
    dialogEyebrow.textContent = 'เลือกงานให้ตรงเรื่อง หรือค้นหาด้วยคำที่นึกออก';
    dialogContent.replaceChildren(root);
    if (!dialog.open) dialog.showModal();
    queueMicrotask(() => search.focus());
  }

  document.addEventListener('click', event => {
    const catalogTrigger = event.target.closest?.('[data-work-catalog-open]');
    if (catalogTrigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openCatalog();
      return;
    }

    const button = event.target.closest?.('[data-prompt]');
    if (!button) return;
    const prompt = String(button.dataset.prompt || '').trim();
    if (!prompt) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (dialog?.open && dialog.contains(button)) dialog.close();
    input.value = prompt;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.requestSubmit();
  }, true);

  addCatalogStyles();
  installPrimaryActions();
})();