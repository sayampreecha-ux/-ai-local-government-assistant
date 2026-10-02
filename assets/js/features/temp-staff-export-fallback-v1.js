(() => {
  'use strict';

  const WORD_PATH = 'downloads/public-health/temp-staff-maintenance-fund-plan.docx';
  const EXCEL_PATH = 'downloads/public-health/temp-staff-workload-fte.xlsx';
  const EXPORT_STYLE_ID = 'tempStaffExportFallbackStyles';

  if (typeof document !== 'object') return;

  function value(id) {
    return document.getElementById(id)?.value?.trim() || '';
  }

  function number(valueToParse) {
    const cleaned = String(valueToParse ?? '').replace(/,/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function round(valueToRound, digits = 2) {
    if (!Number.isFinite(valueToRound)) return null;
    const factor = 10 ** digits;
    return Math.round((valueToRound + Number.EPSILON) * factor) / factor;
  }

  function escapeHtml(valueToEscape) {
    return String(valueToEscape ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function collectRows() {
    return [...document.querySelectorAll('#tsmfWorkloadBody tr')].map(row => ({
      activity: row.querySelector('.tsmf-activity')?.value.trim() || '',
      unit: row.querySelector('.tsmf-unit')?.value.trim() || '',
      quantity: row.querySelector('.tsmf-quantity')?.value.trim() || '',
      minutes: row.querySelector('.tsmf-minutes')?.value.trim() || ''
    })).filter(row => row.activity || row.quantity || row.minutes);
  }

  function rowHours(row) {
    const q = number(row.quantity);
    const minutes = number(row.minutes);
    if (q === null || minutes === null || q < 0 || minutes < 0) return null;
    return q * minutes / 60;
  }

  function collectData() {
    const api = window.GovPromptTempStaffPlan;
    const rows = collectRows();
    const workloadHours = api?.sumWorkloadHours ? api.sumWorkloadHours(rows) : rows.reduce((sum, row) => sum + (rowHours(row) || 0), 0);
    const netHours = value('tsmfNetHours');
    const actualFte = value('tsmfActualFte');
    const requiredFte = api?.fteRequired ? api.fteRequired(workloadHours, netHours) : ((number(netHours) || 0) > 0 ? workloadHours / number(netHours) : null);
    const gapFte = requiredFte === null ? null : (api?.fteGap ? api.fteGap(requiredFte, actualFte) : requiredFte - (number(actualFte) || 0));
    const suggestion = gapFte === null ? null : Math.max(0, Math.ceil(gapFte));
    const employmentType = document.getElementById('tsmfEmploymentType')?.value || 'monthly';
    const employmentLabel = ({ monthly: 'รายเดือน', daily: 'รายวัน', session: 'รายคาบ' })[employmentType] || employmentType;
    const proposedHeadcount = value('tsmfProposedHeadcount');
    const rate = value('tsmfRate');
    const units = value('tsmfUnits');
    const budget = api?.annualBudget ? api.annualBudget({ rate, headcount: proposedHeadcount, units }) : (
      [number(rate), number(proposedHeadcount), number(units)].every(v => v !== null)
        ? number(rate) * number(proposedHeadcount) * number(units)
        : null
    );
    const fundBalance = value('tsmfFundBalance');
    const avgIncome = value('tsmfAvgIncome');
    const essentialExpense = value('tsmfEssentialExpense');
    const finance = api?.affordability ? api.affordability({
      annualBudget: budget,
      fundBalance,
      avgIncome,
      essentialExpense
    }) : { postBudgetBalance: null, projectedBalance: null };

    const positionValue = value('tsmfPosition');
    const position = positionValue === 'อื่น ๆ' && value('tsmfOtherPosition') ? value('tsmfOtherPosition') : positionValue;
    const alternatives = [
      ['เกลี่ยงานภายใน', value('tsmfAltRedistribute')],
      ['ใช้บุคลากรร่วม/Cluster', value('tsmfAltCluster')],
      ['ใช้บุคลากรส่วนกลาง อบจ.', value('tsmfAltCentral')],
      ['ปรับกระบวนงาน/ใช้ IT', value('tsmfAltProcess')],
      ['จ้างบริการแทน', value('tsmfAltOutsource')]
    ];

    return {
      agency: value('tsmfAgency'),
      fiscalYear: value('tsmfFiscalYear'),
      population: value('tsmfPopulation'),
      annualServices: value('tsmfAnnualServices'),
      position,
      actualFte,
      netHours,
      rows,
      workloadHours: round(workloadHours),
      requiredFte: requiredFte === null ? null : round(requiredFte),
      gapFte: gapFte === null ? null : round(gapFte),
      suggestion,
      employmentLabel,
      proposedHeadcount,
      rate,
      units,
      budget: budget === null ? null : round(budget),
      fundBalance,
      avgIncome,
      essentialExpense,
      postBudgetBalance: finance?.postBudgetBalance === null ? null : round(finance.postBudgetBalance),
      projectedBalance: finance?.projectedBalance === null ? null : round(finance.projectedBalance),
      inPlan: Boolean(document.getElementById('tsmfInSpendingPlan')?.checked),
      alternatives
    };
  }

  function download(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function wordDocument(data) {
    const workloadRows = data.rows.map(row => `<tr><td>${escapeHtml(row.activity)}</td><td>${escapeHtml(row.unit)}</td><td>${escapeHtml(row.quantity)}</td><td>${escapeHtml(row.minutes)}</td><td>${escapeHtml(rowHours(row) === null ? '-' : round(rowHours(row)))}</td></tr>`).join('') || '<tr><td colspan="5">ยังไม่ได้กรอกข้อมูล</td></tr>';
    const altRows = data.alternatives.map(([label, answer]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(answer || 'ยังไม่ได้ประเมิน')}</td></tr>`).join('');
    const checklist = [
      ['Workload', data.rows.length > 0 ? 'มีข้อมูล' : 'ยังไม่มี'],
      ['กำลังคนปัจจุบัน', data.actualFte ? 'ระบุแล้ว' : 'ยังไม่ได้ระบุ'],
      ['ชั่วโมงสุทธิ/FTE', data.netHours ? 'ระบุแล้ว — ต้องมีฐานอ้างอิง' : 'ยังไม่ได้ระบุ'],
      ['FTE/ส่วนขาด', data.requiredFte !== null && data.gapFte !== null ? 'คำนวณแล้ว' : 'ยังคำนวณไม่ได้'],
      ['วงเงินค่าจ้าง', data.budget !== null ? 'คำนวณแล้ว' : 'ยังคำนวณไม่ได้'],
      ['แผนการใช้จ่ายเงินบำรุง', data.inPlan ? 'ยืนยันว่าอยู่ในแผน' : 'ยังไม่ได้ยืนยัน'],
      ['หลักเกณฑ์ล่าสุด', 'ต้องตรวจชื่อตำแหน่ง คุณสมบัติ อัตราค่าจ้าง ขั้นตอน และผู้มีอำนาจก่อนเสนอจริง']
    ].map(([item, status]) => `<tr><td>${escapeHtml(item)}</td><td>${escapeHtml(status)}</td></tr>`).join('');

    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ชุดวิเคราะห์ลูกจ้างเงินบำรุง</title>
    <style>@page{size:A4;margin:1.5cm}body{font-family:"TH Sarabun New","Noto Sans Thai",sans-serif;font-size:16pt;line-height:1.35;color:#111}h1{font-size:22pt;text-align:center}h2{font-size:18pt;margin-top:18px;border-bottom:1px solid #555}table{width:100%;border-collapse:collapse;margin:8px 0 14px}th,td{border:1px solid #555;padding:5px;vertical-align:top}th{background:#eee}.small{font-size:13pt}.sign{margin-top:40px;text-align:right}</style></head><body>
    <h1>ชุดวิเคราะห์ค่างานและแผนลูกจ้างชั่วคราวเงินบำรุง</h1>
    <p><strong>หน่วยบริการ:</strong> ${escapeHtml(data.agency || '................................')}<br>
    <strong>ปีงบประมาณ:</strong> ${escapeHtml(data.fiscalYear || '........')} &nbsp;
    <strong>ตำแหน่ง:</strong> ${escapeHtml(data.position || '................................')}</p>

    <h2>1. ข้อมูลพื้นฐานและความจำเป็น</h2>
    <table><tr><td>ประชากรรับผิดชอบ</td><td>${escapeHtml(data.population || '-')} คน</td></tr>
    <tr><td>ผู้รับบริการรวม</td><td>${escapeHtml(data.annualServices || '-')} ครั้ง/ปี</td></tr>
    <tr><td>บุคลากรที่มีจริง</td><td>${escapeHtml(data.actualFte || '-')} FTE</td></tr></table>
    <p>เหตุผลความจำเป็น/ปัญหา ............................................................................................................................</p>

    <h2>2. ตารางวิเคราะห์ค่างาน (Workload)</h2>
    <table><thead><tr><th>งาน/กิจกรรม</th><th>หน่วย</th><th>ปริมาณ/ปี</th><th>นาที/หน่วย</th><th>ชั่วโมง/ปี</th></tr></thead><tbody>${workloadRows}</tbody></table>

    <h2>3. วิเคราะห์อัตรากำลัง FTE</h2>
    <table><tr><td>ภาระงานรวม</td><td>${escapeHtml(data.workloadHours ?? '-')} ชั่วโมง/ปี</td></tr>
    <tr><td>ชั่วโมงทำงานสุทธิต่อ 1 FTE/ปี</td><td>${escapeHtml(data.netHours || '-')}</td></tr>
    <tr><td>FTE ที่ต้องการ</td><td>${escapeHtml(data.requiredFte ?? '-')}</td></tr>
    <tr><td>FTE ที่มีจริง</td><td>${escapeHtml(data.actualFte || '-')}</td></tr>
    <tr><td>ส่วนขาด/เกิน</td><td>${escapeHtml(data.gapFte ?? '-')} FTE</td></tr>
    <tr><td>จำนวนที่ระบบเสนอจากการปัดส่วนขาดขึ้น</td><td>${escapeHtml(data.suggestion ?? '-')} คน — ต้องพิจารณาความเหมาะสมอีกครั้ง</td></tr></table>

    <h2>4. วิเคราะห์ทางเลือกก่อนจ้าง</h2>
    <table><tbody>${altRows}</tbody></table>

    <h2>5. แผนการจ้างและวงเงิน</h2>
    <table><tr><td>ประเภทการจ้าง</td><td>${escapeHtml(data.employmentLabel)}</td></tr>
    <tr><td>จำนวนที่เสนอจ้าง</td><td>${escapeHtml(data.proposedHeadcount || '-')} คน</td></tr>
    <tr><td>อัตราค่าจ้าง/หน่วย</td><td>${escapeHtml(data.rate || '-')} บาท</td></tr>
    <tr><td>จำนวนเดือน/วัน/คาบในปี</td><td>${escapeHtml(data.units || '-')}</td></tr>
    <tr><td>วงเงินค่าจ้างรวม</td><td>${escapeHtml(data.budget ?? '-')} บาท/ปี</td></tr></table>

    <h2>6. วิเคราะห์ฐานะเงินบำรุง</h2>
    <table><tr><td>เงินบำรุงคงเหลือ</td><td>${escapeHtml(data.fundBalance || '-')} บาท</td></tr>
    <tr><td>รายรับเฉลี่ย/ปี</td><td>${escapeHtml(data.avgIncome || '-')} บาท</td></tr>
    <tr><td>รายจ่ายจำเป็นเฉลี่ย/ปี</td><td>${escapeHtml(data.essentialExpense || '-')} บาท</td></tr>
    <tr><td>คงเหลือหลังหักวงเงินจ้าง</td><td>${escapeHtml(data.postBudgetBalance ?? '-')} บาท</td></tr>
    <tr><td>ประมาณการคงเหลือทั้งปี</td><td>${escapeHtml(data.projectedBalance ?? '-')} บาท</td></tr>
    <tr><td>รายการอยู่ในแผนการใช้จ่ายเงินบำรุง</td><td>${data.inPlan ? 'ใช่' : 'ยังไม่ได้ยืนยัน'}</td></tr></table>

    <h2>7. Checklist ก่อนเสนอ</h2><table>${checklist}</table>

    <h2>8. สรุปความเห็น</h2>
    <p>จากการวิเคราะห์ภารกิจ ปริมาณงาน กำลังคนที่มีจริง ทางเลือกก่อนจ้าง และฐานะเงินบำรุง เห็นว่า
    ........................................................................................................................................................................
    ........................................................................................................................................................................</p>
    <p class="small"><strong>ข้อควรระวัง:</strong> ต้องตรวจหลักเกณฑ์ของกระทรวงสาธารณสุข กระทรวงมหาดไทย กรมส่งเสริมการปกครองท้องถิ่น และคำสั่ง/แนวทางขององค์กรฉบับล่าสุดก่อนกำหนดชื่อตำแหน่ง คุณสมบัติ อัตราค่าจ้าง ขั้นตอน และผู้มีอำนาจ เอกสารนี้ไม่สร้างตัวเลขดังกล่าวแทนหน่วยงาน</p>
    <p class="sign">ลงชื่อ ........................................................ ผู้วิเคราะห์<br>ตำแหน่ง ....................................................<br>วันที่ ........................................................</p>
    </body></html>`;
  }

  function csv(valueToCsv) {
    return `"${String(valueToCsv ?? '').replace(/"/g, '""')}"`;
  }

  function excelCsv(data) {
    const lines = [
      ['หน่วยบริการ', data.agency],
      ['ปีงบประมาณ', data.fiscalYear],
      ['ตำแหน่ง', data.position],
      ['ประชากร', data.population],
      ['ผู้รับบริการ/ปี', data.annualServices],
      ['บุคลากรที่มีจริง FTE', data.actualFte],
      ['ชั่วโมงสุทธิต่อ 1 FTE/ปี', data.netHours],
      [],
      ['งาน/กิจกรรม', 'หน่วยนับ', 'ปริมาณ/ปี', 'นาที/หน่วย', 'ชั่วโมง/ปี']
    ];
    data.rows.forEach(row => lines.push([row.activity, row.unit, row.quantity, row.minutes, rowHours(row) === null ? '' : round(rowHours(row))]));
    lines.push(
      [],
      ['ภาระงานรวม ชั่วโมง/ปี', data.workloadHours],
      ['FTE ที่ต้องการ', data.requiredFte],
      ['FTE ที่มีจริง', data.actualFte],
      ['ส่วนขาด/เกิน FTE', data.gapFte],
      ['จำนวนที่เสนอจากการคำนวณ', data.suggestion],
      ['ประเภทการจ้าง', data.employmentLabel],
      ['จำนวนที่เสนอจ้าง', data.proposedHeadcount],
      ['อัตราค่าจ้าง/หน่วย', data.rate],
      ['จำนวนหน่วยในปี', data.units],
      ['วงเงินค่าจ้าง/ปี', data.budget],
      ['เงินบำรุงคงเหลือ', data.fundBalance],
      ['รายรับเฉลี่ย/ปี', data.avgIncome],
      ['รายจ่ายจำเป็นเฉลี่ย/ปี', data.essentialExpense],
      ['คงเหลือหลังหักวงเงินจ้าง', data.postBudgetBalance],
      ['ประมาณการคงเหลือทั้งปี', data.projectedBalance],
      ['อยู่ในแผนเงินบำรุง', data.inPlan ? 'ใช่' : 'ยังไม่ได้ยืนยัน']
    );
    return '\ufeff' + lines.map(row => row.map(csv).join(',')).join('\r\n');
  }

  function enhanceLinks(root = document) {
    const word = root.querySelector?.(`a[href="${WORD_PATH}"]`);
    const excel = root.querySelector?.(`a[href="${EXCEL_PATH}"]`);
    if (word && !word.dataset.localExport) {
      word.dataset.localExport = 'word';
      word.textContent = '📄 ส่งออกผลเป็น Word (.doc)';
      word.title = 'สร้างเอกสาร Word จากข้อมูลที่กรอกในหน้าจอนี้';
      word.removeAttribute('download');
    }
    if (excel && !excel.dataset.localExport) {
      excel.dataset.localExport = 'excel';
      excel.textContent = '📊 ส่งออก Workload/FTE (.csv)';
      excel.title = 'สร้างไฟล์ CSV ที่เปิดด้วย Excel ได้ จากข้อมูลที่กรอกในหน้าจอนี้';
      excel.removeAttribute('download');
    }
  }

  function injectStyle() {
    if (document.getElementById(EXPORT_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = EXPORT_STYLE_ID;
    style.textContent = '.tsmf-downloads a[data-local-export]{cursor:pointer}';
    document.head.appendChild(style);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-local-export]');
    if (!link) return;
    event.preventDefault();
    const data = collectData();
    if (link.dataset.localExport === 'word') {
      download('\ufeff' + wordDocument(data), 'application/msword;charset=utf-8', 'แผนลูกจ้างเงินบำรุง.doc');
    } else if (link.dataset.localExport === 'excel') {
      download(excelCsv(data), 'text/csv;charset=utf-8', 'workload-fte-ลูกจ้างเงินบำรุง.csv');
    }
  }, true);

  injectStyle();
  enhanceLinks();
  const observer = new MutationObserver(() => enhanceLinks());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();