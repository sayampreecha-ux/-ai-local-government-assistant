(() => {
  'use strict';

  const HEADING_ID = 'publicHealthOtherToolsHeading';

  function placeMosquitoEntry() {
    const tasks = document.getElementById('tasks');
    const button = tasks?.querySelector?.('.mosq-task');
    if (!tasks || !button) return false;

    let heading = document.getElementById(HEADING_ID);
    if (!heading) {
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
    }

    if (heading.parentElement === tasks && heading.nextElementSibling === button) return true;
    tasks.append(heading, button);
    return true;
  }

  function init() {
    if (placeMosquitoEntry()) return;
    const tasks = document.getElementById('tasks');
    if (!tasks) return;
    const observer = new MutationObserver(() => {
      if (placeMosquitoEntry()) observer.disconnect();
    });
    observer.observe(tasks, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
