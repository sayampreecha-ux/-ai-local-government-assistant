// Gate production browser acceptance on bytes from this checkout's actual build.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='https://sayampreecha-ux.github.io/-ai-local-government-assistant/';
const paths=['index.html','assets/js/core/engineering-workflows-v1.js',
 'assets/js/core/output-router.js','assets/js/core/privacy-guard.js',
 'assets/js/core/prompt-orchestrator.js','assets/js/core/prompt-registry.js',
 'assets/js/core/shared-context.js','src/government-workflow-suite.js'];
const rows=await Promise.all(paths.map(async path=>{
 const expected=await readFile(new URL('../dist/'+path,import.meta.url));
 const response=await fetch(new URL(path,base),{cache:'no-store',signal:AbortSignal.timeout(30000)});
 assert.equal(response.ok,true,path+' HTTP '+response.status);
 const actual=Buffer.from(await response.arrayBuffer());
 assert.ok(actual.equals(expected),path+' production bytes differ from the approved build');
 return {path,sha256:createHash('sha256').update(actual).digest('hex'),bytes:actual.length};
}));
console.log(JSON.stringify({base,status:'PASS',assets:rows},null,2));
