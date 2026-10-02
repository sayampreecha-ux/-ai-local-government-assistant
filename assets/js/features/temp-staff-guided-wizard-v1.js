(() => {
  'use strict';

  const TAB_ID = 'tempStaffGuidedWizardTab';
  const STYLE_ID = 'tempStaffGuidedWizardStyles';
  const API = () => window.GovPromptTempStaffPlan || {};

  const parseNumber = value => {
    const cleaned = String(value ?? '').replace(/,/g, '').trim();
    if (!cleaned) return null;
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  };
  const round = (value, digits = 2) => Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 10 ** digits) / 10 ** digits : null;
  const money = value => Number.isFinite(value) ? new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value) : '-';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));

  function calculate(input = {}) {
    const rows = Array.isArray(input.workloadRows) ? input.workloadRows : [];
    const workloadHours = rows.reduce((sum, row) => {
      const quantity = parseNumber(row.quantity);
      const minutes = parseNumber(row.minutes);
      return sum + (quantity !== null && minutes !== null && quantity >= 0 && minutes >= 0 ? quantity * minutes / 60 : 0);
    }, 0);
    const netHours = parseNumber(input.netHoursPerFte);
    const actualFte = parseNumber(input.actualFte);
    const requiredFte = netHours !== null && netHours > 0 ? workloadHours / netHours : null;
    const gapFte = requiredFte !== null && actualFte !== null && actualFte >= 0 ? requiredFte - actualFte : null;
    const suggestedHeadcount = gapFte === null ? null : Math.max(0, Math.ceil(gapFte));
    const rate = parseNumber(input.rate);
    const proposedHeadcount = parseNumber(input.proposedHeadcount);
    const units = parseNumber(input.units);
    const annualBudget = [rate, proposedHeadcount, units].every(value => value !== null && value >= 0) ? rate * proposedHeadcount * units : null;
    const fundBalance = parseNumber(input.fundBalance);
    const avgIncome = parseNumber(input.avgIncome);
    const essentialExpense = parseNumber(input.essentialExpense);
    const postBudgetBalance = annualBudget !== null && fundBalance !== null ? fundBalance - annualBudget : null;
    const projectedBalance = [annualBudget, fundBalance, avgIncome, essentialExpense].every(value => value !== null)
      ? fundBalance + avgIncome - essentialExpense - annualBudget
      : null;
    return Object.freeze({
      workloadHours: round(workloadHours),
      requiredFte: requiredFte === null ? null : round(requiredFte),
      gapFte: gapFte === null ? null : round(gapFte),
      suggestedHeadcount,
      annualBudget: annualBudget === null ? null : round(annualBudget),
      postBudgetBalance: postBudgetBalance === null ? null : round(postBudgetBalance),
      projectedBalance: projectedBalance === null ? null : round(projectedBalance)
    });
  }

  function evaluate(input = {}, result = calculate(input)) {
    const missing = [];
    if (!String(input.agency || '').trim()) missing.push('ชื่อหน่วยบริการ');
    if (!String(input.position || '').trim()) missing.push('ตำแหน่ง');
    if (!(input.workloadRows || []).some(row => String(row.activity || '').trim() && parseNumber(row.quantity) !== null && parseNumber(row.minutes) !== null)) missing.push('Workload ที่วัดได้');
    if (parseNumber(input.netHoursPerFte) === null) missing.push('ชั่วโมงสุทธิต่อ 1 FTE ที่มีฐานอ้างอิง');
    if (parseNumber(input.actualFte) === null) missing.push('กำลังคนที่มีจริง');
    if (missing.length) return Object.freeze({ code:'incomplete', label:'ข้อมูลยังไม่พอเสนออนุมัติ', detail:`กรอกเพิ่ม: ${missing.join(', ')}` });
    if (result.gapFte !== null && result.gapFte <= 0) return Object.freeze({ code:'no-gap', label:'ยังไม่ควรเสนอจ้างจาก FTE เพียงอย่างเดียว', detail:'ผลคำนวณยังไม่พบส่วนขาดกำลังคน ควรทบทวนภาระงานเฉพาะ/คุณภาพบริการก่อนเสนอจ้าง' });
    if (result.gapFte !== null && result.gapFte > 0) {
      if (result.postBudgetBalance !== null && result.postBudgetBalance < 0) return Object.freeze({ code:'fund-shortfall', label:'มีส่วนขาดกำลังคน แต่เงินบำรุงไม่พอรองรับวงเงินจ้าง', detail:'ควรปรับจำนวน/ระยะเวลาจ้าง หรือทบทวนแหล่งเงินและรายจ่ายจำเป็นก่อน' });
      if (!input.inSpendingPlan) return Object.freeze({ code:'plan-pending', label:'มีเหตุผลด้านกำลังคน แต่ยังต้องตรวจ/บรรจุในแผนเงินบำรุง', detail:'ยังไม่ควรดำเนินการจ้างจนกว่าจะยืนยันแผนการใช้จ่ายเงินบำรุงและอำนาจอนุมัติ' });
      return Object.freeze({ code:'consider', label:'มีเหตุผลเสนอพิจารณาจ้าง', detail:'มีส่วนขาดตาม Workload/FTE และผ่านเงื่อนไขแผนเบื้องต้น ทั้งนี้ต้องตรวจหลักเกณฑ์ตำแหน่ง อัตราค่าจ้าง และอำนาจอนุมัติฉบับล่าสุดก่อนดำเนินการ' });
    }
    return Object.freeze({ code:'review', label:'ต้องทบทวนข้อมูลก่อนเสนอ', detail:'ระบบยังประเมินส่วนขาดกำลังคนไม่ได้ครบถ้วน' });
  }

  function buildDocuments(input = {}, result = calculate(input)) {
    const decision = evaluate(input, result);
    const rows = (input.workloadRows || []).filter(row => row.activity || row.quantity || row.minutes);
    const workloadTable = rows.map((row, index) => {
      const quantity = parseNumber(row.quantity);
      const minutes = parseNumber(row.minutes);
      const hours = quantity !== null && minutes !== null ? round(quantity * minutes / 60) : null;
      return `${index + 1}. ${row.activity || '-'} | ${row.unit || '-'} | ${row.quantity || '-'} | ${row.minutes || '-'} นาที | ${hours ?? '-'} ชม./ปี`;
    }).join('\n') || '[ยังไม่มีข้อมูล Workload]';
    const altText = [
      ['เกลี่ยงานภายใน', input.redistribute],
      ['ใช้บุคลากรร่วม/Cluster', input.cluster],
      ['ใช้เทคโนโลยีลดภาระงาน', input.technology],
      ['จ้างบริการ/ทางเลือกอื่น', input.outsource]
    ].map(([label, value]) => `- ${label}: ${value || 'ยังไม่ได้ประเมิน'}`).join('\n');

    const analysis = [
      'สรุปวิเคราะห์ค่างานและความจำเป็นในการจ้างลูกจ้างชั่วคราวเงินบำรุง',
      `หน่วยบริการ: ${input.agency || '-'}`,
      `ปีงบประมาณ: ${input.fiscalYear || '-'}`,
      `ตำแหน่ง: ${input.position || '-'}`,
      `ประชากรรับผิดชอบ: ${input.population || '-'} คน | ผู้รับบริการ: ${input.annualServices || '-'} ครั้ง/ปี`,
      '',
      '1. ภาระงานที่วัดได้', workloadTable,
      '',
      '2. ผลวิเคราะห์กำลังคน',
      `- Workload รวม: ${result.workloadHours ?? '-'} ชั่วโมง/ปี`,
      `- ชั่วโมงสุทธิต่อ 1 FTE/ปี: ${input.netHoursPerFte || '-'} (ต้องมีฐานอ้างอิงที่หน่วยงานยอมรับ)`,
      `- FTE ที่ต้องใช้: ${result.requiredFte ?? '-'}`,
      `- FTE ที่มีจริง: ${input.actualFte || '-'}`,
      `- ส่วนขาด/เกิน: ${result.gapFte ?? '-'} FTE`,
      `- จำนวนจากการคำนวณ: ${result.suggestedHeadcount ?? '-'} คน (ไม่ใช่คำสั่งให้จ้าง)`,
      '',
      '3. ทางเลือกก่อนจ้าง', altText,
      '',
      '4. งบประมาณ',
      `- รูปแบบจ้าง: ${input.employmentType || '-'}`,
      `- เสนอจ้าง: ${input.proposedHeadcount || '-'} คน`,
      `- อัตราค่าจ้าง/หน่วย: ${input.rate || '-'} บาท`,
      `- จำนวนหน่วยในปี: ${input.units || '-'}`,
      `- วงเงินรวม: ${result.annualBudget ?? '-'} บาท`,
      `- เงินบำรุงคงเหลือ: ${input.fundBalance || '-'} บาท`,
      `- คงเหลือหลังวงเงินจ้าง: ${result.postBudgetBalance ?? '-'} บาท`,
      `- ประมาณการคงเหลือหลังรวมรายรับ/รายจ่ายจำเป็น: ${result.projectedBalance ?? '-'} บาท`,
      '',
      `5. ผลประเมินเบื้องต้น: ${decision.label}`,
      decision.detail,
      '',
      'หมายเหตุ: ต้องตรวจหลักเกณฑ์กระทรวงสาธารณสุข กระทรวงมหาดไทย/กรมส่งเสริมการปกครองท้องถิ่น อัตราค่าจ้าง คุณสมบัติตำแหน่ง แผนเงินบำรุง และอำนาจอนุมัติฉบับล่าสุดก่อนใช้เป็นฐานดำเนินการจริง'
    ].join('\n');

    const memo = [
      'บันทึกข้อความ',
      `ส่วนราชการ ${input.agency || '[ระบุหน่วยบริการ]'}`,
      'ที่ ............................................................ วันที่ ............................................................',
      `เรื่อง ขอพิจารณาความเห็นชอบแผนความต้องการลูกจ้างชั่วคราวจากเงินบำรุง ตำแหน่ง ${input.position || '[ระบุตำแหน่ง]'}`,
      'เรียน ผู้มีอำนาจพิจารณา',
      '',
      `ด้วย ${input.agency || 'หน่วยบริการ'} มีภารกิจให้บริการสาธารณสุขแก่ประชาชนในพื้นที่รับผิดชอบ จำนวน ${input.population || '[ระบุ]'} คน มีผู้รับบริการรวมประมาณ ${input.annualServices || '[ระบุ]'} ครั้งต่อปี และได้วิเคราะห์ภาระงานของตำแหน่ง ${input.position || '[ระบุ]'} จากปริมาณกิจกรรมและเวลาปฏิบัติงานที่ตรวจสอบได้แล้ว`,
      '',
      `ผลการวิเคราะห์พบภาระงานรวม ${result.workloadHours ?? '[ยังคำนวณไม่ได้]'} ชั่วโมงต่อปี คิดเป็นกำลังคนที่ต้องใช้ ${result.requiredFte ?? '[ยังคำนวณไม่ได้]'} FTE ขณะที่มีกำลังคนปฏิบัติงานจริง ${input.actualFte || '[ระบุ]'} FTE จึงมีส่วนขาด/เกิน ${result.gapFte ?? '[ยังคำนวณไม่ได้]'} FTE โดยได้พิจารณาการเกลี่ยงาน การใช้บุคลากรร่วม และทางเลือกอื่นก่อนการจ้างแล้วตามเอกสารวิเคราะห์แนบท้าย`,
      '',
      `หากเสนอจ้างจำนวน ${input.proposedHeadcount || '[ระบุ]'} อัตรา ในรูปแบบ ${input.employmentType || '[ระบุ]'} อัตราค่าจ้าง ${input.rate || '[ระบุ]'} บาทต่อหน่วย จำนวน ${input.units || '[ระบุ]'} หน่วย คิดเป็นวงเงินประมาณ ${result.annualBudget ?? '[ยังคำนวณไม่ได้]'} บาท ซึ่ง${input.inSpendingPlan ? 'ได้ยืนยันเบื้องต้นว่าอยู่ในแผนการใช้จ่ายเงินบำรุงแล้ว' : 'ยังต้องตรวจสอบ/ดำเนินการให้สอดคล้องกับแผนการใช้จ่ายเงินบำรุงก่อน'}`,
      '',
      `ผลประเมินเบื้องต้นของระบบ: ${decision.label} — ${decision.detail}`,
      '',
      'จึงเรียนมาเพื่อโปรดพิจารณา โดยก่อนดำเนินการสรรหาและจ้าง ให้ตรวจสอบหลักเกณฑ์ที่ใช้บังคับล่าสุดเกี่ยวกับประเภทตำแหน่ง คุณสมบัติ อัตราค่าจ้าง แผนการใช้จ่ายเงินบำรุง และอำนาจอนุมัติให้ครบถ้วนอีกครั้ง',
      '',
      'ลงชื่อ ............................................................',
      '(............................................................)',
      'ตำแหน่ง ............................................................'
    ].join('\n');

    return Object.freeze({ analysis, memo, decision });
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .tsgw-progress{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:12px 0}.tsgw-step-pill{padding:8px 5px;border-radius:10px;background:#edf2f7;text-align:center;font-size:12px}.tsgw-step-pill.active{background:#0b3b75;color:#fff}.tsgw-card{border:1px solid #dfe7f1;border-radius:14px;padding:14px;background:#fff}.tsgw-card[hidden]{display:none}.tsgw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tsgw-grid .full{grid-column:1/-1}.tsgw-card label{display:block;font-weight:700;margin-bottom:5px}.tsgw-card input,.tsgw-card select,.tsgw-card textarea{width:100%;border:1px solid #d6e0eb;border-radius:9px;padding:10px;font:inherit;background:#fff}.tsgw-card textarea{min-height:74px}.tsgw-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.tsgw-btn{border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}.tsgw-primary{background:#0b3b75;color:#fff}.tsgw-secondary{background:#edf2f7;color:#10233f}.tsgw-danger{background:#fff4e5;color:#7a4900}.tsgw-table{width:100%;border-collapse:collapse;min-width:680px}.tsgw-table th,.tsgw-table td{border-bottom:1px solid #e5ebf2;padding:7px;vertical-align:top}.tsgw-table input{min-width:90px}.tsgw-table-wrap{overflow:auto}.tsgw-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}.tsgw-metric{background:#f4f7fb;border-radius:10px;padding:10px}.tsgw-metric small{display:block;color:#607087}.tsgw-metric strong{font-size:16px}.tsgw-result{border-left:4px solid #0b3b75;background:#f4f8fd;padding:12px;border-radius:8px;margin:10px 0}.tsgw-output{white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;max-height:360px;overflow:auto}.tsgw-note{font-size:12px;color:#64748b}.tsgw-remove{border:0;background:#fff0f0;color:#a21c1c;border-radius:8px;padding:7px;cursor:pointer}@media(max-width:650px){.tsgw-progress{grid-template-columns:1fr}.tsgw-step-pill:not(.active){display:none}.tsgw-grid{grid-template-columns:1fr}.tsgw-grid .full{grid-column:auto}.tsgw-metrics{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function value(id) { return document.getElementById(id)?.value?.trim() || ''; }
  function workloadRows() {
    return [...document.querySelectorAll('#tsgwWorkloadBody tr')].map(row => ({
      activity: row.querySelector('.tsgw-activity')?.value.trim() || '', unit: row.querySelector('.tsgw-unit')?.value.trim() || '',
      quantity: row.querySelector('.tsgw-quantity')?.value.trim() || '', minutes: row.querySelector('.tsgw-minutes')?.value.trim() || ''
    }));
  }
  function readForm() {
    return {
      agency:value('tsgwAgency'), fiscalYear:value('tsgwFiscalYear'), population:value('tsgwPopulation'), annualServices:value('tsgwAnnualServices'), position:value('tsgwPosition'),
      actualFte:value('tsgwActualFte'), netHoursPerFte:value('tsgwNetHours'), workloadRows:workloadRows(), redistribute:value('tsgwRedistribute'), cluster:value('tsgwCluster'), technology:value('tsgwTechnology'), outsource:value('tsgwOutsource'),
      employmentType:value('tsgwEmploymentType'), proposedHeadcount:value('tsgwProposedHeadcount'), rate:value('tsgwRate'), units:value('tsgwUnits'), fundBalance:value('tsgwFundBalance'), avgIncome:value('tsgwAvgIncome'), essentialExpense:value('tsgwEssentialExpense'),
      inSpendingPlan:Boolean(document.getElementById('tsgwInPlan')?.checked)
    };
  }

  function addRow(initial = {}) {
    const body = document.getElementById('tsgwWorkloadBody'); if (!body) return;
    const row = document.createElement('tr');
    row.innerHTML = `<td><input class="tsgw-activity" placeholder="เช่น เยี่ยมบ้าน" value="${esc(initial.activity || '')}"></td><td><input class="tsgw-unit" placeholder="ครั้ง/ราย" value="${esc(initial.unit || '')}"></td><td><input class="tsgw-quantity" inputmode="decimal" placeholder="0" value="${esc(initial.quantity || '')}"></td><td><input class="tsgw-minutes" inputmode="decimal" placeholder="0" value="${esc(initial.minutes || '')}"></td><td class="tsgw-hours">-</td><td><button type="button" class="tsgw-remove">ลบ</button></td>`;
    body.appendChild(row);
    row.querySelector('.tsgw-remove').addEventListener('click', () => { row.remove(); refresh(); });
    row.querySelectorAll('input').forEach(input => input.addEventListener('input', refresh));
    refresh();
  }

  function refresh() {
    [...document.querySelectorAll('#tsgwWorkloadBody tr')].forEach(row => {
      const q = parseNumber(row.querySelector('.tsgw-quantity')?.value), m = parseNumber(row.querySelector('.tsgw-minutes')?.value);
      row.querySelector('.tsgw-hours').textContent = q !== null && m !== null ? `${money(round(q * m / 60))}` : '-';
    });
    const input = readForm(); const result = calculate(input); const decision = evaluate(input, result);
    const metrics = document.getElementById('tsgwMetrics');
    if (metrics) metrics.innerHTML = [
      ['Workload', `${money(result.workloadHours)} ชม./ปี`], ['FTE ต้องใช้', result.requiredFte ?? '-'], ['ส่วนขาด/เกิน', result.gapFte === null ? '-' : `${result.gapFte} FTE`],
      ['จำนวนจากคำนวณ', result.suggestedHeadcount === null ? '-' : `${result.suggestedHeadcount} คน`], ['วงเงินจ้าง', `${money(result.annualBudget)} บาท`], ['คงเหลือหลังจ้าง', `${money(result.postBudgetBalance)} บาท`]
    ].map(([label, val]) => `<div class="tsgw-metric"><small>${label}</small><strong>${val}</strong></div>`).join('');
    const box = document.getElementById('tsgwDecision');
    if (box) box.innerHTML = `<strong>${esc(decision.label)}</strong><div>${esc(decision.detail)}</div>`;
  }

  function render(work) {
    injectStyles();
    const positions = API().positions || ['พยาบาลวิชาชีพ','นักวิชาการสาธารณสุข','พนักงานช่วยเหลือคนไข้','อื่น ๆ'];
    work.innerHTML = `
      <h3>✨ แบบกรอกทีละขั้น — แผนลูกจ้างเงินบำรุง</h3>
      <p class="tsgw-note">กรอก 5 ขั้น ระบบจะคำนวณ Workload/FTE ตรวจฐานะเงินบำรุง และสร้าง “สรุปวิเคราะห์ค่างาน + ร่างบันทึกขออนุมัติ” ให้โดยอัตโนมัติ</p>
      <div class="tsgw-progress">${['1 หน่วยบริการ','2 ภาระงาน','3 คน/ทางเลือก','4 เงินบำรุง','5 ตรวจและสร้างเอกสาร'].map((label,index)=>`<div class="tsgw-step-pill ${index===0?'active':''}" data-step-pill="${index+1}">${label}</div>`).join('')}</div>
      <section class="tsgw-card" data-step="1"><div class="tsgw-grid">
        <div><label>หน่วยบริการ/รพ.สต.</label><input id="tsgwAgency" placeholder="เช่น รพ.สต.บ้าน..."></div><div><label>ปีงบประมาณ</label><input id="tsgwFiscalYear" inputmode="numeric" placeholder="เช่น 2570"></div>
        <div><label>ประชากรรับผิดชอบ (คน)</label><input id="tsgwPopulation" inputmode="numeric"></div><div><label>ผู้รับบริการรวม (ครั้ง/ปี)</label><input id="tsgwAnnualServices" inputmode="numeric"></div>
        <div class="full"><label>ตำแหน่งที่ต้องการวิเคราะห์</label><select id="tsgwPosition">${positions.map(item=>`<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></div>
      </div></section>
      <section class="tsgw-card" data-step="2" hidden><div class="tsgw-table-wrap"><table class="tsgw-table"><thead><tr><th>กิจกรรมหลัก</th><th>หน่วย</th><th>ปริมาณ/ปี</th><th>นาที/หน่วย</th><th>ชม./ปี</th><th></th></tr></thead><tbody id="tsgwWorkloadBody"></tbody></table></div><div class="tsgw-actions"><button type="button" id="tsgwAddRow" class="tsgw-btn tsgw-secondary">+ เพิ่มกิจกรรม</button></div><p class="tsgw-note">ใช้ปริมาณงานจริง/ข้อมูลบริการที่ตรวจสอบย้อนกลับได้ ไม่ควรใส่ตัวเลขประมาณแบบไม่มีหลักฐาน</p></section>
      <section class="tsgw-card" data-step="3" hidden><div class="tsgw-grid">
        <div><label>บุคลากรที่มีจริง (FTE)</label><input id="tsgwActualFte" inputmode="decimal" placeholder="เช่น 1 หรือ 0.5"></div><div><label>ชั่วโมงทำงานสุทธิต่อ 1 FTE/ปี</label><input id="tsgwNetHours" inputmode="decimal" placeholder="กรอกค่าที่มีฐานอ้างอิง"></div>
        <div><label>เกลี่ยงานภายในได้หรือไม่</label><select id="tsgwRedistribute"><option>ยังไม่ได้ประเมิน</option><option>ไม่ได้/ไม่เพียงพอ</option><option>ได้บางส่วน</option><option>ได้ทั้งหมด</option></select></div>
        <div><label>ใช้บุคลากรร่วม/Cluster</label><select id="tsgwCluster"><option>ยังไม่ได้ประเมิน</option><option>ไม่ได้</option><option>ได้บางช่วง</option><option>ได้เพียงพอ</option></select></div>
        <div><label>ใช้เทคโนโลยีลดงาน</label><select id="tsgwTechnology"><option>ยังไม่ได้ประเมิน</option><option>ไม่ได้</option><option>ได้บางส่วน</option><option>ลดงานได้มาก</option></select></div>
        <div><label>จ้างบริการ/ทางเลือกอื่น</label><select id="tsgwOutsource"><option>ยังไม่ได้ประเมิน</option><option>ไม่เหมาะสม</option><option>พอใช้แทนได้บางส่วน</option><option>ใช้แทนการจ้างได้</option></select></div>
      </div><p class="tsgw-note">ระบบไม่กำหนดชั่วโมง FTE ให้เอง เพราะต้องใช้ฐานอ้างอิงที่หน่วยงานยอมรับ</p></section>
      <section class="tsgw-card" data-step="4" hidden><div class="tsgw-grid">
        <div><label>รูปแบบจ้าง</label><select id="tsgwEmploymentType"><option>รายเดือน</option><option>รายวัน</option><option>รายคาบ</option></select></div><div><label>จำนวนที่เสนอจ้าง (คน)</label><input id="tsgwProposedHeadcount" inputmode="numeric" placeholder="0"></div>
        <div><label>อัตราค่าจ้าง/หน่วย (บาท)</label><input id="tsgwRate" inputmode="decimal" placeholder="ต้องตรวจอัตราล่าสุด"></div><div><label>จำนวนหน่วยในปี (เดือน/วัน/คาบ)</label><input id="tsgwUnits" inputmode="decimal"></div>
        <div><label>เงินบำรุงคงเหลือ (บาท)</label><input id="tsgwFundBalance" inputmode="decimal"></div><div><label>รายรับเงินบำรุงเฉลี่ย/ปี</label><input id="tsgwAvgIncome" inputmode="decimal"></div>
        <div><label>รายจ่ายจำเป็นเฉลี่ย/ปี</label><input id="tsgwEssentialExpense" inputmode="decimal"></div><div><label><input id="tsgwInPlan" type="checkbox" style="width:auto"> ยืนยันว่าอยู่ในแผนการใช้จ่ายเงินบำรุง</label></div>
      </div></section>
      <section class="tsgw-card" data-step="5" hidden><div id="tsgwMetrics" class="tsgw-metrics"></div><div id="tsgwDecision" class="tsgw-result"></div>
        <div class="tsgw-actions"><button type="button" id="tsgwGenerate" class="tsgw-btn tsgw-primary">สร้างเอกสาร</button><button type="button" id="tsgwCopyAnalysis" class="tsgw-btn tsgw-secondary">คัดลอกตาราง/สรุป</button><button type="button" id="tsgwCopyMemo" class="tsgw-btn tsgw-secondary">คัดลอกบันทึก</button><button type="button" id="tsgwDownloadDoc" class="tsgw-btn tsgw-secondary">ดาวน์โหลด Word (.doc)</button></div>
        <h4>สรุปวิเคราะห์ค่างาน</h4><div id="tsgwAnalysis" class="tsgw-output">กด “สร้างเอกสาร”</div><h4>ร่างบันทึกขออนุมัติ</h4><div id="tsgwMemo" class="tsgw-output">กด “สร้างเอกสาร”</div>
      </section>
      <div class="tsgw-actions"><button type="button" id="tsgwPrev" class="tsgw-btn tsgw-secondary" disabled>← ก่อนหน้า</button><button type="button" id="tsgwNext" class="tsgw-btn tsgw-primary">ถัดไป →</button></div>
      <p class="tsgw-note">⚠️ ผลระบบเป็นเอกสารประกอบการพิจารณา ไม่ใช่การอนุมัติอัตรา และไม่แทนการตรวจหลักเกณฑ์ สธ./มท./สถ. ฉบับล่าสุด</p>`;

    let step = 1;
    const showStep = next => {
      step = Math.max(1, Math.min(5, next));
      work.querySelectorAll('[data-step]').forEach(card => card.hidden = Number(card.dataset.step) !== step);
      work.querySelectorAll('[data-step-pill]').forEach(pill => pill.classList.toggle('active', Number(pill.dataset.stepPill) === step));
      document.getElementById('tsgwPrev').disabled = step === 1;
      document.getElementById('tsgwNext').style.display = step === 5 ? 'none' : '';
      refresh();
    };
    document.getElementById('tsgwPrev').addEventListener('click', () => showStep(step - 1));
    document.getElementById('tsgwNext').addEventListener('click', () => showStep(step + 1));
    document.getElementById('tsgwAddRow').addEventListener('click', () => addRow());
    work.querySelectorAll('input,select,textarea').forEach(control => control.addEventListener('input', refresh));
    document.getElementById('tsgwGenerate').addEventListener('click', () => {
      const docs = buildDocuments(readForm()); document.getElementById('tsgwAnalysis').textContent = docs.analysis; document.getElementById('tsgwMemo').textContent = docs.memo; refresh();
    });
    const copy = async id => { const text = document.getElementById(id)?.textContent || ''; if (!text || /กด “สร้างเอกสาร”/.test(text)) return alert('กรุณาสร้างเอกสารก่อน'); try { await navigator.clipboard.writeText(text); alert('คัดลอกแล้ว'); } catch { alert('คัดลอกไม่สำเร็จ'); } };
    document.getElementById('tsgwCopyAnalysis').addEventListener('click', () => copy('tsgwAnalysis'));
    document.getElementById('tsgwCopyMemo').addEventListener('click', () => copy('tsgwMemo'));
    document.getElementById('tsgwDownloadDoc').addEventListener('click', () => {
      const docs = buildDocuments(readForm()); const html = `<!doctype html><html><head><meta charset="utf-8"><title>แผนลูกจ้างเงินบำรุง</title></head><body style="font-family:Tahoma,sans-serif;white-space:pre-wrap"><h2>สรุปวิเคราะห์ค่างาน</h2><div>${esc(docs.analysis).replace(/\n/g,'<br>')}</div><hr><h2>ร่างบันทึกขออนุมัติ</h2><div>${esc(docs.memo).replace(/\n/g,'<br>')}</div></body></html>`; const blob = new Blob(['\ufeff', html], { type:'application/msword;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`แผนลูกจ้างเงินบำรุง_${(readForm().agency || 'รพสต').replace(/[^ก-๙A-Za-z0-9_-]+/g,'_')}.doc`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    addRow(); addRow(); showStep(1);
  }

  function attach() {
    if (document.getElementById(TAB_ID)) return true;
    const tabs = document.getElementById('hwtTabs'); const work = document.getElementById('hwtWork');
    if (!tabs || !work) return false;
    const button = document.createElement('button'); button.type='button'; button.id=TAB_ID; button.className='hwt-tool tsgw-tab'; button.dataset.hwt='temp-staff-guided-wizard'; button.innerHTML='<strong>✨ กรอกทีละขั้น</strong><small>Workload/FTE → เงินบำรุง → สรุปค่างาน → บันทึกขออนุมัติ</small>';
    button.addEventListener('click', event => { event.stopPropagation(); document.querySelectorAll('#hwtTabs .hwt-tool').forEach(item => item.classList.toggle('active', item === button)); render(work); });
    const planner = document.getElementById('tempStaffMaintenanceFundTab'); planner?.insertAdjacentElement('afterend', button) || tabs.appendChild(button);
    return true;
  }

  const api = Object.freeze({ calculate, evaluate, buildDocuments, attach });
  window.GovPromptTempStaffWizard = api;
  if (!attach()) {
    const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 15000);
  }
})();
