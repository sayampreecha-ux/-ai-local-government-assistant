// Safe negative-only tests; no sealed answer key or downstream AI credentials.
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const scripts=['tests/e2e/construction-blind-input-gate.mjs','tests/e2e/construction-trusted-numeric-executor.mjs'];
const dir=await mkdtemp(join(tmpdir(),'construction-negative-'));
try{
 const pdf=join(dir,'blind_input.pdf'),xlsx=join(dir,'blind_input_no_answer_key.xlsx');
 const pdfBytes=Buffer.from('%PDF-1.4\nsynthetic negative test only\n'.repeat(8));
 const xlsxBytes=Buffer.concat([Buffer.from('PK'),Buffer.alloc(256,1)]);
 await writeFile(pdf,pdfBytes);await writeFile(xlsx,xlsxBytes);
 const digest=b=>createHash('sha256').update(b).digest('hex');
 const valid={BLIND_PDF:pdf,BLIND_XLSX:xlsx,BLIND_PDF_SHA256:digest(pdfBytes),BLIND_XLSX_SHA256:digest(xlsxBytes)};
 let checks=0;
 for(const script of scripts){
  for(const [id,override] of [
   ['missing-input',{BLIND_PDF:''}],
   ['wrong-pdf-hash',{BLIND_PDF_SHA256:'0'.repeat(64)}],
   ['wrong-xlsx-hash',{BLIND_XLSX_SHA256:'0'.repeat(64)}],
   ['sealed-path',{BLIND_PDF:join(dir,'answer_key_sealed.pdf')}]
  ]){
   const r=spawnSync(process.execPath,[script],{env:{PATH:process.env.PATH,...valid,...override},encoding:'utf8',timeout:10000});
   assert.notEqual(r.status,0,script+' accepted '+id);
   checks++;console.log('PASS fail-closed',script,id);
  }
 }
 const missingExecutor=spawnSync(process.execPath,[scripts[1]],{env:{PATH:process.env.PATH,...valid},encoding:'utf8',timeout:10000});
 assert.notEqual(missingExecutor.status,0,'Executor accepted missing trusted executor');
 checks++;console.log('PASS fail-closed missing downstream executor');
 console.log('Construction trusted negative tests '+checks+'/'+checks+' PASS (synthetic input only; numeric execution NOT TESTED)');
}finally{await rm(dir,{recursive:true,force:true});}
