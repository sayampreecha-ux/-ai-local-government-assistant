// Fail-closed intake. Run only on a trusted, isolated runner with files staged out of repository.
import { readFile, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, resolve } from 'node:path';
import assert from 'node:assert/strict';
const inputs = [
  ['BLIND_PDF','BLIND_PDF_SHA256','blind_input.pdf','%PDF-'],
  ['BLIND_XLSX','BLIND_XLSX_SHA256','blind_input_no_answer_key.xlsx','PK']
];
for (const [key,hashKey,name,magic] of inputs) {
  const supplied=process.env[key], expected=process.env[hashKey];
  assert.ok(supplied && /^[a-f0-9]{64}$/i.test(expected||''),key+' path and SHA256 required');
  const path=await realpath(resolve(supplied));
  assert.equal(basename(path),name,'Unexpected filename');
  assert.ok(!/answer_key|sealed|qa_gates/i.test(path),'Sealed evidence path forbidden');
  const metadata=await stat(path);
  assert.ok(metadata.isFile() && metadata.size>100 && metadata.size<25*1024*1024,'Unexpected size');
  const bytes=await readFile(path);
  assert.equal(bytes.subarray(0,magic.length).toString(),magic,'Invalid signature');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.toLowerCase(),'SHA256 mismatch');
  console.log(name+' verified, SHA256 '+expected.toLowerCase());
}
console.log('Blind input integrity PASS; document parsing and downstream numeric execution NOT TESTED');
