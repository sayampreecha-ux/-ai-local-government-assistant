import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [home, bridge, css, index] = await Promise.all([
  readFile('assets/js/home-v3.js', 'utf8'),
  readFile('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8'),
  readFile('assets/css/home-v3.css', 'utf8'),
  readFile('index.html', 'utf8')
]);

test('catalog tasks navigate to a dedicated result route', () => {
  assert.match(bridge, /sessionStorage\.setItem\(RESULT_PROMPT_KEY, value\)/);
  assert.match(bridge, /searchParams\.set\('view', 'result'\)/);
  assert.match(bridge, /window\.location\.assign\(target\.toString\(\)\)/);
});

test('result route consumes the selected prompt and provides a clear return path', () => {
  assert.match(home, /sessionStorage\.getItem\(resultPromptKey\)/);
  assert.match(home, /className = 'result-page-header'/);
  assert.match(home, /← เลือกงานอื่น/);
  assert.match(css, /html\.result-route \.quick-actions[^}]*display:none!important/s);
  assert.match(css, /html\.result-route \.composer-region[^}]*display:none!important/s);
  assert.match(index, /documentElement\.classList\.add\('result-route'\)/);
});
