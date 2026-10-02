(() => {
  'use strict';

  const HEADING_ID = 'publicHealthOtherToolsHeading';
  const STATIC_MOSQUITO_ID = 'mosquitoOnepageTask';

  function ensureHeading(tasks) {
    let heading = document.getElementById(HEADING_ID);
    if (heading) return heading;
    heading = document.createElement('div');
    heading.id = HEADING_ID;
    heading.textContent = 'อื่นๆ';
    heading.setAttribute('role', 'heading');
    heading.setAttribute('aria-level', '2');
    Object.assign(heading.style, {
      gridColumn: '1 / -1',
      marginTop: '8px',
      paddingTop: '10px',
      borderTop: '1px solid #e0e7f0',
      fontWeight: '800',
      color: '#0b3b75'
    });
    return heading;
  }

  function resolveMosquitoEntry(tasks) {
    const staticEntry = document.getElementById(STATIC_MOSQUITO_ID);
    const dynamicEntry = [...tasks.querySelectorAll('.mosq-task')].find(node => node !== staticEntry) || null;

    // GP008 now carries a permanent HTML entry so the tool is visible even if
    // feature bootstrap fails. Keep only one visible entry to preserve task count.
    if (staticEntry && dynamicEntry) dynamicEntry.remove();
    return staticEntry || dynamicEntry;
  }

  function placePublicHealthOtherTools() {
    const tasks = document.getElementById('tasks');
    if (!tasks) return false;
    const heading = ensureHeading(tasks);
    const buttons = [
      tasks.querySelector('.health-worker-toolkit-task'),
      resolveMosquitoEntry(tasks)
    ].filter(Boolean);
    if (!buttons.length) return false;

    const expected = [heading, ...buttons];
    const children = [...tasks.children];
    const start = children.indexOf(heading);
    const alreadyGrouped = start >= 0 && expected.every((node, index) => children[start + index] === node) && start + expected.length === children.length;
    if (!alreadyGrouped) tasks.append(heading, ...buttons);
    return true;
  }

  function init() {
    const tasks = document.getElementById('tasks');
    if (!tasks) return;
    placePublicHealthOtherTools();
    const observer = new MutationObserver(() => placePublicHealthOtherTools());
    observer.observe(tasks, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
