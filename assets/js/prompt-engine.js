(()=>{'use strict';
const root=document.querySelector('.generator');if(!root)return;
const fields=[...root.querySelectorAll('input:not(.search),textarea,select')];
const storageKey=`govprompt:r2:${location.pathname}`;
const panel=document.createElement('div');panel.className='gp-safety';panel.setAttribute('role','status');panel.textContent='🔒 ระบบตรวจข้อมูลส่วนบุคคลเบื้องต้น — โปรดหลีกเลี่ยงเลขบัตรประชาชน เบอร์โทร เลขบัญชี และข้อมูลสุขภาพที่ไม่จำเป็น';
root.insertBefore(panel,root.querySelector('.actions'));
const draft=document.createElement('div');draft.className='gp-draft';draft.textContent='ร่างจะถูกบันทึกไว้เฉพาะในอุปกรณ์นี้';panel.after(draft);
const scan=()=>{const text=fields.map(x=>x.value||'').join(' ');const flags=[];if(/\b\d{13}\b/.test(text))flags.push('เลข 13 หลัก');if(/(?:\+66|0)\d{8,9}\b/.test(text))flags.push('เบอร์โทร');if(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(text))flags.push('อีเมล');if(/(?:เลขบัญชี|พร้อมเพย์|โรค|ผลตรวจ|ข้อมูลสุขภาพ)/i.test(text))flags.push('ข้อมูลอ่อนไหว');panel.dataset.level=flags.length?'warn':'';panel.textContent=flags.length?`⚠️ พบข้อมูลที่ควรตรวจและปกปิดถ้าไม่จำเป็น: ${flags.join(', ')}`:'✅ ไม่พบรูปแบบข้อมูลส่วนบุคคลที่ระบบตรวจจับได้ชัดเจน — ยังต้องตรวจทานด้วยตนเอง';return flags};
let timer;fields.forEach((field,i)=>{field.dataset.gpKey=field.id||field.name||String(i);field.addEventListener('input',()=>{scan();clearTimeout(timer);timer=setTimeout(()=>{const data={};fields.forEach(x=>data[x.dataset.gpKey]=x.value);localStorage.setItem(storageKey,JSON.stringify(data));draft.textContent=`บันทึกร่างอัตโนมัติแล้ว ${new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}`},350)})});
try{const data=JSON.parse(localStorage.getItem(storageKey)||'{}');fields.forEach(x=>{if(data[x.dataset.gpKey]&&!x.value)x.value=data[x.dataset.gpKey]});if(Object.keys(data).length)draft.textContent='กู้คืนร่างล่าสุดจากอุปกรณ์นี้แล้ว'}catch{}
scan();
document.getElementById('clear')?.addEventListener('click',()=>localStorage.removeItem(storageKey),true);
document.getElementById('copy')?.addEventListener('click',async e=>{const out=document.getElementById('output');if(!out?.textContent)return;e.preventDefault();e.stopImmediatePropagation();try{await navigator.clipboard.writeText(out.textContent)}catch{const ta=document.createElement('textarea');ta.value=out.textContent;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}window.GovPrompt?.toast('คัดลอก Prompt แล้ว')},true);
})();
