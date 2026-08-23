(() => {
  'use strict';

  const app = window.GovPrompt = window.GovPrompt || {};
  const events = app.events || new EventTarget();

  app.version = '2.0.5';
  app.events = events;
  app.on = (type, listener, options) => events.addEventListener(type, listener, options);
  app.off = (type, listener, options) => events.removeEventListener(type, listener, options);
  app.emit = (type, detail) => events.dispatchEvent(new CustomEvent(type, { detail }));

  app.toast = message => {
    let toast = document.querySelector('.gp-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'gp-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(app.toastTimer);
    app.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };

  function initializeLayout() {
    const main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'main-content';
    if (document.querySelector('.gp-skip')) return;

    const skip = document.createElement('a');
    skip.className = 'gp-skip';
    skip.href = `#${main.id}`;
    skip.textContent = 'ข้ามไปยังเนื้อหาหลัก';
    document.body.prepend(skip);
  }

  function initializeBrand() {
    const brand = document.querySelector('.bar b,.brand b');
    if (!brand || document.querySelector('.gp-release-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'gp-release-badge';
    badge.textContent = 'Release 2.0';
    brand.after(badge);
  }

  function initializeAccessibleNames() {
    document.querySelectorAll('button[title]:not([aria-label])').forEach(button => {
      button.setAttribute('aria-label', button.title);
    });
  }

  function initializeNavigation() {
    document.querySelectorAll('[data-panel]').forEach(button => {
      button.addEventListener('click', () => {
        app.emit('shell:panel', { panel: button.dataset.panel, trigger: button });
      });
    });
  }

  function initializeDialogs() {
    document.querySelectorAll('[data-dialog-close]').forEach(button => {
      button.addEventListener('click', () => button.closest('dialog')?.close());
    });
    document.querySelectorAll('dialog').forEach(dialog => {
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  async function initializeCaseList() {
    if (!document.querySelector('.bottom-nav') || !document.getElementById('chatForm')) return;
    try {
      const module = await import('./ui/case-list-ui-v1.js?v=1.0.0');
      module.initializeCaseListUI({ app });
    } catch {
      // Case Memory UI is progressive enhancement; the core chat remains usable.
    }
  }

  function initializeShell() {
    if (app.shellInitialized) return;
    app.shellInitialized = true;
    document.documentElement.lang = 'th';
    initializeLayout();
    initializeBrand();
    initializeAccessibleNames();
    initializeNavigation();
    initializeDialogs();
    initializeCaseList();
  }

  app.initializeShell = initializeShell;
  initializeShell();

  const attachmentInstruction = `ขั้นตอนตรวจข้อมูลและเอกสารก่อนวิเคราะห์
1. ให้อ่านข้อมูลที่ผู้ใช้กรอกและเอกสารแนบทั้งหมดก่อน
2. หากผู้ใช้มีเอกสาร ให้ดึงข้อมูลจากเอกสารมาใช้และห้ามถามข้อมูลที่พบแล้วซ้ำ
3. หากยังไม่มีเอกสาร ให้แจ้งว่าผู้ใช้สามารถแนบเอกสารที่เกี่ยวข้องในแชตนี้ได้ เช่น โครงการ ประมาณการค่าใช้จ่าย กำหนดการ ข้อบัญญัติงบประมาณ แผนงาน TOR หรือหลักฐานอื่น
4. หากข้อมูลสำคัญยังไม่ครบ ห้ามปฏิเสธการตอบทั้งหมด ให้ตอบเป็น 3 ส่วนตามลำดับดังนี้
   4.1 คำตอบเบื้องต้น: วิเคราะห์เท่าที่ข้อมูลรองรับ พร้อมระบุระดับความมั่นใจและเงื่อนไข ห้ามฟันธงเกินหลักฐาน
   4.2 ข้อมูลที่ยังขาด: ถามเฉพาะข้อมูลสำคัญที่มีผลต่อคำตอบ โดยจัดลำดับความสำคัญ
   4.3 เอกสารที่แนบแทนได้: ระบุชื่อเอกสารที่ช่วยเติมข้อมูลแต่ละส่วน
5. เมื่อข้อมูลเพียงพอแล้ว ให้จัดทำผลลัพธ์ฉบับเต็มและสรุปสถานะให้ชัดเจนตามลักษณะภารกิจ เช่น ดำเนินการได้ ดำเนินการได้เมื่อแก้ไข/เพิ่มเติม หรือยังดำเนินการไม่ได้
6. ห้ามสมมติข้อมูลที่ไม่มีในข้อความหรือเอกสารแนบ ทุกข้อสรุปต้องแยกข้อเท็จจริงออกจากข้อวิเคราะห์
7. หากเอกสารอ่านไม่ชัด ขัดแย้งกัน หรือไม่ใช่ฉบับปัจจุบัน ให้ระบุจุดที่ต้องยืนยันก่อนนำผลไปใช้
8. ก่อนแสดงข้อมูลจากเอกสาร ให้ตรวจและปกปิดข้อมูลส่วนบุคคล ข้อมูลอ่อนไหว และข้อมูลลับที่ไม่จำเป็น
9. ใช้คำว่า [ต้องตรวจสอบ/เพิ่มเติม] เฉพาะจุดที่ยังขาดจริง และอธิบายสั้น ๆ ว่าข้อมูลนั้นมีผลต่อคำตอบอย่างไร
10. การอ้างแหล่งข้อมูลและลิงก์:
   10.1 ใช้แหล่งทางการหรือเอกสารปฐมภูมิเป็นหลัก
   10.2 ก่อนแสดงลิงก์ ต้องตรวจว่าลิงก์เปิดได้และหน้าเอกสารนั้นสนับสนุนข้อความที่อ้างจริง
   10.3 หากเปิดลิงก์ไม่ได้ ไม่มีสิทธิ์ตรวจเว็บ หรือ URL มีอักขระเสีย เช่น %EF%BF%BD ห้ามแสดงเป็นลิงก์ที่ยืนยันแล้ว ให้ระบุ [ลิงก์ยังไม่ได้ตรวจสอบ] พร้อมชื่อเอกสาร หน่วยงานเจ้าของเอกสาร และคำค้นที่ใช้ค้นหาแทน
   10.4 ห้ามสร้าง URL เลขหนังสือ วันที่ หรือชื่อเอกสารขึ้นเอง
   10.5 แยกให้ชัดว่าได้อ่านเอกสารฉบับเต็ม อ่านเพียงบางหน้า หรือเห็นเฉพาะข้อความสรุปจากผลการค้นหา
11. หากไม่สามารถยืนยันแหล่งอ้างอิงได้ ให้ตอบตามข้อเท็จจริงที่มีและระบุสิ่งที่ต้องตรวจต้นฉบับ ห้ามฟันธงสิทธิ อัตรา หรืออำนาจอนุมัติจากข้อความค้นหาเพียงอย่างเดียว`;

  function addAttachmentNotice() {
    const host = document.querySelector('.generator,form,#generatorForm');
    if (!host || document.querySelector('.gp-attachment-notice')) return;
    const note = document.createElement('details');
    note.className = 'gp-attachment-notice';
    note.innerHTML = '<summary>📎 เอกสารประกอบ</summary><div class="gp-attachment-help">คัดลอก Prompt ไปวางใน ChatGPT แล้วแนบไฟล์ในแชตเดียวกัน AI จะอ่านเอกสารและถามเฉพาะข้อมูลที่ยังขาด<br><small>โปรดปกปิดข้อมูลส่วนบุคคล ข้อมูลอ่อนไหว หรือข้อมูลลับที่ไม่จำเป็นก่อนแนบ</small></div>';
    const actions = host.querySelector('.actions,button[type="submit"],#make');
    if (actions) actions.insertAdjacentElement('beforebegin', note);
    else host.appendChild(note);
  }

  function enhanceGeneratedPrompt() {
    const outputs = [document.getElementById('output'), document.getElementById('resultOutput')].filter(Boolean);
    outputs.forEach(output => {
      const current = (output.textContent || '').trim();
      if (!current || current.includes('ขั้นตอนตรวจข้อมูลและเอกสารก่อนวิเคราะห์')) return;
      if (current.includes('Prompt ที่สร้าง') || current.includes('กรอกข้อมูลด้านซ้าย')) return;
      output.textContent = `${current}\n\n${attachmentInstruction}`;
      if (typeof generatedPrompt === 'string' && generatedPrompt.trim()) generatedPrompt = output.textContent;
      if (typeof prompt === 'string' && prompt.trim()) prompt = output.textContent;
    });
  }

  addAttachmentNotice();
  document.addEventListener('click', event => {
    if (event.target.closest('#make,button[type="submit"]')) setTimeout(enhanceGeneratedPrompt, 0);
  });
  document.addEventListener('submit', () => setTimeout(enhanceGeneratedPrompt, 0));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') document.getElementById('make')?.click();
    if (event.key === 'Escape' && document.querySelector('.workspace:not(.hidden)')) document.querySelector('.close-button')?.click();
  });

  window.addEventListener('unhandledrejection', () => {
    app.toast('เกิดข้อขัดข้อง กรุณาลองใหม่อีกครั้ง');
  });
})();
