import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PROMPT_MASTER, PROMPT_COUNT } from '../lib/prompt-master.mjs';
import { assemblePrompt } from '../lib/prompt-assembler.mjs';

const entries = Object.values(PROMPT_MASTER);

test('catalog contains approved GP001-GP222 in order', () => {
  assert.equal(PROMPT_COUNT, 222);
  assert.equal(entries.length, 222);
  entries.forEach((tool, index) => {
    assert.equal(tool.code, `GP${String(index + 1).padStart(3, '0')}`);
    assert.equal(tool.approvalStatus, 'APPROVED');
    assert.ok(tool.name.length >= 4);
    assert.ok(tool.description.length >= 18);
    assert.ok(tool.formFields.length >= 4);
  });
});

test('all 222 prompts assemble deterministically from their forms', () => {
  for (const tool of entries) {
    const fields = Object.fromEntries(tool.formFields.map(field => [field.id, `ทดสอบ ${field.label}`]));
    const output = assemblePrompt(tool, fields, 'ภาษาราชการทดสอบ');
    assert.match(output, /GOVPROMPT THAILAND/);
    assert.match(output, new RegExp(tool.code));
    assert.match(output, /ห้ามสมมติ|ห้ามเดา/);
    assert.match(output, /ต้องตรวจสอบ/);
    assert.match(output, /ก่อนนำไปใช้จริง/);
    for (const value of Object.values(fields)) assert.ok(output.includes(value));
  }
});

test('generate endpoint has no OpenAI dependency or invocation', async () => {
  const source = await readFile(new URL('../api/generate.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from ["']openai["']/i);
  assert.doesNotMatch(source, /new OpenAI/i);
  assert.match(source, /usageCharged:\s*false/);
  assert.match(source, /generationMode:\s*"prompt"/);
});

test('GP001 retains fact-first official correspondence standard', () => {
  const tool = PROMPT_MASTER.gp001;
  assert.equal(tool.code, 'GP001');
  assert.equal(tool.name, 'AI ผู้ช่วยร่างหนังสือราชการ');
  assert.match(tool.masterPrompt, /ยึดข้อเท็จจริงเป็นหลัก/);
  assert.match(tool.masterPrompt, /Checklist ก่อนเสนอผู้บังคับบัญชาหรือลงนาม/);
});
