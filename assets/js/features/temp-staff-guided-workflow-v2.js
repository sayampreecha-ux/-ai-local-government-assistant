(() => {
  'use strict';

  const FEATURE_FLAG = 'tempStaffGuidedWorkflowV2';
  const STYLE_ID = 'tempStaffGuidedWorkflowV2Styles';
  const ROOT_ID = 'hwtWork';
  const STEP_LABELS = Object.freeze([
    'หน่วยบริการ',
    'Workload / FTE',
    'เหตุผลและทางเลือก',
    'วงเงินและเงินบำรุง',
    'ตรวจและสร้างเอกสาร'
  ]);

  if (typeof document !== 'object') return;

  const $ = id => document.getElementById(id);
  const value = id => $(id)?.value?.trim() || '';
  const number = raw => {
    const cleaned = String(raw ?? '').replace(/,/g, '').trim();
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const round = (raw, digits = 2) => {
    if (!Number.isFinite(raw)) return null;
    const factor = 10 ** digits;
    return Math.round((raw + Number.EPSILON) * factor) / factor;
  };
  const escapeHtml = raw => String(raw ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const formatNumber = raw => Number.isFinite(Number(raw))
    ? Number(raw).toLocaleString('th-TH', { maximumFractionDigits: 2 })
    : '-';

  function injectStyles() {
    if ($(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .tsmf-wizard-shell{margin:12px 0 16px;padding:12px;border:1px solid #cfe0ef;border-radius:14px;background:linear-gradient(135deg,#f8fbff,#f7fcf9)}
      .tsmf-wizard-title{font-weight:800;color:#153f68;margin-bottom:8px}.tsmf-wizard-nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
      .tsmf-step-btn{border:1px solid #cbd8e6;border-radius:10px;background:#fff;padding:8px 5px;font:inherit;font-size:12px;color:#38536e;cursor:pointer;min-height:52px}
      .tsmf-step-btn strong{display:block;font-size:14px}.tsmf-step-btn.active{border-color:#0b3b75;background:#eaf3ff;color:#0b3b75;box-shadow:0 0 0 1px #b6d0eb}
      .tsmf-step-btn.done{background:#eef9f2;border-color:#a9d3b5;color:#245b34}.tsmf-wizard-panel[hidden]{display:none!important}
      .tsmf-wizard-controls{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:12px 0}
      .tsmf-wizard-controls .left,.tsmf-wizard-controls .right{display:flex;gap:7px;flex-wrap:wrap}.tsmf-wizard-controls button{border:0;border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer}
      .tsmf-wizard-prev,.tsmf-wizard-all{background:#edf2f7;color:#24425f}.tsmf-wizard-next{background:#0b3b75;color:#fff}.tsmf-wizard-status{font-size:12px;color:#5f7080}
      .tsmf-extra-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}.tsmf-extra-grid .full{grid-column:1/-1}.tsmf-extra-grid textarea{min-height:92px}
      .tsmf-package-card{margin-top:14px;border:1px solid #cfdce8;border-radius:14px;background:#fff;padding:13px}.tsmf-package-card h4{margin:6px 0 10px}.tsmf-recommendation{padding:11px 12px;border-radius:10px;background:#f3f7fb;border-left:4px solid #0b3b75;line-height:1.55}
      .tsmf-doc-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.tsmf-doc-tabs button{border:1px solid #ccd9e5;background:#fff;border-radius:9px;padding:8px 10px;cursor:pointer}.tsmf-doc-tabs button.active{background:#eaf3ff;border-color:#7fa7d0;color:#0b3b75}
      .tsmf-doc-pane{margin-top:9px;padding:12px;border:1px solid #e0e7ef;border-radius:10px;background:#fbfcfe;white-space:pre-wrap;line-height:1.6;max-height:520px;overflow:auto}.tsmf-doc-pane[hidden]{display:none!important}
      .tsmf-package-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.tsmf-package-actions button{border:0;border-radius:10px;padding:10px 12px;font-weight:700;cursor:pointer}.tsmf-package-primary{background:#0b3b75;color:#fff}.tsmf-package-secondary{background:#edf2f7;color:#233f5a}
      .tsmf-check-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:10px 0}.tsmf-check-item{padding:8px 10px;border-radius:9px;border:1px solid #dde6ee;background:#fff;font-size:13px}.tsmf-check-item.ok{border-color:#b8d9c0;background:#f2faf4}.tsmf-check-item.warn{border-color:#efd39e;background:#fff9ee}
      @media(max-width:700px){.tsmf-wizard-nav{grid-template-columns:1fr 1fr}.tsmf-extra-grid,.tsmf-check-grid{grid-template-columns:1fr}.tsmf-step-btn{min-height:46px}.tsmf-wizard-controls{align-items:stretch}.tsmf-wizard-controls .left,.tsmf-wizard-controls .right{width:100%}.tsmf-wizard-controls button{flex:1}}
    `;
    document.head.appendChild(style);
  }

  function collectWorkloadRows() {
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
    const api = window.GovPromptTempStaffPlan || {};
    const rows = collectWorkloadRows();
    const workloadHours = typeof api.sumWorkloadHours === 'function'
      ? api.sumWorkloadHours(rows)
      : rows.reduce((sum, row) => sum + (rowHours(row) || 0), 0);
    const netHours = value('tsmfNetHours');
    const actualFte = value('tsmfActualFte');
    const requiredFte = typeof api.fteRequired === 'function'
      ? api.fteRequired(workloadHours, netHours)
      : ((number(netHours) || 0) > 0 ? workloadHours / number(netHours) : null);
    const gapFte = requiredFte === null ? null : (typeof api.fteGap === 'function'
      ? api.fteGap(requiredFte, actualFte)
      : requiredFte - (number(actualFte) || 0));
    const suggested = gapFte === null ? null : Math.max(0, Math.ceil(gapFte));
    const proposed = number(value('tsmfProposedHeadcount'));
    const rate = number(value('tsmfRate'));
    const units = number(value('tsmfUnits'));
    const annualBudget = typeof api.annualBudget === 'function'
      ? api.annualBudget({ rate, headcount: proposed, units })
      : ([rate, proposed, units].every(v => v !== null) ? rate * proposed * units : null);
    const fundBalance = number(value('tsmfFundBalance'));
    const avgIncome = number(value('tsmfAvgIncome'));
    const essentialExpense = number(value('tsmfEssentialExpense'));
    const finance = typeof api.affordability === 'function'
      ? api.affordability({ annualBudget, fundBalance, avgIncome, essentialExpense })
      : {
          postBudgetBalance: annualBudget !== null && fundBalance !== null ? fundBalance - annualBudget : null,
          projectedBalance: [annualBudget, fundBalance, avgIncome, essentialExpense].every(v => v !== null)
            ? fundBalance + avgIncome - essentialExpense - annualBudget : null
        };
    const employmentType = $('tsmfEmploymentType')?.value || 'monthly';
    const employmentLabel = ({ monthly: 'รายเดือน', daily: 'รายวัน', session: 'รายคาบ' })[employmentType] || employmentType;
    const rawPosition = value('tsmfPosition');
    const position = rawPosition === 'อื่น ๆ' && value('tsmfOtherPosition') ? value('tsmfOtherPosition') : rawPosition;
    const alternatives = [
      ['เกลี่ยงานภายใน', value('tsmfAltRedistribute')],
      ['ใช้บุคลากรร่วม/Cluster', value('tsmfAltCluster')],
      ['ใช้บุคลากรส่วนกลาง อบจ.', value('tsmfAltCentral')],
      ['ปรับกระบวนงาน/ใช้ IT', value('tsmfAltProcess')],
      ['จ้างบริการแทนการจ้างบุคคล', value('tsmfAltOutsource')]
    ];
    return Object.freeze({
      agency: value('tsmfAgency'), fiscalYear: value('tsmfFiscalYear'), population: value('tsmfPopulation'), annualServices: value('tsmfAnnualServices'),
      position, actualFte, netHours, rows, workloadHours: round(workloadHours), requiredFte: requiredFte === null ? null : round(requiredFte), gapFte: gapFte === null ? null : round(gapFte), suggested,
      needReason: value('tsmfNeedReason'), impactNoHire: value('tsmfImpactNoHire'), evidenceNote: value('tsmfEvidenceNote'),
      alternatives, employmentType, employmentLabel, proposedHeadcount: proposed, rate, units, annualBudget: annualBudget === null ? null : round(annualBudget),
      fundBalance, avgIncome, essentialExpense, postBudgetBalance: finance?.postBudgetBalance === null ? null : round(finance.postBudgetBalance), projectedBalance: finance?.projectedBalance === null ? null : round(finance.projectedBalance),
      inPlan: Boolean($('tsmfInSpendingPlan')?.checked)
    });
  }

  function completeness(data) {
    const validWorkload = data.rows.some(row => number(row.quantity) !== null && number(row.minutes) !== null);
    const alternativesReviewed = data.alternatives.every(([, answer]) => answer && answer !== 'ยังไม่ได้ประเมิน');
    return Object.freeze([
      ['ระบุหน่วยบริการ', Boolean(data.agency)],
      ['ระบุปีงบประมาณ', Boolean(data.fiscalYear)],
      ['ระบุตำแหน่ง', Boolean(data.position)],
      ['ระบุกำลังคนที่มีจริง', number(data.actualFte) !== null],
      ['มี Workload ที่คำนวณได้', validWorkload],
      ['ระบุชั่วโมงสุทธิต่อ 1 FTE/ปี พร้อมฐานอ้างอิง', number(data.netHours) !== null && number(data.netHours) > 0],
      ['ระบุเหตุผลความจำเป็น', Boolean(data.needReason)],
      ['ระบุผลกระทบหากไม่จ้าง', Boolean(data.impactNoHire)],
      ['ประเมินทางเลือกก่อนจ้างครบ', alternativesReviewed],
      ['ระบุจำนวนที่เสนอจ้าง', data.proposedHeadcount !== null],
      ['ระบุอัตราค่าจ้างและจำนวนหน่วย', data.rate !== null && data.units !== null],
      ['มีข้อมูลเงินบำรุงคงเหลือ', data.fundBalance !== null],
      ['ยืนยันรายการในแผนการใช้จ่ายเงินบำรุง', data.inPlan],
      ['ตรวจหลักเกณฑ์/อัตรา/ผู้มีอำนาจฉบับล่าสุด', false]
    ]);
  }

  function recommendation(data) {
    const missingCore = !data.agency || !data.position || data.requiredFte === null || data.gapFte === null;
    if (missingCore) return 'ข้อมูลหลักยังไม่ครบ จึงยังไม่ควรสรุปจำนวนอัตราหรือเสนออนุมัติ ให้กรอก Workload, ชั่วโมงสุทธิ/FTE และกำลังคนปัจจุบันให้ครบก่อน';
    if (data.gapFte <= 0) return 'จาก Workload/FTE ที่กรอก ยังไม่พบส่วนขาดกำลังคนในตำแหน่งนี้ ควรตรวจการจัดสรรงานและข้อมูลภาระงานอีกครั้งก่อนเสนอจ้างเพิ่ม';
    const shareable = data.alternatives.some(([label, answer]) => /เกลี่ยงาน|Cluster|ส่วนกลาง/.test(label) && (answer === 'ทำได้' || answer === 'ทำได้บางส่วน'));
    if (shareable) return 'พบส่วนขาดกำลังคน แต่ยังมีทางเลือกเกลี่ยงานหรือใช้บุคลากรร่วมได้ ควรบันทึกผลการทดลอง/ข้อจำกัดของทางเลือกดังกล่าวก่อนเสนอจ้างเต็มอัตรา';
    if (data.postBudgetBalance !== null && data.postBudgetBalance < 0) return 'มีเหตุผลด้านกำลังคน แต่เงินบำรุงคงเหลือไม่รองรับวงเงินจ้างตามข้อมูลที่กรอก จึงยังไม่ควรเสนอวงเงินนี้จนกว่าจะปรับจำนวน/อัตรา/ช่วงเวลาหรือฐานะเงินบำรุง';
    if (!data.inPlan) return 'มีเหตุผลด้านกำลังคนจาก Workload/FTE แต่ยังไม่ได้ยืนยันว่ารายการอยู่ในแผนการใช้จ่ายเงินบำรุง ต้องบรรจุหรือปรับแผนตามขั้นตอนก่อนดำเนินการจ้าง';
    if (data.proposedHeadcount !== null && data.suggested !== null && data.proposedHeadcount > data.suggested) return `มีเหตุผลรองรับการจ้างจากส่วนขาด ${formatNumber(data.gapFte)} FTE แต่จำนวนเสนอจ้าง ${formatNumber(data.proposedHeadcount)} คน สูงกว่าจำนวนที่ได้จากการปัดส่วนขาด (${formatNumber(data.suggested)} คน) ต้องมีเหตุผลเฉพาะรองรับส่วนเพิ่ม`;
    return `มีเหตุผลรองรับให้เสนอพิจารณาความจำเป็นในการจ้าง ${data.position || 'ตำแหน่งที่วิเคราะห์'} ตามส่วนขาด ${formatNumber(data.gapFte)} FTE และวงเงินที่กรอก ทั้งนี้ต้องตรวจหลักเกณฑ์กระทรวงสาธารณสุข/กระทรวงมหาดไทย/กรมส่งเสริมการปกครองท้องถิ่น อัตราค่าจ้าง คุณสมบัติ และผู้มีอำนาจฉบับล่าสุดก่อนอนุมัติจริง`;
  }

  function workloadTableText(data) {
    const rows = data.rows.length ? data.rows.map((row, index) => `${index + 1}. ${row.activity || '-'} | ${row.unit || '-'} | ${row.quantity || '-'} ต่อปี | ${row.minutes || '-'} นาที/หน่วย | ${formatNumber(rowHours(row))} ชม./ปี`).join('\n') : '[ยังไม่มี Workload]';
    return [
      'ตารางวิเคราะห์ค่างานและภาระงาน',
      `หน่วยบริการ: ${data.agency || '-'}`,
      `ตำแหน่ง: ${data.position || '-'}`,
      '', rows, '',
      `ภาระงานรวม: ${formatNumber(data.workloadHours)} ชั่วโมง/ปี`,
      `ชั่วโมงทำงานสุทธิต่อ 1 FTE/ปี: ${data.netHours || '-'} (ต้องมีฐานอ้างอิงที่หน่วยงานยอมรับ)`,
      `FTE ที่ต้องการ: ${formatNumber(data.requiredFte)}`,
      `FTE ที่มีจริง: ${data.actualFte || '-'}`,
      `ส่วนขาด/เกิน: ${formatNumber(data.gapFte)} FTE`,
      `จำนวนจากการปัดส่วนขาดขึ้น: ${data.suggested ?? '-'} คน`
    ].join('\n');
  }

  function memoText(data) {
    const altText = data.alternatives.map(([label, answer]) => `- ${label}: ${answer || 'ยังไม่ได้ประเมิน'}`).join('\n');
    const planAction = data.inPlan ? 'รายการดังกล่าวได้ยืนยันว่าอยู่ในแผนการใช้จ่ายเงินบำรุงแล้ว' : 'ยังไม่ได้ยืนยันว่ารายการดังกล่าวอยู่ในแผนการใช้จ่ายเงินบำรุง จึงต้องดำเนินการบรรจุ/ปรับแผนตามขั้นตอนก่อนก่อภาระผูกพัน';
    return [
      'บันทึกข้อความ',
      `ส่วนราชการ ${data.agency || '........................................................'}`,
      'ที่ ........................................................    วันที่ ........................................................',
      `เรื่อง ขอพิจารณาความจำเป็นและบรรจุแผนความต้องการลูกจ้างชั่วคราวเงินบำรุง ตำแหน่ง${data.position || '................................'} ประจำปีงบประมาณ ${data.fiscalYear || '........'}`,
      'เรียน [ผู้มีอำนาจตามหลักเกณฑ์/คำสั่งมอบอำนาจที่ใช้บังคับล่าสุด]',
      '',
      '1. ข้อเท็จจริง',
      `${data.agency || 'หน่วยบริการ'} มีประชากรรับผิดชอบ ${data.population || '-'} คน ผู้รับบริการรวม ${data.annualServices || '-'} ครั้ง/ปี และมีบุคลากรในตำแหน่งที่วิเคราะห์ ${data.actualFte || '-'} FTE`,
      '',
      '2. ผลการวิเคราะห์ค่างานและอัตรากำลัง',
      `จากการรวบรวม Workload มีภาระงานรวม ${formatNumber(data.workloadHours)} ชั่วโมง/ปี เมื่อเทียบกับชั่วโมงทำงานสุทธิต่อ 1 FTE/ปี จำนวน ${data.netHours || '-'} ชั่วโมง คำนวณได้ความต้องการ ${formatNumber(data.requiredFte)} FTE เทียบกับกำลังคนที่มีจริง ${data.actualFte || '-'} FTE มีส่วนขาด/เกิน ${formatNumber(data.gapFte)} FTE`,
      '',
      '3. เหตุผลความจำเป็นและผลกระทบ',
      data.needReason || '[โปรดระบุเหตุผลความจำเป็นจากภารกิจจริง]',
      `ผลกระทบหากไม่จ้าง: ${data.impactNoHire || '[โปรดระบุผลกระทบต่อบริการ/ภารกิจ]'}`,
      data.evidenceNote ? `หลักฐานประกอบ: ${data.evidenceNote}` : '',
      '',
      '4. การพิจารณาทางเลือกก่อนจ้าง',
      altText,
      '',
      '5. วงเงินและฐานะเงินบำรุง',
      `เสนอจ้างแบบ${data.employmentLabel} จำนวน ${data.proposedHeadcount ?? '-'} คน อัตรา ${formatNumber(data.rate)} บาท/หน่วย จำนวน ${formatNumber(data.units)} หน่วย วงเงินรวมประมาณ ${formatNumber(data.annualBudget)} บาท/ปี`,
      `เงินบำรุงคงเหลือ ${formatNumber(data.fundBalance)} บาท รายรับเฉลี่ย/ปี ${formatNumber(data.avgIncome)} บาท รายจ่ายจำเป็นเฉลี่ย/ปี ${formatNumber(data.essentialExpense)} บาท ประมาณการคงเหลือหลังหักวงเงินจ้าง ${formatNumber(data.postBudgetBalance)} บาท`,
      planAction,
      '',
      '6. ความเห็น/ข้อเสนอ',
      recommendation(data),
      '',
      'จึงเรียนมาเพื่อโปรดพิจารณา ทั้งนี้ ก่อนดำเนินการจริงให้ตรวจชื่อตำแหน่ง คุณสมบัติ อัตราค่าจ้าง วิธีสรรหา ขั้นตอนการจ้าง แผนการใช้จ่ายเงินบำรุง และผู้มีอำนาจตามหลักเกณฑ์/หนังสือสั่งการฉบับล่าสุดอีกครั้ง',
      '',
      'ลงชื่อ ........................................................',
      '(........................................................)',
      'ตำแหน่ง ........................................................'
    ].filter(Boolean).join('\n');
  }

  function summaryText(data) {
    const checks = completeness(data);
    const completeCount = checks.filter(([, ok]) => ok).length;
    return [
      'สรุปผลการวิเคราะห์แผนลูกจ้างชั่วคราวเงินบำรุง',
      `หน่วยบริการ: ${data.agency || '-'}`,
      `ตำแหน่ง: ${data.position || '-'}`,
      `ปีงบประมาณ: ${data.fiscalYear || '-'}`,
      `Workload: ${formatNumber(data.workloadHours)} ชั่วโมง/ปี`,
      `FTE ต้องการ / มีจริง / ส่วนขาด: ${formatNumber(data.requiredFte)} / ${data.actualFte || '-'} / ${formatNumber(data.gapFte)}`,
      `เสนอจ้าง: ${data.proposedHeadcount ?? '-'} คน แบบ${data.employmentLabel}`,
      `วงเงิน: ${formatNumber(data.annualBudget)} บาท/ปี`,
      `เงินคงเหลือหลังวงเงินจ้าง: ${formatNumber(data.postBudgetBalance)} บาท`,
      `ความครบถ้วน: ${completeCount}/${checks.length} รายการ`,
      '',
      `ข้อเสนอระบบ: ${recommendation(data)}`
    ].join('\n');
  }

  function csvText(data) {
    const lines = [['งาน/กิจกรรม','หน่วยนับ','ปริมาณ/ปี','นาที/หน่วย','ชั่วโมง/ปี']];
    data.rows.forEach(row => lines.push([row.activity,row.unit,row.quantity,row.minutes,rowHours(row) === null ? '' : round(rowHours(row))]));
    lines.push(['รวม','','','','' + (data.workloadHours ?? '')]);
    return '\ufeff' + lines.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  }

  function download(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function wordHtml(data) {
    const rows = data.rows.map(row => `<tr><td>${escapeHtml(row.activity)}</td><td>${escapeHtml(row.unit)}</td><td>${escapeHtml(row.quantity)}</td><td>${escapeHtml(row.minutes)}</td><td>${escapeHtml(formatNumber(rowHours(row)))}</td></tr>`).join('') || '<tr><td colspan="5">ยังไม่มีข้อมูล</td></tr>';
    return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ชุดเอกสารแผนลูกจ้างเงินบำรุง</title><style>@page{size:A4;margin:1.5cm}body{font-family:"TH Sarabun New","Noto Sans Thai",sans-serif;font-size:16pt;line-height:1.4;color:#111}h1{text-align:center;font-size:22pt}h2{font-size:18pt;border-bottom:1px solid #555}table{width:100%;border-collapse:collapse}th,td{border:1px solid #555;padding:5px;vertical-align:top}th{background:#eee}pre{white-space:pre-wrap;font-family:inherit;font-size:16pt}</style></head><body><h1>ชุดวิเคราะห์และแผนลูกจ้างชั่วคราวเงินบำรุง</h1><h2>1. สรุปผล</h2><pre>${escapeHtml(summaryText(data))}</pre><h2>2. ตารางวิเคราะห์ค่างาน / Workload</h2><table><thead><tr><th>งาน/กิจกรรม</th><th>หน่วย</th><th>ปริมาณ/ปี</th><th>นาที/หน่วย</th><th>ชั่วโมง/ปี</th></tr></thead><tbody>${rows}</tbody></table><p><strong>รวม:</strong> ${escapeHtml(formatNumber(data.workloadHours))} ชั่วโมง/ปี &nbsp; <strong>FTE ต้องการ:</strong> ${escapeHtml(formatNumber(data.requiredFte))} &nbsp; <strong>ส่วนขาด/เกิน:</strong> ${escapeHtml(formatNumber(data.gapFte))}</p><h2>3. ร่างบันทึกเสนอ</h2><pre>${escapeHtml(memoText(data))}</pre><p><strong>หมายเหตุ:</strong> เอกสารนี้เป็นร่างจากข้อมูลที่ผู้ใช้กรอก ต้องตรวจหลักเกณฑ์ อัตราค่าจ้าง คุณสมบัติ และผู้มีอำนาจฉบับล่าสุดก่อนลงนามหรือดำเนินการจริง</p></body></html>`;
  }

  function addExtraFields(step3Panel) {
    if ($('tsmfNeedReason')) return;
    const block = document.createElement('div');
    block.className = 'tsmf-extra-grid';
    block.innerHTML = `
      <div class="full"><label for="tsmfNeedReason">เหตุผลความจำเป็นในการจ้าง</label><textarea id="tsmfNeedReason" placeholder="เช่น ภาระงานส่วนใดเกินกำลังคนเดิม เหตุใดต้องใช้ตำแหน่งนี้"></textarea></div>
      <div class="full"><label for="tsmfImpactNoHire">ผลกระทบหากไม่จ้าง</label><textarea id="tsmfImpactNoHire" placeholder="ระบุผลกระทบต่อบริการประชาชน ความต่อเนื่อง ความปลอดภัย หรือภารกิจหลัก"></textarea></div>
      <div class="full"><label for="tsmfEvidenceNote">หลักฐาน/แหล่งข้อมูลประกอบ</label><textarea id="tsmfEvidenceNote" placeholder="เช่น สถิติบริการ 12 เดือน ทะเบียนเยี่ยมบ้าน รายงาน NCD ตารางเวร JD หรือ time study"></textarea></div>`;
    step3Panel.appendChild(block);
  }

  function groupIntoWizard(root) {
    const intro = root.querySelector('.tsmf-intro');
    const headings = [...root.querySelectorAll(':scope > h4')];
    if (!intro || headings.length < 4) return null;

    const shell = document.createElement('div');
    shell.className = 'tsmf-wizard-shell';
    shell.innerHTML = `<div class="tsmf-wizard-title">ทำแผนแบบทีละขั้น — กรอกครั้งเดียว ระบบคำนวณและสร้างเอกสารต่อให้</div><div class="tsmf-wizard-nav" id="tsmfWizardNav"></div><div class="tsmf-wizard-status" id="tsmfWizardStatus"></div>`;
    intro.after(shell);

    const nav = shell.querySelector('#tsmfWizardNav');
    STEP_LABELS.forEach((label, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'tsmf-step-btn'; button.dataset.step = String(index);
      button.innerHTML = `<strong>${index + 1}</strong>${escapeHtml(label)}`;
      nav.appendChild(button);
    });

    const panels = STEP_LABELS.map((_, index) => {
      const panel = document.createElement('section');
      panel.className = 'tsmf-wizard-panel'; panel.dataset.step = String(index); panel.hidden = true;
      root.appendChild(panel);
      return panel;
    });

    let node = shell.nextSibling;
    while (node && node !== headings[0]) { const next = node.nextSibling; panels[0].appendChild(node); node = next; }
    for (let i = 0; i < 4; i += 1) {
      node = headings[i];
      const end = headings[i + 1] || panels[0];
      while (node && node !== end) { const next = node.nextSibling; panels[i + 1].appendChild(node); node = next; }
    }

    addExtraFields(panels[2]);
    return { shell, nav, panels };
  }

  function renderPackage(container, data) {
    const checks = completeness(data);
    const checkHtml = checks.map(([label, ok]) => `<div class="tsmf-check-item ${ok ? 'ok' : 'warn'}">${ok ? '✅' : '⚠️'} ${escapeHtml(label)}</div>`).join('');
    container.innerHTML = `
      <h4>ชุดเอกสารอัตโนมัติ</h4>
      <div class="tsmf-recommendation"><strong>ข้อเสนอระบบ:</strong> ${escapeHtml(recommendation(data))}</div>
      <div class="tsmf-check-grid">${checkHtml}</div>
      <div class="tsmf-doc-tabs"><button type="button" class="active" data-doc="summary">สรุปผล</button><button type="button" data-doc="workload">ตารางวิเคราะห์ค่างาน</button><button type="button" data-doc="memo">ร่างบันทึกเสนอ</button></div>
      <div class="tsmf-doc-pane" data-pane="summary">${escapeHtml(summaryText(data))}</div>
      <div class="tsmf-doc-pane" data-pane="workload" hidden>${escapeHtml(workloadTableText(data))}</div>
      <div class="tsmf-doc-pane" data-pane="memo" hidden>${escapeHtml(memoText(data))}</div>
      <div class="tsmf-package-actions"><button type="button" class="tsmf-package-primary" id="tsmfDownloadPackageWord">📄 ดาวน์โหลดชุด Word</button><button type="button" class="tsmf-package-secondary" id="tsmfDownloadWorkloadCsv">📊 ดาวน์โหลด Workload CSV</button><button type="button" class="tsmf-package-secondary" id="tsmfCopyMemoV2">คัดลอกร่างบันทึก</button></div>`;

    container.querySelectorAll('[data-doc]').forEach(button => button.addEventListener('click', () => {
      container.querySelectorAll('[data-doc]').forEach(item => item.classList.toggle('active', item === button));
      container.querySelectorAll('[data-pane]').forEach(pane => { pane.hidden = pane.dataset.pane !== button.dataset.doc; });
    }));
    $('tsmfDownloadPackageWord')?.addEventListener('click', () => download(wordHtml(data), 'application/msword;charset=utf-8', `แผนลูกจ้างเงินบำรุง_${data.agency || 'รพสต'}_${data.fiscalYear || 'ปีงบ'}.doc`));
    $('tsmfDownloadWorkloadCsv')?.addEventListener('click', () => download(csvText(data), 'text/csv;charset=utf-8', `Workload_FTE_${data.agency || 'รพสต'}_${data.position || 'ตำแหน่ง'}.csv`));
    $('tsmfCopyMemoV2')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(memoText(data)); alert('คัดลอกร่างบันทึกแล้ว'); }
      catch { alert('คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความจากแท็บ “ร่างบันทึกเสนอ”'); }
    });
  }

  function install() {
    const root = $(ROOT_ID);
    if (!root || !$('#tsmfWorkloadBody') || !$('#tsmfBuildPrompt') || root.dataset[FEATURE_FLAG] === '1') return false;
    injectStyles();
    root.dataset[FEATURE_FLAG] = '1';
    const wizard = groupIntoWizard(root);
    if (!wizard) return false;

    const packageCard = document.createElement('div');
    packageCard.className = 'tsmf-package-card'; packageCard.id = 'tsmfAutoPackage';
    packageCard.innerHTML = '<h4>5) ตรวจและสร้างเอกสาร</h4><p>กรอกข้อมูลขั้น 1–4 แล้วกด “สร้างชุดเอกสารอัตโนมัติ”</p>';
    wizard.panels[4].prepend(packageCard);

    const controls = document.createElement('div');
    controls.className = 'tsmf-wizard-controls';
    controls.innerHTML = `<div class="left"><button type="button" class="tsmf-wizard-prev" id="tsmfWizardPrev">← ก่อนหน้า</button><button type="button" class="tsmf-wizard-all" id="tsmfWizardAll">ดูทั้งหมด</button></div><div class="right"><button type="button" class="tsmf-wizard-next" id="tsmfGeneratePackage">สร้างชุดเอกสารอัตโนมัติ</button><button type="button" class="tsmf-wizard-next" id="tsmfWizardNext">ถัดไป →</button></div>`;
    root.appendChild(controls);

    let current = 0;
    let showAll = false;
    const stepButtons = [...wizard.nav.querySelectorAll('.tsmf-step-btn')];
    const status = $('#tsmfWizardStatus');

    const updateStatus = () => {
      const data = collectData();
      const checks = completeness(data);
      const ok = checks.filter(([, valueOk]) => valueOk).length;
      if (status) status.textContent = `ความครบถ้วนเบื้องต้น ${ok}/${checks.length} รายการ · ช่อง “ตรวจหลักเกณฑ์ล่าสุด” ต้องยืนยันจากเอกสารทางการก่อนใช้จริง`;
      stepButtons.forEach((button, index) => {
        const requiredByStep = index === 0 ? [data.agency, data.fiscalYear, data.position, data.actualFte]
          : index === 1 ? [data.rows.length && data.netHours]
          : index === 2 ? [data.needReason, data.impactNoHire]
          : index === 3 ? [data.proposedHeadcount !== null, data.rate !== null, data.units !== null, data.fundBalance !== null]
          : [ok >= checks.length - 1];
        button.classList.toggle('done', requiredByStep.every(Boolean));
      });
    };

    const showStep = index => {
      current = Math.max(0, Math.min(wizard.panels.length - 1, index));
      wizard.panels.forEach((panel, panelIndex) => { panel.hidden = !showAll && panelIndex !== current; });
      stepButtons.forEach((button, buttonIndex) => button.classList.toggle('active', !showAll && buttonIndex === current));
      $('tsmfWizardPrev').disabled = !showAll && current === 0;
      $('tsmfWizardNext').textContent = current === wizard.panels.length - 1 ? 'กลับขั้นแรก ↺' : 'ถัดไป →';
      updateStatus();
      wizard.shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    stepButtons.forEach((button, index) => button.addEventListener('click', () => { showAll = false; $('tsmfWizardAll').textContent = 'ดูทั้งหมด'; showStep(index); }));
    $('tsmfWizardPrev').addEventListener('click', () => { showAll = false; $('tsmfWizardAll').textContent = 'ดูทั้งหมด'; showStep(current - 1); });
    $('tsmfWizardNext').addEventListener('click', () => { showAll = false; $('tsmfWizardAll').textContent = 'ดูทั้งหมด'; showStep(current === wizard.panels.length - 1 ? 0 : current + 1); });
    $('tsmfWizardAll').addEventListener('click', () => {
      showAll = !showAll; wizard.panels.forEach(panel => { panel.hidden = !showAll; });
      stepButtons.forEach(button => button.classList.remove('active'));
      $('tsmfWizardAll').textContent = showAll ? 'กลับแบบทีละขั้น' : 'ดูทั้งหมด'; updateStatus();
    });
    $('tsmfGeneratePackage').addEventListener('click', () => {
      $('tsmfCalculate')?.click();
      const data = collectData(); renderPackage(packageCard, data); showAll = false; $('tsmfWizardAll').textContent = 'ดูทั้งหมด'; showStep(4);
    });
    root.addEventListener('input', updateStatus); root.addEventListener('change', updateStatus);
    showStep(0);
    return true;
  }

  const observer = new MutationObserver(() => install());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();

  window.GovPromptTempStaffGuidedWorkflow = Object.freeze({
    version: '2.0.0', collectData, completeness, recommendation, workloadTableText, memoText, summaryText
  });
})();
