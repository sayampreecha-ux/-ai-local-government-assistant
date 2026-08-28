(() => {
  'use strict';

  const FEATURE_ID = 'tempStaffMaintenanceFundFeature';
  const TAB_ID = 'tempStaffMaintenanceFundTab';
  const STYLE_ID = 'tempStaffMaintenanceFundStyles';
  const WORD_TEMPLATE = 'downloads/public-health/temp-staff-maintenance-fund-plan.docx';
  const EXCEL_TEMPLATE = 'downloads/public-health/temp-staff-workload-fte.xlsx';

  const POSITIONS = Object.freeze([
    'พยาบาลวิชาชีพ',
    'นักวิชาการสาธารณสุข',
    'เจ้าพนักงานสาธารณสุข',
    'นักวิชาการทันตสาธารณสุข',
    'เจ้าพนักงานทันตสาธารณสุข',
    'แพทย์แผนไทย',
    'ผู้ช่วยแพทย์แผนไทย',
    'นักกายภาพบำบัด',
    'นักโภชนาการ',
    'นักจิตวิทยา/สุขภาพจิต',
    'เภสัชกร',
    'เจ้าพนักงานเภสัชกรรม',
    'นักเทคนิคการแพทย์',
    'บุคลากรด้านการแพทย์ฉุกเฉิน',
    'ผู้ช่วยพยาบาล',
    'พนักงานช่วยเหลือคนไข้',
    'พนักงานเปล',
    'เวชสถิติ',
    'พนักงานบันทึกข้อมูล',
    'งานคอมพิวเตอร์',
    'นักจัดการงานทั่วไป',
    'ธุรการ',
    'การเงินและบัญชี',
    'พัสดุ',
    'พนักงานขับรถยนต์',
    'พนักงานบริการ/ทำความสะอาด',
    'พนักงานทั่วไป/ดูแลสถานที่',
    'รักษาความปลอดภัย',
    'อื่น ๆ'
  ]);

  function parseNumber(value) {
    const cleaned = String(value ?? '').replace(/,/g, '').trim();
    if (!cleaned) return null;
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  }

  function round(value, digits = 2) {
    if (!Number.isFinite(value)) return null;
    const factor = 10 ** digits;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function rowWorkloadHours(row = {}) {
    const quantity = parseNumber(row.quantity);
    const minutes = parseNumber(row.minutes);
    if (quantity === null || minutes === null || quantity < 0 || minutes < 0) return null;
    return (quantity * minutes) / 60;
  }

  function sumWorkloadHours(rows = []) {
    return rows.reduce((sum, row) => {
      const hours = rowWorkloadHours(row);
      return sum + (hours === null ? 0 : hours);
    }, 0);
  }

  function fteRequired(workloadHours, netHoursPerFte) {
    const hours = parseNumber(workloadHours);
    const net = parseNumber(netHoursPerFte);
    if (hours === null || hours < 0 || net === null || net <= 0) return null;
    return hours / net;
  }

  function fteGap(requiredFte, actualFte) {
    const required = parseNumber(requiredFte);
    const actual = parseNumber(actualFte);
    if (required === null || required < 0 || actual === null || actual < 0) return null;
    return required - actual;
  }

  function suggestedHeadcount(gap) {
    const value = parseNumber(gap);
    if (value === null) return null;
    return Math.max(0, Math.ceil(value));
  }

  function annualBudget(input = {}) {
    const rate = parseNumber(input.rate);
    const headcount = parseNumber(input.headcount);
    const units = parseNumber(input.units);
    if (rate === null || rate < 0 || headcount === null || headcount < 0 || units === null || units < 0) return null;
    return rate * headcount * units;
  }

  function affordability(input = {}) {
    const budget = parseNumber(input.annualBudget);
    const fundBalance = parseNumber(input.fundBalance);
    const avgIncome = parseNumber(input.avgIncome);
    const essentialExpense = parseNumber(input.essentialExpense);
    if (budget === null || budget < 0) return Object.freeze({ status: 'unknown', postBudgetBalance: null, projectedBalance: null });

    const postBudgetBalance = fundBalance === null ? null : fundBalance - budget;
    const projectedBalance = [fundBalance, avgIncome, essentialExpense].every(v => v !== null)
      ? fundBalance + avgIncome - essentialExpense - budget
      : null;

    let status = 'unknown';
    if (postBudgetBalance !== null) status = postBudgetBalance >= 0 ? 'balance-covers' : 'balance-shortfall';
    return Object.freeze({ status, postBudgetBalance, projectedBalance });
  }

  function buildPrompt(data = {}) {
    const workloadText = (data.workloadRows || [])
      .filter(row => row.activity || row.quantity || row.minutes)
      .map((row, index) => {
        const hours = rowWorkloadHours(row);
        return `${index + 1}. ${row.activity || '[ไม่ได้ระบุกิจกรรม]'} | หน่วย ${row.unit || '-'} | ${row.quantity || '-'} ต่อปี | ${row.minutes || '-'} นาที/หน่วย | ${hours === null ? '-' : round(hours, 2)} ชม./ปี`;
      })
      .join('\n') || '[ยังไม่ได้กรอก Workload]';

    const alternatives = (data.alternatives || [])
      .map(item => `- ${item.label}: ${item.value || 'ยังไม่ได้ประเมิน'}`)
      .join('\n') || '- ยังไม่ได้ประเมิน';

    return [
      'บทบาท',
      'คุณเป็นผู้ช่วยงานราชการไทยด้านสาธารณสุข การบริหาร รพ.สต. และการใช้เงินบำรุงของหน่วยบริการในสังกัดองค์กรปกครองส่วนท้องถิ่น',
      '',
      'ภารกิจ',
      'วิเคราะห์และจัดทำแผนความต้องการลูกจ้างชั่วคราวเงินบำรุง โดยใช้ภาระงาน Workload, FTE, กำลังคนที่มีจริง, ทางเลือกก่อนจ้าง และฐานะเงินบำรุงเป็นเหตุผลประกอบ',
      '',
      'ข้อมูลหน่วยบริการ',
      `- หน่วยบริการ: ${data.agency || '[ยังไม่ได้ระบุ]'}`,
      `- ปีงบประมาณ: ${data.fiscalYear || '[ยังไม่ได้ระบุ]'}`,
      `- ประชากรรับผิดชอบ: ${data.population || '[ยังไม่ได้ระบุ]'} คน`,
      `- ผู้รับบริการ: ${data.annualServices || '[ยังไม่ได้ระบุ]'} ครั้ง/ปี`,
      `- ตำแหน่งที่วิเคราะห์: ${data.position || '[ยังไม่ได้ระบุ]'}`,
      `- บุคลากรที่มีจริง: ${data.actualFte || '[ยังไม่ได้ระบุ]'} FTE`,
      `- ชั่วโมงทำงานสุทธิต่อ 1 FTE/ปี: ${data.netHoursPerFte || '[ยังไม่ได้ระบุ — ต้องมีฐานอ้างอิงที่หน่วยงานยอมรับ]'}`,
      '',
      'Workload',
      workloadText,
      '',
      'ผลคำนวณเบื้องต้นจากข้อมูลผู้ใช้',
      `- ภาระงานรวม: ${data.workloadHours ?? '-'} ชั่วโมง/ปี`,
      `- FTE ที่ต้องการ: ${data.requiredFte ?? '-'}`,
      `- ส่วนขาด/เกิน: ${data.gapFte ?? '-'} FTE`,
      `- จำนวนที่ระบบเสนอจากการปัดส่วนขาดขึ้น: ${data.suggestedHeadcount ?? '-'} คน (เป็นเพียงข้อเสนอจากการคำนวณ ต้องพิจารณาความเหมาะสมอีกครั้ง)`,
      '',
      'แผนการจ้าง',
      `- ประเภทการจ้าง: ${data.employmentType || '[ยังไม่ได้ระบุ]'}`,
      `- จำนวนที่เสนอจ้าง: ${data.proposedHeadcount || '[ยังไม่ได้ระบุ]'} คน`,
      `- อัตราค่าจ้าง/หน่วย: ${data.rate || '[ยังไม่ได้ระบุ]'} บาท`,
      `- จำนวนหน่วยในปี (เดือน/วัน/คาบ): ${data.units || '[ยังไม่ได้ระบุ]'}`,
      `- วงเงินค่าจ้างรวมโดยประมาณ: ${data.annualBudget ?? '-'} บาท/ปี`,
      '',
      'ฐานะเงินบำรุง',
      `- เงินบำรุงคงเหลือ: ${data.fundBalance || '[ยังไม่ได้ระบุ]'} บาท`,
      `- รายรับเงินบำรุงเฉลี่ย/ปี: ${data.avgIncome || '[ยังไม่ได้ระบุ]'} บาท`,
      `- รายจ่ายจำเป็นเฉลี่ย/ปี: ${data.essentialExpense || '[ยังไม่ได้ระบุ]'} บาท`,
      `- หลังหักวงเงินจ้างจากเงินคงเหลือ: ${data.postBudgetBalance ?? '-'} บาท`,
      `- ประมาณการคงเหลือเมื่อรวมรายรับและรายจ่ายจำเป็น: ${data.projectedBalance ?? '-'} บาท`,
      `- รายการจ้างอยู่ในแผนการใช้จ่ายเงินบำรุง: ${data.inSpendingPlan ? 'ใช่' : 'ยังไม่ได้ยืนยัน'}`,
      '',
      'การพิจารณาทางเลือกก่อนจ้าง',
      alternatives,
      '',
      'ข้อกำหนดในการวิเคราะห์',
      '- ตอบแบบ Answer First: สรุปก่อนว่า ควรจ้าง / ควรใช้ร่วมกันหรือเกลี่ยงานก่อน / ข้อมูลยังไม่พอให้อนุมัติ พร้อมจำนวนอัตราที่มีเหตุผลรองรับ',
      '- แยกข้อเท็จจริง การคำนวณ Workload/FTE ประเด็นกฎหมาย/หลักเกณฑ์ ความจำเป็น ความเสี่ยง ความคุ้มค่า และข้อเสนอแนะ',
      '- ห้ามสมมติชั่วโมง FTE อัตราค่าจ้าง ชื่อตำแหน่ง คุณสมบัติ องค์ประกอบคณะกรรมการ เลขหนังสือ เลขข้อ หรืออำนาจอนุมัติ หากผู้ใช้ไม่ได้ให้หรือยังไม่ได้ตรวจแหล่งราชการล่าสุด',
      '- ตรวจหลักเกณฑ์กระทรวงสาธารณสุข กระทรวงมหาดไทย และกรมส่งเสริมการปกครองท้องถิ่นฉบับที่ใช้บังคับ/แนวทางล่าสุดก่อนฟันธงเรื่องตำแหน่ง คุณสมบัติ อัตราค่าจ้าง ขั้นตอน และผู้มีอำนาจ',
      '- ถ้ายังยืนยันหลักเกณฑ์ล่าสุดไม่ได้ ให้ระบุชัดว่า ยังไม่ควรฟันธงในส่วนนั้น',
      '- ตรวจว่าการจ้างอยู่ในแผนการใช้จ่ายเงินบำรุง และวิเคราะห์ว่าไม่ทำให้ภารกิจจำเป็นของหน่วยบริการขาดเงิน',
      '- ถ้าเป็นรายจ่าย ให้ระบุให้ชัดว่า เบิกได้ / เบิกไม่ได้ / มีเงื่อนไข พร้อมฐานอำนาจและเอกสารประกอบ',
      '- คำนึงถึง PDPA ใช้ข้อมูลกำลังคนและสถิติบริการแบบรวม ไม่ต้องใส่ชื่อผู้ป่วย เลขบัตร ที่อยู่ หรือข้อมูลสุขภาพรายบุคคล',
      '',
      'ผลลัพธ์ที่ต้องการ',
      '1. ตารางวิเคราะห์ค่างานรายตำแหน่ง',
      '2. ตาราง Workload และการคำนวณ FTE พร้อมสูตรและที่มาของตัวแปร',
      '3. สรุปคนที่มีจริง ส่วนขาด/เกิน และจำนวนที่ควรเสนอจ้าง',
      '4. วิเคราะห์ทางเลือกก่อนจ้าง เช่น เกลี่ยงาน Cluster ใช้ส่วนกลาง ปรับกระบวนงาน/IT หรือจ้างบริการ',
      '5. วิเคราะห์ฐานะเงินบำรุงและวงเงินค่าจ้างต่อปี',
      '6. Checklist ความครบถ้วนก่อนเสนอผู้มีอำนาจ',
      '7. ร่างข้อความสรุปเหตุผลความจำเป็นสำหรับบันทึกเสนออนุมัติ โดยคงช่องข้อมูลที่ยังไม่มีไว้ ไม่แต่งตัวเลข'
    ].join('\n');
  }

  const api = Object.freeze({
    positions: POSITIONS,
    parseNumber,
    rowWorkloadHours,
    sumWorkloadHours,
    fteRequired,
    fteGap,
    suggestedHeadcount,
    annualBudget,
    affordability,
    buildPrompt,
    templates: Object.freeze({ word: WORD_TEMPLATE, excel: EXCEL_TEMPLATE })
  });

  if (typeof window === 'object') window.GovPromptTempStaffPlan = api;
  if (typeof document !== 'object') return;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .tsmf-tab{border-color:#6f9bd1!important;background:linear-gradient(135deg,#f2f7ff,#f3fbf7)!important}
      .tsmf-intro{padding:11px 12px;border:1px solid #c9dced;border-radius:12px;background:#f6faff;color:#294f76;line-height:1.55}
      .tsmf-table-wrap{overflow-x:auto;margin-top:8px;border:1px solid #dbe4ed;border-radius:12px}
      .tsmf-table{width:100%;min-width:720px;border-collapse:collapse}.tsmf-table th,.tsmf-table td{padding:7px;border-bottom:1px solid #e5ebf1;text-align:left;vertical-align:top}
      .tsmf-table th{background:#f3f7fb;color:#27496d;font-size:12px}.tsmf-table input{min-width:100px}
      .tsmf-remove{border:0;background:#fff0f0;color:#9b1c1c;border-radius:8px;padding:7px 9px;cursor:pointer}
      .tsmf-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.tsmf-metric{border:1px solid #d9e4ec;border-radius:11px;background:#fff;padding:10px}.tsmf-metric small{display:block;color:#6a798a}.tsmf-metric strong{display:block;margin-top:4px;color:#123e68;font-size:18px}
      .tsmf-checks{margin-top:12px;display:grid;gap:6px}.tsmf-check{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:9px;background:#f6f8fa}.tsmf-check.ok{background:#f0faf4;color:#245c3a}.tsmf-check.warn{background:#fff8e7;color:#76550b}
      .tsmf-downloads{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.tsmf-downloads a{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:10px;padding:10px 12px;font-weight:750;background:#edf2f7;color:#173a61}
      .tsmf-note{margin-top:10px;padding:10px;border-left:4px solid #d6a728;background:#fff9e9;color:#624c0e;font-size:12px;line-height:1.5}
      @media(max-width:720px){.tsmf-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.tsmf-downloads a{flex:1 1 45%}}
    `;
    document.head.appendChild(style);
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  function optionList(values) {
    return values.map(value => `<option value="${value}">${value}</option>`).join('');
  }

  function addWorkloadRow(tbody, initial = {}) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="tsmf-activity" placeholder="เช่น เยี่ยมบ้าน" value="${initial.activity || ''}"></td>
      <td><input class="tsmf-unit" placeholder="ราย/ครั้ง" value="${initial.unit || ''}"></td>
      <td><input class="tsmf-quantity" inputmode="decimal" placeholder="0" value="${initial.quantity || ''}"></td>
      <td><input class="tsmf-minutes" inputmode="decimal" placeholder="0" value="${initial.minutes || ''}"></td>
      <td class="tsmf-row-hours">-</td>
      <td><button type="button" class="tsmf-remove" aria-label="ลบกิจกรรม">ลบ</button></td>
    `;
    tr.querySelector('.tsmf-remove').addEventListener('click', () => tr.remove());
    tbody.appendChild(tr);
  }

  function collectRows() {
    return [...document.querySelectorAll('#tsmfWorkloadBody tr')].map(row => ({
      activity: row.querySelector('.tsmf-activity')?.value.trim() || '',
      unit: row.querySelector('.tsmf-unit')?.value.trim() || '',
      quantity: row.querySelector('.tsmf-quantity')?.value.trim() || '',
      minutes: row.querySelector('.tsmf-minutes')?.value.trim() || ''
    }));
  }

  function formatNumber(value, digits = 2) {
    if (value === null || !Number.isFinite(value)) return '-';
    return Number(value).toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function employmentLabel(value) {
    return ({ monthly: 'รายเดือน', daily: 'รายวัน', session: 'รายคาบ' })[value] || '';
  }

  function unitLabel(value) {
    return ({ monthly: 'เดือน', daily: 'วัน', session: 'คาบ' })[value] || 'หน่วย';
  }

  function alternativeData() {
    return [
      ['เกลี่ยงานภายใน รพ.สต.', document.getElementById('tsmfAltRedistribute')?.value],
      ['ใช้บุคลากรร่วม/Cluster', document.getElementById('tsmfAltCluster')?.value],
      ['ใช้บุคลากรส่วนกลาง อบจ.', document.getElementById('tsmfAltCentral')?.value],
      ['ปรับกระบวนงาน/ใช้ IT', document.getElementById('tsmfAltProcess')?.value],
      ['จ้างบริการแทนการจ้างบุคคล', document.getElementById('tsmfAltOutsource')?.value]
    ].map(([label, value]) => ({ label, value }));
  }

  function readData() {
    const rows = collectRows();
    const workloadHours = sumWorkloadHours(rows);
    const netHours = document.getElementById('tsmfNetHours')?.value;
    const actualFte = document.getElementById('tsmfActualFte')?.value;
    const required = fteRequired(workloadHours, netHours);
    const gap = required === null ? null : fteGap(required, actualFte);
    const suggestion = gap === null ? null : suggestedHeadcount(gap);
    const employmentType = document.getElementById('tsmfEmploymentType')?.value || 'monthly';
    const proposedHeadcount = document.getElementById('tsmfProposedHeadcount')?.value;
    const rate = document.getElementById('tsmfRate')?.value;
    const units = document.getElementById('tsmfUnits')?.value;
    const budget = annualBudget({ rate, headcount: proposedHeadcount, units });
    const fundBalance = document.getElementById('tsmfFundBalance')?.value;
    const avgIncome = document.getElementById('tsmfAvgIncome')?.value;
    const essentialExpense = document.getElementById('tsmfEssentialExpense')?.value;
    const finance = affordability({ annualBudget: budget, fundBalance, avgIncome, essentialExpense });

    return {
      agency: document.getElementById('tsmfAgency')?.value.trim() || '',
      fiscalYear: document.getElementById('tsmfFiscalYear')?.value.trim() || '',
      population: document.getElementById('tsmfPopulation')?.value.trim() || '',
      annualServices: document.getElementById('tsmfAnnualServices')?.value.trim() || '',
      position: document.getElementById('tsmfPosition')?.value || '',
      otherPosition: document.getElementById('tsmfOtherPosition')?.value.trim() || '',
      actualFte,
      netHoursPerFte: netHours,
      workloadRows: rows,
      workloadHours: round(workloadHours, 2),
      requiredFte: required === null ? null : round(required, 2),
      gapFte: gap === null ? null : round(gap, 2),
      suggestedHeadcount: suggestion,
      employmentType: employmentLabel(employmentType),
      employmentTypeKey: employmentType,
      proposedHeadcount,
      rate,
      units,
      annualBudget: budget === null ? null : round(budget, 2),
      fundBalance,
      avgIncome,
      essentialExpense,
      postBudgetBalance: finance.postBudgetBalance === null ? null : round(finance.postBudgetBalance, 2),
      projectedBalance: finance.projectedBalance === null ? null : round(finance.projectedBalance, 2),
      financeStatus: finance.status,
      inSpendingPlan: Boolean(document.getElementById('tsmfInSpendingPlan')?.checked),
      alternatives: alternativeData()
    };
  }

  function checklist(data) {
    const rowsComplete = data.workloadRows.some(row => row.activity && parseNumber(row.quantity) !== null && parseNumber(row.minutes) !== null);
    const hasActual = parseNumber(data.actualFte) !== null;
    const hasNetHours = parseNumber(data.netHoursPerFte) > 0;
    const hasFte = data.requiredFte !== null && data.gapFte !== null;
    const consideredAlternatives = data.alternatives.every(item => item.value && item.value !== 'ยังไม่ได้ประเมิน');
    const budgetReady = data.annualBudget !== null;
    const fundReviewed = data.financeStatus !== 'unknown';
    const fundCovers = data.financeStatus === 'balance-covers';

    return [
      { ok: rowsComplete, label: 'มี Workload ที่กรอกกิจกรรม ปริมาณ และเวลาเฉลี่ยอย่างน้อย 1 รายการ' },
      { ok: hasActual, label: 'ระบุกำลังคนที่มีอยู่จริงแล้ว' },
      { ok: hasNetHours, label: 'ระบุชั่วโมงทำงานสุทธิต่อ 1 FTE/ปี โดยต้องมีฐานอ้างอิงของหน่วยงาน' },
      { ok: hasFte, label: 'คำนวณ FTE และส่วนขาด/เกินได้แล้ว' },
      { ok: consideredAlternatives, label: 'พิจารณาการเกลี่ยคน/Cluster/ส่วนกลาง/IT/จ้างบริการแล้ว' },
      { ok: budgetReady, label: 'คำนวณวงเงินค่าจ้างตามประเภทการจ้างและจำนวนหน่วยในปีแล้ว' },
      { ok: fundReviewed, label: 'มีข้อมูลเงินบำรุงคงเหลือเพื่อประเมินการรองรับวงเงินเบื้องต้น' },
      { ok: fundCovers, label: 'เงินบำรุงคงเหลือที่กรอกรองรับวงเงินจ้างเบื้องต้น (ยังต้องตรวจภาระจำเป็นและแผนทั้งปี)' },
      { ok: data.inSpendingPlan, label: 'ยืนยันว่ารายการจ้างอยู่ในแผนการใช้จ่ายเงินบำรุงแล้ว' },
      { ok: false, manual: true, label: 'ต้องตรวจหลักเกณฑ์ล่าสุดเรื่องชื่อตำแหน่ง คุณสมบัติ อัตราค่าจ้าง ขั้นตอน และผู้มีอำนาจก่อนเสนอจริง' }
    ];
  }

  function updateUnitsLabel() {
    const type = document.getElementById('tsmfEmploymentType')?.value || 'monthly';
    const label = document.getElementById('tsmfUnitsLabel');
    const input = document.getElementById('tsmfUnits');
    if (label) label.textContent = `จำนวน${unitLabel(type)}ในปี`;
    if (input) input.placeholder = type === 'monthly' ? 'เช่น 12' : type === 'daily' ? 'เช่น 240' : 'เช่น 120';
  }

  function calculateAndRender(autoFillSuggestion = false) {
    const data = readData();

    document.querySelectorAll('#tsmfWorkloadBody tr').forEach((row, index) => {
      const hours = rowWorkloadHours(data.workloadRows[index]);
      const cell = row.querySelector('.tsmf-row-hours');
      if (cell) cell.textContent = hours === null ? '-' : formatNumber(hours);
    });

    if (autoFillSuggestion && data.suggestedHeadcount !== null) {
      const proposed = document.getElementById('tsmfProposedHeadcount');
      if (proposed && !proposed.value.trim()) proposed.value = String(data.suggestedHeadcount);
      return calculateAndRender(false);
    }

    const summary = document.getElementById('tsmfSummary');
    if (summary) {
      summary.innerHTML = `
        <div class="tsmf-metric"><small>Workload</small><strong>${formatNumber(data.workloadHours)} ชม./ปี</strong></div>
        <div class="tsmf-metric"><small>FTE ที่ต้องใช้</small><strong>${formatNumber(data.requiredFte)}</strong></div>
        <div class="tsmf-metric"><small>ส่วนขาด/เกิน</small><strong>${formatNumber(data.gapFte)} FTE</strong></div>
        <div class="tsmf-metric"><small>เสนอจากการคำนวณ</small><strong>${data.suggestedHeadcount ?? '-'} คน</strong></div>
        <div class="tsmf-metric"><small>วงเงินจ้าง</small><strong>${formatNumber(data.annualBudget)} บาท/ปี</strong></div>
        <div class="tsmf-metric"><small>เงินคงเหลือหลังหักวงเงิน</small><strong>${formatNumber(data.postBudgetBalance)} บาท</strong></div>
        <div class="tsmf-metric"><small>ประมาณการคงเหลือทั้งปี</small><strong>${formatNumber(data.projectedBalance)} บาท</strong></div>
        <div class="tsmf-metric"><small>สถานะเบื้องต้น</small><strong>${data.financeStatus === 'balance-covers' ? 'เงินคงเหลือรองรับ' : data.financeStatus === 'balance-shortfall' ? 'เงินคงเหลือไม่พอ' : 'ข้อมูลยังไม่พอ'}</strong></div>
      `;
    }

    const checks = checklist(data);
    const checkBox = document.getElementById('tsmfChecklist');
    if (checkBox) {
      checkBox.innerHTML = checks.map(item => `
        <div class="tsmf-check ${item.ok ? 'ok' : 'warn'}"><span>${item.ok ? '✓' : item.manual ? '⚠' : '○'}</span><span>${item.label}</span></div>
      `).join('');
    }

    const financeNote = document.getElementById('tsmfFinanceNote');
    if (financeNote) {
      financeNote.textContent = data.financeStatus === 'balance-shortfall'
        ? 'ข้อมูลที่กรอกแสดงว่าเงินบำรุงคงเหลือปัจจุบันต่ำกว่าวงเงินจ้างที่เสนอ จึงยังไม่ควรสรุปว่ามีเงินรองรับจนกว่าจะทบทวนแผนรายรับ-รายจ่ายและภารกิจจำเป็น'
        : 'ผลด้านเงินเป็นเพียงการตรวจเชิงตัวเลขจากข้อมูลที่กรอก ไม่ใช่การอนุมัติรายจ่าย ต้องตรวจแผนเงินบำรุง ฐานอำนาจ อัตราค่าจ้าง และผู้มีอำนาจตามฉบับล่าสุดก่อนใช้จริง';
    }
    return data;
  }

  function render(work) {
    injectStyles();
    work.innerHTML = `
      <h3>👥 วิเคราะห์และจัดทำแผนลูกจ้างเงินบำรุง</h3>
      <div class="tsmf-intro"><strong>Workflow:</strong> วิเคราะห์งาน → คำนวณ Workload/FTE → ตรวจคนและทางเลือกก่อนจ้าง → ตรวจวงเงิน/เงินบำรุง → สร้าง Prompt และเอกสารประกอบแผน</div>

      <div class="hwt-grid">
        <div><label for="tsmfAgency">หน่วยบริการ/รพ.สต.</label><input id="tsmfAgency" placeholder="เช่น รพ.สต.บ้าน..."></div>
        <div><label for="tsmfFiscalYear">ปีงบประมาณ</label><input id="tsmfFiscalYear" inputmode="numeric" placeholder="เช่น 2570"></div>
        <div><label for="tsmfPopulation">ประชากรรับผิดชอบ</label><input id="tsmfPopulation" inputmode="numeric" placeholder="คน"></div>
        <div><label for="tsmfAnnualServices">ผู้รับบริการรวม</label><input id="tsmfAnnualServices" inputmode="numeric" placeholder="ครั้ง/ปี"></div>
        <div><label for="tsmfPosition">ตำแหน่งที่วิเคราะห์</label><select id="tsmfPosition">${optionList(POSITIONS)}</select></div>
        <div><label for="tsmfOtherPosition">ชื่อตำแหน่งอื่น (ถ้ามี)</label><input id="tsmfOtherPosition" placeholder="กรอกเมื่อเลือก อื่น ๆ"></div>
        <div><label for="tsmfActualFte">บุคลากรที่มีจริง</label><input id="tsmfActualFte" inputmode="decimal" placeholder="FTE เช่น 1 หรือ 0.5"></div>
        <div><label for="tsmfNetHours">ชั่วโมงทำงานสุทธิต่อ 1 FTE/ปี</label><input id="tsmfNetHours" inputmode="decimal" placeholder="ต้องกรอกค่าที่มีฐานอ้างอิง"></div>
      </div>

      <h4>1) Workload รายตำแหน่ง</h4>
      <div class="tsmf-table-wrap">
        <table class="tsmf-table">
          <thead><tr><th>งาน/กิจกรรม</th><th>หน่วยนับ</th><th>ปริมาณ/ปี</th><th>นาที/หน่วย</th><th>ชั่วโมง/ปี</th><th></th></tr></thead>
          <tbody id="tsmfWorkloadBody"></tbody>
        </table>
      </div>
      <div class="hwt-actions"><button type="button" class="hwt-secondary" id="tsmfAddRow">+ เพิ่มกิจกรรม</button></div>

      <h4>2) ทางเลือกก่อนจ้าง</h4>
      <div class="hwt-grid">
        <div><label for="tsmfAltRedistribute">เกลี่ยงานภายใน</label><select id="tsmfAltRedistribute"><option>ยังไม่ได้ประเมิน</option><option>ทำได้</option><option>ทำได้บางส่วน</option><option>ทำไม่ได้</option><option>ไม่เกี่ยวข้อง</option></select></div>
        <div><label for="tsmfAltCluster">ใช้บุคลากรร่วม/Cluster</label><select id="tsmfAltCluster"><option>ยังไม่ได้ประเมิน</option><option>ทำได้</option><option>ทำได้บางส่วน</option><option>ทำไม่ได้</option><option>ไม่เกี่ยวข้อง</option></select></div>
        <div><label for="tsmfAltCentral">ใช้บุคลากรส่วนกลาง อบจ.</label><select id="tsmfAltCentral"><option>ยังไม่ได้ประเมิน</option><option>ทำได้</option><option>ทำได้บางส่วน</option><option>ทำไม่ได้</option><option>ไม่เกี่ยวข้อง</option></select></div>
        <div><label for="tsmfAltProcess">ปรับกระบวนงาน/ใช้ IT</label><select id="tsmfAltProcess"><option>ยังไม่ได้ประเมิน</option><option>ทำได้</option><option>ทำได้บางส่วน</option><option>ทำไม่ได้</option><option>ไม่เกี่ยวข้อง</option></select></div>
        <div class="hwt-full"><label for="tsmfAltOutsource">จ้างบริการแทนการจ้างบุคคล</label><select id="tsmfAltOutsource"><option>ยังไม่ได้ประเมิน</option><option>ทำได้</option><option>ทำได้บางส่วน</option><option>ทำไม่ได้</option><option>ไม่เกี่ยวข้อง</option></select></div>
      </div>

      <h4>3) แผนจ้างและวงเงิน</h4>
      <div class="hwt-grid">
        <div><label for="tsmfEmploymentType">ประเภทการจ้าง</label><select id="tsmfEmploymentType"><option value="monthly">รายเดือน</option><option value="daily">รายวัน</option><option value="session">รายคาบ</option></select></div>
        <div><label for="tsmfProposedHeadcount">จำนวนที่เสนอจ้าง</label><input id="tsmfProposedHeadcount" inputmode="numeric" placeholder="คน"></div>
        <div><label for="tsmfRate">อัตราค่าจ้าง/หน่วย</label><input id="tsmfRate" inputmode="decimal" placeholder="บาท — ตรวจอัตราล่าสุดก่อนใช้"></div>
        <div><label for="tsmfUnits" id="tsmfUnitsLabel">จำนวนเดือนในปี</label><input id="tsmfUnits" inputmode="decimal" placeholder="เช่น 12"></div>
        <div><label for="tsmfFundBalance">เงินบำรุงคงเหลือ</label><input id="tsmfFundBalance" inputmode="decimal" placeholder="บาท"></div>
        <div><label for="tsmfAvgIncome">รายรับเงินบำรุงเฉลี่ย/ปี</label><input id="tsmfAvgIncome" inputmode="decimal" placeholder="บาท"></div>
        <div><label for="tsmfEssentialExpense">รายจ่ายจำเป็นเฉลี่ย/ปี</label><input id="tsmfEssentialExpense" inputmode="decimal" placeholder="บาท"></div>
        <div><label>แผนการใช้จ่ายเงินบำรุง</label><label style="font-weight:500"><input id="tsmfInSpendingPlan" type="checkbox" style="width:auto"> ยืนยันว่ารายการจ้างอยู่ในแผนแล้ว</label></div>
      </div>

      <div class="hwt-actions">
        <button type="button" class="hwt-primary" id="tsmfCalculate">คำนวณและตรวจ</button>
        <button type="button" class="hwt-secondary" id="tsmfUseSuggestion">ใส่จำนวนคนจาก FTE</button>
      </div>
      <div class="tsmf-summary" id="tsmfSummary"></div>
      <div class="tsmf-checks" id="tsmfChecklist"></div>
      <div class="tsmf-note" id="tsmfFinanceNote">ระบบจะไม่ใส่ชั่วโมง FTE หรืออัตราค่าจ้างให้เอง ต้องกรอกค่าที่หน่วยงานมีฐานอ้างอิงและตรวจฉบับล่าสุดก่อนใช้จริง</div>

      <h4>4) สร้างเอกสารประกอบ</h4>
      <div class="hwt-actions">
        <button type="button" class="hwt-primary" id="tsmfBuildPrompt">สร้าง Prompt จัดทำแผน</button>
        <button type="button" class="hwt-secondary" id="tsmfCopyPrompt">คัดลอก Prompt</button>
        <button type="button" class="hwt-chat" id="tsmfOpenChat">คัดลอกแล้วเปิด ChatGPT</button>
      </div>
      <div id="tsmfPromptResult"></div>
      <div class="tsmf-downloads">
        <a href="${WORD_TEMPLATE}" download>📄 Word ชุดเอกสารแผน</a>
        <a href="${EXCEL_TEMPLATE}" download>📊 Excel Workload/FTE</a>
      </div>
      <div class="tsmf-note">Word ใช้เป็นแฟ้มราชการ/ลงนาม ส่วน Excel ใช้คำนวณ Workload, FTE, ส่วนขาด และเปรียบเทียบอัตรากำลัง ก่อนนำผลกลับไปใส่ใน Word เพื่อเสนอแผน</div>
    `;

    const tbody = document.getElementById('tsmfWorkloadBody');
    ['บริการผู้ป่วย/งานเฉพาะตำแหน่ง', 'งานเชิงรุก/เยี่ยมบ้าน', 'งานข้อมูล/รายงาน', '', ''].forEach(activity => addWorkloadRow(tbody, { activity }));
    document.getElementById('tsmfAddRow').addEventListener('click', () => addWorkloadRow(tbody));
    document.getElementById('tsmfEmploymentType').addEventListener('change', updateUnitsLabel);
    document.getElementById('tsmfCalculate').addEventListener('click', () => calculateAndRender(false));
    document.getElementById('tsmfUseSuggestion').addEventListener('click', () => calculateAndRender(true));

    let prompt = '';
    const build = () => {
      const data = calculateAndRender(false);
      if (data.position === 'อื่น ๆ' && data.otherPosition) data.position = data.otherPosition;
      prompt = buildPrompt(data);
      const box = document.getElementById('tsmfPromptResult');
      box.className = 'hwt-result';
      box.textContent = prompt;
      return prompt;
    };
    document.getElementById('tsmfBuildPrompt').addEventListener('click', build);
    document.getElementById('tsmfCopyPrompt').addEventListener('click', async () => copyText(prompt || build()));
    document.getElementById('tsmfOpenChat').addEventListener('click', async () => {
      await copyText(prompt || build());
      window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
    });

    updateUnitsLabel();
    calculateAndRender(false);
  }

  function attach() {
    if (document.getElementById(TAB_ID)) return true;
    const tabs = document.getElementById('hwtTabs');
    const work = document.getElementById('hwtWork');
    if (!tabs || !work) return false;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = TAB_ID;
    button.className = 'hwt-tool tsmf-tab';
    button.dataset.hwt = 'temp-staff-maintenance-fund';
    button.innerHTML = '<strong>👥 แผนลูกจ้างเงินบำรุง</strong><small>วิเคราะห์ Workload/FTE ส่วนขาด งบ และสร้างเอกสารประกอบแผน</small>';
    button.addEventListener('click', event => {
      event.stopPropagation();
      document.querySelectorAll('#hwtTabs .hwt-tool').forEach(item => item.classList.toggle('active', item === button));
      render(work);
    });
    tabs.appendChild(button);
    return true;
  }

  function init() {
    if (document.getElementById(FEATURE_ID)) return;
    const marker = document.createElement('span');
    marker.id = FEATURE_ID;
    marker.hidden = true;
    document.body.appendChild(marker);

    if (attach()) return;
    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();