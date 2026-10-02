import { executeImageWorkflow, buildCreativeImagePrompt } from '../core/pr-image-workflow-v1.js?v=1.1.0';

function showToast(message) {
  if (window.GovPrompt?.toast) return window.GovPrompt.toast(message);
  const old = document.getElementById('gpPrImageToast'); old?.remove();
  const node = document.createElement('div'); node.id = 'gpPrImageToast'; node.textContent = message;
  Object.assign(node.style, { position:'fixed',left:'50%',bottom:'max(20px, env(safe-area-inset-bottom))',transform:'translateX(-50%)',background:'#10233f',color:'#fff',padding:'10px 14px',borderRadius:'999px',zIndex:'9999',maxWidth:'90vw',textAlign:'center' });
  document.body.append(node); setTimeout(() => node.remove(), 2400);
}
async function copyText(text) {
  const value=String(text||''); if(!value)return false;
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(value);return true;}catch{}}
  const area=document.createElement('textarea'); area.value=value; area.setAttribute('readonly',''); Object.assign(area.style,{position:'fixed',left:'-9999px',top:'0'}); document.body.append(area); area.select();
  let copied=false; try{copied=document.execCommand('copy');}catch{} area.remove(); return copied;
}
function installStyles(){
  if(document.getElementById('gpPrImageStyles'))return; const style=document.createElement('style'); style.id='gpPrImageStyles'; style.textContent=`
  .task.gp-pr-image-task{grid-column:1/-1;border-color:#c8d9ee;background:#f7fbff;font-weight:800}.gp-pr-image-task small{display:block;margin-top:3px;color:#52647b;font-weight:600}.gp-pr-image-studio{margin-top:16px;background:#fff;border:1px solid #dde6f0;border-radius:14px;padding:15px}.gp-pr-image-studio[hidden]{display:none!important}.gp-pr-image-intro{margin:3px 0 14px;color:#52647b}.gp-pr-image-flow{display:grid;gap:13px}.gp-pr-image-label{display:block;font-weight:800;margin-bottom:6px}.gp-pr-image-cta{width:100%;min-height:50px;font-size:1.04rem}.gp-pr-image-result{display:none;margin-top:14px;border:1px solid #dbe5ef;background:#f8fbff;border-radius:14px;padding:13px}.gp-pr-image-result.visible{display:block}.gp-pr-image-status{font-weight:800;margin:0 0 8px}.gp-pr-image-note{margin:5px 0;color:#52647b}.gp-pr-thai-text{white-space:pre-wrap;background:#fff;border:1px solid #dbe5ef;border-radius:10px;padding:10px;min-height:46px}.gp-pr-prompt-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.gp-pr-prompt-details{margin-top:10px}.gp-pr-prompt-details pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;background:#fff;border-radius:10px;padding:10px;border:1px solid #e1e8f0}.gp-pr-image-footnote{font-size:12px;color:#65758b;margin-top:10px}.gp-pr-simple-mode #tasks,.gp-pr-simple-mode #filter{display:none!important}.gp-pr-simple-mode .gp-pr-image-studio{margin-top:0}@media(max-width:650px){.task.gp-pr-image-task{grid-column:auto}.gp-pr-image-studio{padding:13px}.gp-pr-prompt-actions .btn{flex:1 1 150px}}`;
  document.head.append(style);
}
function createStudio(){
  const section=document.createElement('section'); section.id='gpPrImageStudio'; section.className='gp-pr-image-studio'; section.hidden=true; section.setAttribute('aria-labelledby','gpPrImageStudioTitle');
  section.innerHTML=`<strong id="gpPrImageStudioTitle">✨ ทำภาพประชาสัมพันธ์</strong><p class="gp-pr-image-intro">บอก GP สั้น ๆ ว่าอยากได้ภาพแบบไหน แล้วคัดลอกคำสั่งไปใช้ใน AI</p><div class="gp-pr-image-flow"><div><label class="gp-pr-image-label" for="gpPrImageRequest">อยากให้ทำอะไร?</label><textarea id="gpPrImageRequest" rows="3" maxlength="1000" placeholder="เช่น ทำภาพเกษียณให้สวยที่สุด อบอุ่น ภูมิฐาน"></textarea></div><button class="btn primary gp-pr-image-cta" id="gpPrMakeImage" type="button">✨ สร้างคำสั่ง</button></div><div class="gp-pr-image-result" id="gpPrImageResult" aria-live="polite"><p class="gp-pr-image-status">✅ คำสั่งพร้อมใช้</p><p class="gp-pr-image-note">คัดลอกไปวางใน AI ที่สร้างภาพได้ แล้วแนบภาพต้นฉบับที่ AI ปลายทางถ้ามี</p><p class="gp-pr-image-note" id="gpPrSizeNote"></p><div class="gp-pr-prompt-actions"><button class="btn primary" id="gpPrCopyPrompt" type="button">คัดลอกคำสั่ง</button><button class="btn secondary" id="gpPrOpenChatGPT" type="button">เปิด ChatGPT</button></div><details class="gp-pr-prompt-details" id="gpPrPromptDetails"><summary>ดูคำสั่ง</summary><pre id="gpPrImagePrompt"></pre></details></div><div class="gp-pr-image-footnote">ไม่ต้องแนบรูปใน GovPrompt · ถ้ามีรูป ให้แนบใน AI ปลายทาง</div>`; return section;
}
export function initializePRImageStudio(){
  if(document.getElementById('gpPrImageStudio'))return true; const tasksHost=document.getElementById('tasks'); const generator=document.querySelector('.generator'); if(!tasksHost||!generator)return false; installStyles();
  const legacyTasks=[...tasksHost.querySelectorAll('.task')]; const taskButton=document.createElement('button'); taskButton.type='button'; taskButton.className='task gp-pr-image-task'; taskButton.dataset.gpPrImageTask='true'; taskButton.innerHTML='✨ ทำภาพประชาสัมพันธ์ <small>บอกงาน → สร้างคำสั่ง → ไปทำใน AI</small>'; tasksHost.prepend(taskButton);
  const studio=createStudio(); generator.insertAdjacentElement('beforebegin',studio); const request=studio.querySelector('#gpPrImageRequest'); const make=studio.querySelector('#gpPrMakeImage'); const result=studio.querySelector('#gpPrImageResult'); let lastResult=null;
  function showLegacy(){document.body.classList.remove('gp-pr-simple-mode');studio.hidden=true;generator.hidden=false;taskButton.classList.remove('active');}
  legacyTasks.forEach(button=>button.addEventListener('click',showLegacy));
  taskButton.addEventListener('click',()=>{legacyTasks.forEach(button=>button.classList.remove('active'));taskButton.classList.add('active');generator.hidden=true;studio.hidden=false;document.body.classList.add('gp-pr-simple-mode');request.focus();studio.scrollIntoView({behavior:'smooth',block:'start'});});
  const filter=document.getElementById('filter'); filter?.addEventListener('input',()=>{const query=String(filter.value||'').toLocaleLowerCase('th-TH');taskButton.style.display=taskButton.innerText.toLocaleLowerCase('th-TH').includes(query)?'block':'none';});
  function renderPrompt(workflowResult){lastResult=workflowResult;const bundle=workflowResult.bundle;result.classList.add('visible');studio.querySelector('#gpPrImagePrompt').textContent=bundle.prompt;studio.querySelector('#gpPrSizeNote').textContent=`ขนาดแนะนำ: ${bundle.size.width}×${bundle.size.height} px (${bundle.size.ratio})`;studio.querySelector('#gpPrPromptDetails').open=false;}
  function runPromptWorkflow(){const userRequest=request.value.trim();if(!userRequest){showToast('บอก GP สั้น ๆ ว่าอยากให้ทำอะไร');request.focus();return;}renderPrompt(executeImageWorkflow({request:userRequest}));result.scrollIntoView({behavior:'smooth',block:'nearest'});}
  make.addEventListener('click',runPromptWorkflow); request.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();runPromptWorkflow();}});
  studio.querySelector('#gpPrCopyPrompt').addEventListener('click',async()=>showToast(await copyText(lastResult?.bundle?.prompt||'')?'คัดลอกคำสั่งแล้ว':'คัดลอกไม่สำเร็จ'));
  studio.querySelector('#gpPrOpenChatGPT').addEventListener('click',async()=>{if(!lastResult?.bundle?.prompt)return;const copied=await copyText(lastResult.bundle.prompt);if(!copied)return showToast('คัดลอกคำสั่งไม่สำเร็จ');window.open('https://chatgpt.com/','_blank','noopener,noreferrer');});
  window.GovPromptPRImageStudio=Object.freeze({buildPrompt:value=>buildCreativeImagePrompt({request:value}),run:value=>executeImageWorkflow({request:value})}); return true;
}
initializePRImageStudio(); if(new URLSearchParams(window.location.search).get('mode')==='image-prompt'){queueMicrotask(()=>document.querySelector('[data-gp-pr-image-task="true"]')?.click());}
