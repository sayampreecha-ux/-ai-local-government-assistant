(()=>{'use strict';
const GP=window.GovPrompt=window.GovPrompt||{};
GP.version='2.0.0';
GP.toast=message=>{let el=document.querySelector('.gp-toast');if(!el){el=document.createElement('div');el.className='gp-toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=message;el.classList.add('show');clearTimeout(GP.toastTimer);GP.toastTimer=setTimeout(()=>el.classList.remove('show'),2200)};
const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
if(main){const skip=document.createElement('a');skip.className='gp-skip';skip.href='#main-content';skip.textContent='ข้ามไปยังเนื้อหาหลัก';document.body.prepend(skip)}
const brand=document.querySelector('.bar b,.brand b');if(brand&&!document.querySelector('.gp-release-badge'))brand.insertAdjacentHTML('afterend','<span class="gp-release-badge">Release 2.0</span>');
document.documentElement.lang='th';
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')document.getElementById('make')?.click();if(e.key==='Escape'&&document.querySelector('.workspace:not(.hidden)'))document.querySelector('.close-button')?.click()});
window.addEventListener('unhandledrejection',()=>GP.toast('เกิดข้อขัดข้อง กรุณาลองใหม่อีกครั้ง'));
})();
