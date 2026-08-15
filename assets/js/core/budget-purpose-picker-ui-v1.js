export const BUDGET_PURPOSE_PICKER_UI_VERSION = '1.0';

const PURPOSE_OPTIONS = Object.freeze([
  Object.freeze({ key: 'baselineBudget', title: 'งบประมาณฐานเดิม', description: 'เช่น ข้อบัญญัติงบประมาณปีเดิม หรือยอดงบฐาน' }),
  Object.freeze({ key: 'personnelObligations', title: 'ภาระบุคลากร', description: 'เช่น เงินเดือน ค่าจ้าง หรือภาระบุคลากรประจำปี' }),
  Object.freeze({ key: 'budgetTotals', title: 'ยอดรายรับ/รายจ่าย', description: 'เช่น ตารางรายรับ รายจ่าย หรือยอดรวมงบประมาณ' })
]);

export function chooseBudgetPurpose({ title = 'ไฟล์นี้เป็นข้อมูลประเภทใด?' } = {}) {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-dialog budget-purpose-dialog';
    const head = document.createElement('div');
    head.className = 'dialog-head';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'icon-button'; close.setAttribute('aria-label', 'ปิด'); close.textContent = '×';
    head.append(heading, close);
    const content = document.createElement('div');
    content.className = 'dialog-content budget-purpose-picker';
    const note = document.createElement('p');
    note.textContent = 'ระบบไม่แน่ใจว่าไฟล์นี้ใช้สำหรับส่วนใดของร่างงบประมาณ จึงไม่เดา กรุณาเลือกประเภทก่อนอ่านข้อมูลต่อ';
    content.append(note);
    for (const option of PURPOSE_OPTIONS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<strong>${option.title}</strong><small>${option.description}</small>`;
      button.addEventListener('click', () => finish(option.key));
      content.append(button);
    }
    dialog.append(head, content);
    document.body.append(dialog);
    function finish(value) {
      if (dialog.open) dialog.close();
      dialog.remove();
      resolve(value);
    }
    close.addEventListener('click', () => finish(null));
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(null); }, { once: true });
    dialog.showModal();
  });
}

export { PURPOSE_OPTIONS as BUDGET_PURPOSE_OPTIONS };
export default Object.freeze({ version: BUDGET_PURPOSE_PICKER_UI_VERSION, chooseBudgetPurpose });
