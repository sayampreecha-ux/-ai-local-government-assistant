import {readFile,access} from 'node:fs/promises';
const pages=['index.html',...Array.from({length:12},(_,i)=>`gp${String(i+1).padStart(3,'0')}.html`),'privacy.html','terms.html'];
const assets=['assets/css/govprompt.css','assets/js/govprompt.js','assets/js/prompt-engine.js','assets/js/search.js','assets/js/mic.js'];
for(const file of [...pages,...assets])await access(file);
for(const file of pages){const html=await readFile(file,'utf8');if(!/<html[^>]+lang="th"/i.test(html))throw new Error(`${file}: missing Thai language`);if(!/<meta[^>]+viewport/i.test(html))throw new Error(`${file}: missing viewport`)}
for(const file of pages){const html=await readFile(file,'utf8');const links=[...html.matchAll(/(?:href|src)="([^"#?]+)"/g)].map(x=>x[1]).filter(x=>!/^https?:|^mailto:|^tel:|^data:/.test(x));for(const link of links){if(link==='/'||link.startsWith('../'))continue;await access(link).catch(()=>{throw new Error(`${file}: broken local reference ${link}`)})}}
for(let i=1;i<=12;i++){const file=`gp${String(i).padStart(3,'0')}.html`;const html=await readFile(file,'utf8');for(const asset of assets){const rel=asset.replace('assets/','assets/');if(!html.includes(rel))throw new Error(`${file}: missing ${rel}`)}if(!html.includes('สร้าง Prompt'))throw new Error(`${file}: missing generator`)}
const index=await readFile('index.html','utf8');for(let i=1;i<=12;i++){const page=`gp${String(i).padStart(3,'0')}.html`;if(!index.includes(page))throw new Error(`index: missing ${page}`)}
console.log(`GovPrompt Thailand Release 2.0 validated: ${pages.length} pages, 12 assistants, ${assets.length} shared assets`);
