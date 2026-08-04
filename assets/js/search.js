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
  if(requestedTask){
    try{if(typeof task!=='undefined')task=requestedTask}catch(e){}
    const selected=document.getElementById('selected');
    if(selected)selected.textContent='งานที่ AI แนะนำ: '+requestedTask;
    const matched=[...document.querySelectorAll('.task')].find(x=>(x.dataset.task||'')===requestedTask);
    if(matched){document.querySelectorAll('.task').forEach(x=>x.classList.remove('active'));matched.classList.add('active')}
  }
  const preferred=['question','facts','risk','need','objective','subject','detail','details','topic','item','tor','reference'];
  let target=null;
  for(const id of preferred){const el=document.getElementById(id);if(el&&/^(INPUT|TEXTAREA)$/.test(el.tagName)&&!el.value){target=el;break}}
  if(!target)target=[...document.querySelectorAll('.generator textarea,.generator input:not(.search)')].find(el=>!el.value);
  if(target){target.value=q;target.dispatchEvent(new Event('input',{bubbles:true}));target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.focus(),350)}
  const note=document.querySelector('.generator .note');
  if(note){const msg=document.createElement('div');msg.className='gp-draft';msg.textContent='✨ AI คัดแยกเรื่องและนำคำถามมาใส่ให้แล้ว กรุณาตรวจข้อมูลและเติมรายละเอียดก่อนสร้าง Prompt';note.before(msg)}
}
})();
