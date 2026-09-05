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

  const CATALOG_ORDER = Object.freeze([
    'pr', 'records', 'audit', 'finance', 'planning', 'procurement',
    'hr', 'executive', 'engineering', 'health', 'education', 'council'
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
        Object.freeze({ label: 'สรุป / ร่างรายงานการประชุม', prompt: 'ช่วยสรุปและจัดทำรายงานการประชุมจากข้อมูลที่ให้' }),
        Object.freeze({ label: 'จัดหน้าเอกสาร', prompt: 'ช่วยจัดหน้าเอกสารที่แนบให้อ่านง่ายและเป็นทางการ โดยรักษาข้อเท็จจริง ชื่อ ตัวเลข วันที่ และสาระเดิมไว้' })
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
      .work-catalog-home{width:100%}
      .work-catalog-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:0 0 12px;text-align:left}
      .work-catalog-heading h2{margin:0;color:#12372a;font-size:1.18rem}
      .work-catalog-intro{margin:0;color:#52645b;font-size:.9rem}
      .work-catalog-groups{display:grid;gap:12px}
      .work-catalog-group{border:1px solid #d7e1dc;border-radius:14px;padding:12px;background:#fbfdfc}
      .work-catalog-group h3{margin:0 0 8px;color:#12372a;font-size:1rem}
      .work-catalog-tasks{display:flex;flex-wrap:wrap;gap:7px}
      .work-catalog-task{border:1px solid #c8d7d0;background:#fff;color:#12372a;border-radius:999px;padding:8px 11px;font:inherit;font-weight:700;cursor:pointer;text-align:left}
      .work-catalog-task:hover,.work-catalog-task:focus-visible{background:#edf6f1;outline:2px solid #12372a;outline-offset:1px}
      @media(max-width:620px){.work-catalog-heading{display:block;margin-bottom:10px}.work-catalog-heading h2{font-size:1rem}.work-catalog-intro{margin-top:2px;font-size:.78rem}.work-catalog-group{padding:10px}.work-catalog-task{width:100%;border-radius:12px;padding:10px 11px}}
    
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

  function openResultPage(prompt) {
    const value = String(prompt || '').trim();
    if (!value) return;
    try {
      sessionStorage.setItem(RESULT_PROMPT_KEY, value);
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
    intro.textContent = '12 หมวดงาน เรียงจากงานที่ใช้บ่อย';
    groups.className = 'work-catalog-groups';

    const categories = new Map(WORK_CATALOG.map(category => [category.id, category]));
    CATALOG_ORDER.map(id => categories.get(id)).filter(Boolean).forEach((category, index) => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      const tasks = document.createElement('div');
      section.className = `work-catalog-group work-catalog-tone-${(index % 6) + 1}`;
      section.dataset.categoryId = category.id;
      section.dataset.search = normalize(`${category.title} ${category.keywords} ${category.tasks.map(task => `${task.label} ${task.prompt}`).join(' ')}`);
      heading.textContent = category.title;
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
        button.dataset.search = normalize(`${category.title} ${category.keywords} ${task.label} ${task.prompt}`);
        button.textContent = task.label;
        tasks.append(button);
      });
      section.append(heading, tasks);
      groups.append(section);
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
      item.textContent = String(choice.label || choice.prompt || 'เลือก');
      root.append(item);
    });
    dialogTitle.textContent = 'ต้องการให้ช่วยแบบไหน?';
    dialogEyebrow.textContent = 'เลือกอย่างเดียว แล้วบอกเรื่องหรือแนบข้อมูลได้เลย';
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
      openResultPage(prompt);
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
    openResultPage(prompt);
  }, true);

  addCatalogStyles();
  quickActions.replaceChildren(buildCatalog());
})();
