(()=>{'use strict';
const input=document.getElementById('filter');
if(input){
  const items=[...document.querySelectorAll('.task')];
  const run=()=>{
    const q=input.value.trim().toLocaleLowerCase('th');let shown=0;
    items.forEach(item=>{const hit=!q||item.textContent.toLocaleLowerCase('th').includes(q);item.hidden=!hit;if(hit)shown++});
    input.setAttribute('aria-label','ค้นหาประเภทงาน');input.setAttribute('aria-describedby','gp-search-count');
    let count=document.getElementById('gp-search-count');
    if(!count){count=document.createElement('div');count.id='gp-search-count';count.className='gp-draft';input.after(count)}
    count.textContent=`พบ ${shown} งาน`;
  };
  input.addEventListener('input',run);run();
}
const params=new URLSearchParams(location.search);
const q=params.get('q');
const requestedTask=params.get('task');
if(q){
  const generatorFields=[...document.querySelectorAll('.generator input:not(.search),.generator textarea,.generator select')];
  const draftKey=`govprompt:r2:${location.pathname}`;
  try{localStorage.removeItem(draftKey)}catch{}
  generatorFields.forEach(el=>{el.value='';el.dispatchEvent(new Event('input',{bubbles:true}))});
  const output=document.getElementById('output');if(output){output.textContent='';output.style.display='none'}
  document.querySelectorAll('.gp-query-note').forEach(el=>el.remove());
  if(requestedTask){
    try{if(typeof task!=='undefined')task=requestedTask}catch(e){}
    const selected=document.getElementById('selected');
    if(selected)selected.textContent='งานที่ AI แนะนำ: '+requestedTask;
    const matched=[...document.querySelectorAll('.task')].find(x=>(x.dataset.task||'')===requestedTask);
    if(matched){document.querySelectorAll('.task').forEach(x=>x.classList.remove('active'));matched.classList.add('active')}
  }
  const routeTargets={
    'gp001.html':'facts','gp002.html':'facts','gp003.html':'need','gp004.html':'problem',
    'gp005.html':'facts','gp006.html':'facts','gp007.html':'facts','gp008.html':'facts',
    'gp009.html':'facts','gp010.html':'facts','gp011.html':'facts','gp012.html':'facts'
  };
  const page=location.pathname.split('/').pop()||'';
  let target=document.getElementById(routeTargets[page]||'facts');
  if(!target||!/^(INPUT|TEXTAREA)$/.test(target.tagName))target=generatorFields.find(el=>/^(INPUT|TEXTAREA)$/.test(el.tagName));
  if(target){target.value=q;target.dispatchEvent(new Event('input',{bubbles:true}));target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.focus(),350)}
  const note=document.querySelector('.generator .note');
  if(note){const msg=document.createElement('div');msg.className='gp-draft gp-query-note';msg.textContent='✨ เริ่มเรื่องใหม่แล้ว — AI นำคำถามมาใส่ในช่องหลักเพียงจุดเดียว กรุณาตรวจและเติมรายละเอียดก่อนสร้าง Prompt';note.before(msg)}
  try{history.replaceState({},'',location.pathname+location.hash)}catch{}
}
})();
