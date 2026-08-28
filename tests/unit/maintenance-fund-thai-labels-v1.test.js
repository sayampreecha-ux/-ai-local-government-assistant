import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const path = 'assets/js/features/maintenance-fund-thai-labels-v1.js';

test('maintenance-fund Thai label layer is valid JavaScript', () => {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('maintenance-fund primary navigation uses plain Thai wording', () => {
  const source = fs.readFileSync(path, 'utf8');
  for (const label of ['จัดทำแผน', 'ติดตามการใช้เงิน', 'ปรับแผน', 'ภาพรวม', 'เอกสารตรวจสอบ']) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /ขนาดเล็ก \(S\)/);
  assert.match(source, /ขนาดกลาง \(M\)/);
  assert.match(source, /ขนาดใหญ่ \(L\)/);
});
