import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { performance } from 'node:perf_hooks';
const context = { window: {}, URL };
runInNewContext(readFileSync(new URL('../assets/js/core/circular-watch-registry.js', import.meta.url),'utf8'),context);
const { createCircularRegistry } = context.window.GovPromptCore.CircularWatch;
const records = Array.from({length:50000},(_,i)=>({
  id:'synthetic-'+i,documentTitle:'Synthetic test record '+i,documentNumber:'TEST/'+i,
  issuingAgency:'Synthetic Test Agency',sourceUrl:'https://example.go.th/test',
  documentDate:'2026-01-01',keywords:['synthetic','test'],status:'unknown'
}));
const start = performance.now(), registry = createCircularRegistry(records);
const buildMs = performance.now()-start;
function measure(fn) {
  const samples=[];
  for(let i=0;i<50;i++){const t=performance.now();fn();samples.push(performance.now()-t);}
  samples.sort((a,b)=>a-b);
  return {p50Ms:+samples[24].toFixed(2),p95Ms:+samples[47].toFixed(2),maxMs:+samples[49].toFixed(2)};
}
const exact = measure(()=>registry.search('TEST/49999',{limit:20}));
const keyword = measure(()=>registry.search('Synthetic',{limit:20}));
const report={environment:{node:process.version,platform:process.platform,arch:process.arch},
  data:'SYNTHETIC_ONLY',records:50000,buildMs:+buildMs.toFixed(2),exact,keyword,
  thresholds:{exactP95Ms:500,keywordP95Ms:1000},
  passes:{exact:exact.p95Ms<500,keyword:keyword.p95Ms<1000}};
console.log(JSON.stringify(report,null,2));
if (!report.passes.exact || !report.passes.keyword) process.exitCode=1;
