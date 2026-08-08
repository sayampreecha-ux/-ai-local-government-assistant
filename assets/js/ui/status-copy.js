(() => {
  'use strict';

  const CURRENT_TEXT = '✅ ค้นสดและยืนยันหลักฐานปัจจุบันได้ตาม metadata ที่มี';
  const SAFER_TEXT = '✅ พบแหล่งราชการที่มีข้อมูลวันที่/การปรับปรุงล่าสุด — โปรดตรวจสอบสถานะการใช้บังคับของเอกสารก่อนนำไปอ้างอิง';

  function softenFreshnessCopy(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const matches = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue?.includes(CURRENT_TEXT)) matches.push(walker.currentNode);
    }
    matches.forEach(node => {
      node.nodeValue = node.nodeValue.replace(CURRENT_TEXT, SAFER_TEXT);
    });
  }

  softenFreshnessCopy();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.nodeValue?.includes(CURRENT_TEXT)) {
            node.nodeValue = node.nodeValue.replace(CURRENT_TEXT, SAFER_TEXT);
          }
          return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) softenFreshnessCopy(node);
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
