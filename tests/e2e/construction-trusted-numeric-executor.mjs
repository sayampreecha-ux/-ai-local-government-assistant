// Trusted operator-only numeric execution wrapper. NEVER invoke with PR CI credentials.
// No answer key or QA_Gates are accepted as inputs. The downstream command is
// supplied by an operator-controlled environment, not a pull request.
import { readFile, writeFile, mkdir, stat, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve, basename } from 'node:path';
import assert from 'node:assert/strict';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const pdf=process.env.BLIND_PDF, xlsx=process.env.BLIND_XLSX;
const promptFile=process.env.ACTUAL_PROMPT_FILE;
const command=process.env.TRUSTED_NUMERIC_EXECUTOR;
const expected=[['blind_input.pdf',pdf,process.env.BLIND_PDF_SHA256,'%PDF-'],
 ['blind_input_no_answer_key.xlsx',xlsx,process.env.BLIND_XLSX_SHA256,'PK']];
for(const [name,p,digest,magic] of expected){
 assert.ok(p && /^[0-9a-f]{64}$/i.test(digest||''),'Missing path/hash: '+name);
 const real=await realpath(resolve(p));
 assert.equal(basename(real),name);
 assert.ok(!/answer_key|sealed|qa_gates/i.test(real),'Forbidden evidence path');
 const info=await stat(real);assert.ok(info.isFile() && info.size>100 && info.size<25e6);
 const bytes=await readFile(real);assert.equal(bytes.subarray(0,magic.length).toString(),magic);
 assert.equal(sha(bytes),digest.toLowerCase(),'SHA mismatch: '+name);
}
assert.ok(promptFile && command,'Actual Prompt and operator-approved executor required');
const promptPath=await realpath(resolve(promptFile));
assert.ok(!/answer_key|sealed|qa_gates/i.test(promptPath));
const prompt=await readFile(promptPath);
assert.ok(prompt.length>100,'Missing actual prompt');
const dir=resolve(process.env.EVIDENCE_OUT||'numeric-evidence');
await mkdir(dir,{recursive:true,mode:0o700});
const output=dir+'/actual-numeric-output.json';
const manifest=dir+'/evidence-manifest.json';
const argv=JSON.parse(process.env.TRUSTED_NUMERIC_ARGS_JSON||'[]');
assert.ok(Array.isArray(argv)&&argv.every(x=>typeof x==='string'));
assert.ok(command.startsWith('/'),'Executor must be an absolute operator-controlled path');
const result=await new Promise((done,reject)=>{
 const child=spawn(command,argv,{env:{PATH:'/usr/bin:/bin',BLIND_PDF:pdf,BLIND_XLSX:xlsx,ACTUAL_PROMPT_FILE:promptPath},stdio:['ignore','pipe','pipe'],timeout:180000});
 const stdout=[],stderr=[];let size=0;
 child.stdout.on('data',b=>{size+=b.length;if(size>2e6)child.kill();else stdout.push(b)});
 child.stderr.on('data',b=>stderr.push(b));
 child.on('error',reject);
 child.on('close',(code,signal)=>done({code,signal,stdout:Buffer.concat(stdout),stderr:Buffer.concat(stderr).toString().slice(0,2000)}));
});
assert.equal(result.code,0,'Executor failed (no numeric acceptance)');
const actual=JSON.parse(result.stdout.toString('utf8'));
assert.ok(actual && typeof actual==='object' && !Array.isArray(actual),'Numeric output must be JSON object');
assert.ok(actual.tables && ['A','B','C','D'].every(k=>Array.isArray(actual.tables[k])),'A-D numeric tables required');
assert.ok(actual.decisionLock!==undefined,'Decision Lock required');
const actualBytes=Buffer.from(JSON.stringify(actual,null,2)+'\n');
await writeFile(output,actualBytes,{flag:'wx',mode:0o600});
const evidence={schemaVersion:1,status:'ACTUAL_CAPTURED_NOT_GRADED',sourceCommit:process.env.REVIEWED_SHA||'UNVERIFIED',
 inputSha256:Object.fromEntries(expected.map(([name,,digest])=>[name,digest.toLowerCase()])),
 promptSha256:sha(prompt),actualOutputSha256:sha(actualBytes),actualOutputFile:'actual-numeric-output.json',
 answerKeyAccess:'PROHIBITED',qaGatesAccess:'PROHIBITED',numericVerdict:'NOT GRADED'};
await writeFile(manifest,JSON.stringify(evidence,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({status:evidence.status,actualOutputSha256:evidence.actualOutputSha256,manifestSha256:sha(await readFile(manifest))}));
console.log('Operator must seal/lock this directory in immutable trusted storage BEFORE a separate verifier accesses answer key.');
