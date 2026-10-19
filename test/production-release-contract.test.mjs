import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { committedAsset, RELEASE_VERSIONS } from '../scripts/release-versions.mjs';

test('built release satisfies the full surface verifier and rejects stale/tampered assets', async () => {
  const root=process.cwd(), fixture=await mkdtemp(join(tmpdir(),'govprompt-release-'));
  try {
    // Build in an isolated copy: other tests and source files remain untouched.
    const extensions=new Set(['.html','.htlm','.css','.js','.json','.webmanifest','.txt','.xml']);
    for(const entry of await readdir(root,{withFileTypes:true})) {
      if(entry.isFile() && extensions.has(extname(entry.name).toLowerCase()))
        await cp(join(root,entry.name),join(fixture,entry.name));
    }
    for(const dir of ['assets','access-system','Plain text','knowledge','src'])
      await cp(join(root,dir),join(fixture,dir),{recursive:true});
    await symlink(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
    execFileSync(process.execPath,[resolve('scripts/build-static.mjs')],{
      cwd:fixture,encoding:'utf8',stdio:'pipe',maxBuffer:4*1024*1024
    });
    const dist=join(fixture,'dist'), indexPath=join(dist,'index.html');
    const index=await readFile(indexPath,'utf8');
    assert.equal(RELEASE_VERSIONS.home,committedAsset('assets/js/home-v3.js').version);
    assert.ok(index.includes(committedAsset('assets/js/home-v3.js').path));

    // Built-artifact integration fixture, NOT live Production or Browser proof.
    // Fetch serves dist while executing every existing verifier assertion.
    const preload=[
      "import assert from 'node:assert/strict';",
      "import {readFile} from 'node:fs/promises';",
      "import {resolve,sep} from 'node:path';",
      "const root=resolve(process.env.GOVPROMPT_FIXTURE_ROOT);",
      "globalThis.fetch=async (url,options={})=>{",
      "const parsed=new URL(url), prefix='/-ai-local-government-assistant/';",
      "assert.equal(parsed.origin,'https://sayampreecha-ux.github.io');",
      "assert.ok(parsed.pathname.startsWith(prefix),'unexpected fixture request');",
      "assert.equal(options.headers['cache-control'],'no-cache, no-store');",
      "const path=resolve(root,decodeURIComponent(parsed.pathname.slice(prefix.length)) || 'index.html');",
      "assert.ok(path.startsWith(root+sep),'fixture path escapes artifact');",
      "const response=new Response(await readFile(path),{status:200,headers:{etag:'fixture-only'}});",
      "Object.defineProperty(response,'url',{value:parsed.href});",
      "return response;};"
    ].join('\n');
    const args=['--import','data:text/javascript;base64,'+Buffer.from(preload).toString('base64'),
      resolve('scripts/verify-frontend-production.mjs')];
    const run=()=>execFileSync(process.execPath,args,{
      cwd:root,encoding:'utf8',stdio:'pipe',maxBuffer:4*1024*1024,
      env:{...process.env,GOVPROMPT_FIXTURE_ROOT:dist,
        GOVPROMPT_FRONTEND_URL:'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html'}
    });
    const output=JSON.parse(run());
    assert.equal(output.release.home,RELEASE_VERSIONS.home);
    assert.equal(output.checks.privacyBoundary,'PASS');
    assert.equal(output.checks.releaseCacheBust,'PASS');
    assert.equal(output.checks.workflowRuntimeModules,'18 PASS');

    await writeFile(indexPath,index.replace(committedAsset('assets/js/home-v3.js').path,
      'assets/js/home-v3.js?v=0.0.0'));
    assert.throws(run,error=>{
      assert.match(String(error.stderr),/Home release mismatch/);
      return true;
    },'a stale Home URL must still block acceptance');
    await writeFile(indexPath,index);

    const bridgePath=join(dist,'assets/js/ui/quick-action-guided-bridge-v1.js');
    const bridge=await readFile(bridgePath,'utf8');
    await writeFile(bridgePath,bridge+'\n// unapproved artifact mutation\n');
    assert.throws(run,error=>{
      assert.match(String(error.stderr),/production quick-action bridge differs/);
      return true;
    },'same menu wording must not hide a changed source file');
  } finally {
    await rm(fixture,{recursive:true,force:true});
  }
});
