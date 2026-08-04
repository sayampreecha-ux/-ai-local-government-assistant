(()=>{'use strict';
const GP=window.GovPrompt=window.GovPrompt||{};
GP.version='2.0.1';
GP.toast=message=>{let el=document.querySelector('.gp-toast');if(!el){el=document.createElement('div');el.className='gp-toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=message;el.classList.add('show');clearTimeout(GP.toastTimer);GP.toastTimer=setTimeout(()=>el.classList.remove('show'),2200)};
const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
if(main){const skip=document.createElement('a');skip.className='gp-skip';skip.href='#main-content';skip.textContent='ข้ามไปยังเนื้อหาหลัก';document.body.prepend(skip)}
const brand=document.querySelector('.bar b,.brand b');if(brand&&!document.querySelector('.gp-release-badge'))brand.insertAdjacentHTML('afterend','<span class="gp-release-badge">Release 2.0</span>');
document.documentElement.lang='th';

const attachmentInstruction=`ขั้นตอนตรวจข้อมูลและเอกสารก่อนวิเคราะห์
1. ให้อ่านข้อมูลที่ผู้ใช้กรอกและเอกสารแนบทั้งหมดก่อน
2. หากผู้ใช้มีเอกสาร ให้ดึงข้อมูลจากเอกสารมาใช้และห้ามถามข้อมูลที่พบแล้วซ้ำ
3. หากยังไม่มีเอกสาร ให้แจ้งว่าผู้ใช้สามารถแนบเอกสารที่เกี่ยวข้องในแชตนี้ได้ เช่น โครงการ ประมาณการค่าใช้จ่าย กำหนดการ ข้อบัญญัติงบประมาณ แผนงาน TOR หรือหลักฐานอื่น
4. หากข้อมูลสำคัญยังไม่ครบ ให้หยุดก่อนจัดทำผลลัพธ์ฉบับเต็ม แล้วแจ้งเฉพาะข้อมูลที่ขาด พร้อมระบุว่าสามารถกรอกเพิ่มเติมหรือแนบเอกสารใดแทนได้
5. เมื่อข้อมูลเพียงพอแล้ว จึงวิเคราะห์หรือจัดทำผลลัพธ์ตามภารกิจ
6. ห้ามสมมติข้อมูลที่ไม่มีในข้อความหรือเอกสารแนบ
7. หากเอกสารอ่านไม่ชัด ขัดแย้งกัน หรือไม่ใช่ฉบับปัจจุบัน ให้ระบุจุดที่ต้องยืนยันก่อนนำผลไปใช้
8. ก่อนแสดงข้อมูลจากเอกสาร ให้ตรวจและปกปิดข้อมูลส่วนบุคคล ข้อมูลอ่อนไหว และข้อมูลลับที่ไม่จำเป็น`;

function addAttachmentNotice(){
  const host=document.querySelector('.generator,form,#generatorForm');
  if(!host||document.querySelector('.gp-attachment-notice'))return;
  const note=document.createElement('aside');
  note.className='gp-safety gp-attachment-notice';
  note.setAttribute('role','note');
  note.innerHTML='<strong>📎 มีเอกสารประกอบ?</strong><br>สร้างและคัดลอก Prompt ไปวางใน ChatGPT ของท่าน แล้วแนบไฟล์ในแชตเดียวกันได้เลย AI จะอ่านเอกสารก่อนและถามเฉพาะข้อมูลที่ยังขาด<br><small>โปรดปกปิดข้อมูลส่วนบุคคล ข้อมูลอ่อนไหว หรือข้อมูลลับที่ไม่จำเป็นก่อนแนบ</small>';
  const actions=host.querySelector('.actions,button[type="submit"],#make');
  if(actions)actions.insertAdjacentElement('beforebegin',note);else host.appendChild(note);
}

function enhanceGeneratedPrompt(){
  const outputs=[document.getElementById('output'),document.getElementById('resultOutput')].filter(Boolean);
  outputs.forEach(output=>{
    const current=(output.textContent||'').trim();
    if(!current||current.includes('ขั้นตอนตรวจข้อมูลและเอกสารก่อนวิเคราะห์'))return;
    if(current.includes('Prompt ที่สร้าง')||current.includes('กรอกข้อมูลด้านซ้าย'))return;
    output.textContent=current+'\n\n'+attachmentInstruction;
    if(typeof generatedPrompt==='string'&&generatedPrompt.trim())generatedPrompt=output.textContent;
    if(typeof prompt==='string'&&prompt.trim())prompt=output.textContent;
  });
}

addAttachmentNotice();
document.addEventListener('click',e=>{if(e.target.closest('#make,button[type="submit"]'))setTimeout(enhanceGeneratedPrompt,0)});
document.addEventListener('submit',()=>setTimeout(enhanceGeneratedPrompt,0));
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')document.getElementById('make')?.click();if(e.key==='Escape'&&document.querySelector('.workspace:not(.hidden)'))document.querySelector('.close-button')?.click()});
window.addEventListener('unhandledrejection',()=>GP.toast('เกิดข้อขัดข้อง กรุณาลองใหม่อีกครั้ง'));
})();
