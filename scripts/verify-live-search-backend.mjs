import assert from 'node:assert/strict';
import worker from '../src/search-worker-v2.js';

const FRONTEND_ORIGIN = 'https://sayampreecha-ux.github.io';
const SECURITY_POLICY_VERSION = '2026-08-25.document-studio-v1';
let lastAssetUrl = '';
const assets = { fetch: async request => { lastAssetUrl=String(request.url); return new Response('asset',{status:200}); } };

function request(path, body, origin=FRONTEND_ORIGIN) {
  return new Request(`https://example.test${path}`,{ method:'POST', headers:{'content-type':'application/json',origin}, body:JSON.stringify(body) });
}

const noKey = await worker.fetch(request('/api/official-search',{query:'ระเบียบค่าเดินทางล่าสุด'}),{ASSETS:assets});
assert.equal(noKey.status,503); assert.equal(noKey.headers.get('x-govprompt-security'),SECURITY_POLICY_VERSION); assert.equal((await noKey.json()).error,'SEARCH_PROVIDER_NOT_CONFIGURED');
const noDocumentKey = await worker.fetch(request('/api/official-document',{url:'https://dla.go.th/'}),{ASSETS:assets});
assert.equal(noDocumentKey.status,503); assert.equal((await noDocumentKey.json()).error,'DOCUMENT_EXTRACT_PROVIDER_NOT_CONFIGURED');

for (const path of ['/api/official-search','/api/official-document','/api/document-studio/convert','/api/document-studio/compose']) {
  const preflight = await worker.fetch(new Request(`https://example.test${path}`,{method:'OPTIONS',headers:{origin:FRONTEND_ORIGIN}}),{ASSETS:assets});
  assert.equal(preflight.status,204); assert.equal(preflight.headers.get('access-control-allow-origin'),FRONTEND_ORIGIN); assert.equal(preflight.headers.get('x-govprompt-security'),SECURITY_POLICY_VERSION); assert.equal(preflight.headers.get('cache-control'),'no-store');
}
for (const path of ['/api/official-search','/api/official-document']) {
  const badOrigin = await worker.fetch(request(path,path.endsWith('search')?{query:'ทดสอบ'}:{url:'https://dla.go.th/'},'https://evil.example'),{ASSETS:assets});
  assert.equal(badOrigin.status,403); assert.equal((await badOrigin.json()).error,'ORIGIN_NOT_ALLOWED');
}

const sensitiveMarker='1234567890123';
const sensitive=await worker.fetch(request('/api/official-search',{query:`เลขบัตร ${sensitiveMarker} ตรวจสิทธิ`}),{ASSETS:assets,TAVILY_API_KEY:'unused'});
assert.equal(sensitive.status,422); const sensitiveBody=await sensitive.json(); assert.equal(sensitiveBody.error,'SENSITIVE_QUERY_BLOCKED'); assert.equal(JSON.stringify(sensitiveBody).includes(sensitiveMarker),false);
const invalidDocument=await worker.fetch(request('/api/official-document',{url:'https://example.com/file.pdf'}),{ASSETS:assets,TAVILY_API_KEY:'unused'});
assert.equal(invalidDocument.status,422); assert.equal((await invalidDocument.json()).error,'OFFICIAL_HTTPS_URL_REQUIRED');

const rateLimited=await worker.fetch(request('/api/official-search',{query:'ระเบียบค่าเดินทาง'}),{ASSETS:assets,OFFICIAL_SEARCH_RATE_LIMITER:{limit:async()=>({success:false})}});
assert.equal(rateLimited.status,429); assert.equal(rateLimited.headers.get('retry-after'),'60');

const originalFetch=globalThis.fetch;
let providerCalls=[];
globalThis.fetch=async (url,options={})=>{
  providerCalls.push({url:String(url),options});
  if (String(url).includes('/search')) return new Response(JSON.stringify({results:[
    {title:'อบจ.พะเยา งบประมาณ',url:'https://www.py-pao.go.th/budget.pdf',content:'ต้นฉบับ อบจ.พะเยา',published_date:'2026-08-14T00:00:00Z'},
    {title:'กรมบัญชีกลาง',url:'https://www.cgd.go.th/example',content:'ต้นฉบับกรมบัญชีกลาง',published_date:'2026-08-07T00:00:00Z'},
    {title:'เว็บภายนอก',url:'https://example.com/summary',content:'ต้องกรอง'}
  ]}),{status:200,headers:{'content-type':'application/json'}});
  if (String(url).includes('/extract')) return new Response(JSON.stringify({results:[{url:'https://www.py-pao.go.th/budget.pdf',raw_content:'ข้อบัญญัติงบประมาณรายจ่าย ประจำปีงบประมาณ พ.ศ. 2569\nงบบุคลากร 250,000,000 บาท\nงบลงทุน 320,000,000 บาท\nรวมรายจ่ายทั้งสิ้น 570,000,000 บาท'}],request_id:'req-1',response_time:0.1}),{status:200,headers:{'content-type':'application/json'}});
  throw new Error('unexpected-provider-url');
};
try {
  const live=await worker.fetch(request('/api/official-search',{query:'อบจ.พะเยา ข้อบัญญัติงบประมาณ 2569',count:10}),{ASSETS:assets,TAVILY_API_KEY:'test-secret',OFFICIAL_SEARCH_RATE_LIMITER:{limit:async()=>({success:true})}});
  assert.equal(live.status,200); const liveBody=await live.json(); assert.equal(liveBody.provider,'tavily'); assert.equal(liveBody.results.length,2); assert.ok(liveBody.results.every(row=>row.sourceTier==='primary')); assert.ok(liveBody.results.some(row=>row.host==='py-pao.go.th')); assert.equal(JSON.stringify(liveBody).includes('test-secret'),false); assert.equal('query' in liveBody,false);
  const searchProvider=providerCalls.find(call=>call.url.includes('/search')); assert.equal(searchProvider.options.headers.authorization,'Bearer test-secret'); const searchPayload=JSON.parse(searchProvider.options.body); assert.equal(searchPayload.include_answer,false); assert.equal(searchPayload.include_raw_content,false); assert.equal('include_domains' in searchPayload,false);

  const extracted=await worker.fetch(request('/api/official-document',{url:'https://www.py-pao.go.th/budget.pdf'}),{ASSETS:assets,TAVILY_API_KEY:'test-secret',OFFICIAL_SEARCH_RATE_LIMITER:{limit:async()=>({success:true})}});
  assert.equal(extracted.status,200); const extractedBody=await extracted.json(); assert.equal(extractedBody.provider,'tavily-extract'); assert.equal(extractedBody.sourceUrl,'https://www.py-pao.go.th/budget.pdf'); assert.equal(extractedBody.resolvedUrl,'https://www.py-pao.go.th/budget.pdf'); assert.match(extractedBody.contentHash,/^[a-f0-9]{64}$/); assert.match(extractedBody.rawContent,/570,000,000/); assert.equal(extractedBody.governance.searchSnippetNotUsedAsDocumentContent,true);
} finally { globalThis.fetch=originalFetch; }

const aiCalls=[];
const fakeAI={
  toMarkdown:async input=>{ aiCalls.push({type:'convert',input}); return {format:'markdown',data:'# รายงานทดสอบ\nงบประมาณ 500,000 บาท\nกำหนดส่ง 30 กันยายน 2569',tokens:32,mimetype:'application/pdf'}; },
  run:async (model,payload)=>{ aiCalls.push({type:'compose',model,payload}); return {response:{title:'รายงานทดสอบ',summary:'สรุปสาระสำคัญ',sections:[{heading:'สาระสำคัญ',paragraphs:['งบประมาณ 500,000 บาท'],bullets:[]}],actionItems:[{task:'ดำเนินการตามแผน',owner:'',due:'30 กันยายน 2569'}],slides:[]}}; }
};
const limiter={limit:async()=>({success:true})};
const form=new FormData(); form.append('privacyConfirmed','yes'); form.append('file',new File(['mock-pdf'],'รายงาน.pdf',{type:'application/pdf'}));
const converted=await worker.fetch(new Request('https://example.test/api/document-studio/convert',{method:'POST',headers:{origin:FRONTEND_ORIGIN},body:form}),{AI:fakeAI,ASSETS:assets,OFFICIAL_SEARCH_RATE_LIMITER:limiter});
assert.equal(converted.status,200); const convertedBody=await converted.json(); assert.equal(convertedBody.provider,'cloudflare-workers-ai-toMarkdown'); assert.match(convertedBody.markdown,/500,000/); assert.match(convertedBody.contentHash,/^[a-f0-9]{64}$/); assert.equal(convertedBody.governance.rawDocumentNotPersistedByGovPrompt,true);

const composed=await worker.fetch(request('/api/document-studio/compose',{mode:'meeting',text:convertedBody.markdown,filename:'รายงาน.pdf',privacyConfirmed:true}),{AI:fakeAI,ASSETS:assets,OFFICIAL_SEARCH_RATE_LIMITER:limiter});
assert.equal(composed.status,200); const composedBody=await composed.json(); assert.equal(composedBody.document.title,'รายงานทดสอบ'); assert.equal(composedBody.document.actionItems[0].due,'30 กันยายน 2569'); assert.equal(composedBody.governance.promptInjectionTreatedAsDocumentData,true); assert.equal(composedBody.governance.humanReviewRequired,true); assert.equal(aiCalls.some(call=>call.type==='convert'),true); assert.equal(aiCalls.some(call=>call.type==='compose'),true);

const noConsentForm=new FormData(); noConsentForm.append('file',new File(['x'],'รายงาน.pdf',{type:'application/pdf'}));
const noConsent=await worker.fetch(new Request('https://example.test/api/document-studio/convert',{method:'POST',headers:{origin:FRONTEND_ORIGIN},body:noConsentForm}),{AI:fakeAI,ASSETS:assets});
assert.equal(noConsent.status,428); assert.equal((await noConsent.json()).error,'PRIVACY_CONFIRMATION_REQUIRED');

const sensitiveAI={toMarkdown:async()=>({format:'markdown',data:'เลขบัตร 1234567890123',tokens:4,mimetype:'application/pdf'}),run:fakeAI.run};
const sensitiveForm=new FormData(); sensitiveForm.append('privacyConfirmed','yes'); sensitiveForm.append('file',new File(['x'],'ลับ.pdf',{type:'application/pdf'}));
const sensitiveDocument=await worker.fetch(new Request('https://example.test/api/document-studio/convert',{method:'POST',headers:{origin:FRONTEND_ORIGIN},body:sensitiveForm}),{AI:sensitiveAI,ASSETS:assets});
assert.equal(sensitiveDocument.status,422); const sensitiveDocumentBody=await sensitiveDocument.json(); assert.equal(sensitiveDocumentBody.error,'SENSITIVE_DOCUMENT_BLOCKED'); assert.equal(JSON.stringify(sensitiveDocumentBody).includes('1234567890123'),false);

const accessEnv={ ASSETS:assets, ACCESS_CODE_SECRET:'local-test-code-key', ACCESS_ADMIN_PASSWORD_HASH:'', ACCESS_ADMIN_SESSION_SECRET:'local-test-session-key' };
const testPassword='local-test-password';
const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(testPassword)); accessEnv.ACCESS_ADMIN_PASSWORD_HASH=[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
const login=await worker.fetch(new Request('https://example.test/api/access/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:testPassword})}),accessEnv);
assert.equal(login.status,200); const loginBody=await login.json(); assert.equal(typeof loginBody.token,'string');
const issue=await worker.fetch(new Request('https://example.test/api/access/admin/issue',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${loginBody.token}`},body:JSON.stringify({serial:'0001'})}),accessEnv);
assert.equal(issue.status,200); const issueBody=await issue.json(); assert.match(issueBody.code,/^GP69-0001-[A-F0-9]{8}$/);
const valid=await worker.fetch(new Request('https://example.test/api/access/validate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:issueBody.code})}),accessEnv);
assert.equal(valid.status,200); assert.deepEqual(await valid.json(),{ok:true});

const root=await worker.fetch(new Request('https://example.test/'),{ASSETS:assets}); assert.equal(root.status,200); assert.equal(await root.text(),'asset'); assert.equal(new URL(lastAssetUrl).pathname,'/index.html');
const fallback=await worker.fetch(new Request('https://example.test/'),{}); assert.equal(fallback.status,404);
console.log('GovPrompt v7 Worker v2 verification passed: official search/extraction, Document Studio convert/compose, privacy, rate-limit, access delegation and asset fallback.');
