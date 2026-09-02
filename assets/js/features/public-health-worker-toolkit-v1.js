(() => {
  'use strict';

  const TOOLBOX_ID = 'healthWorkerToolkitPanel';
  const TASK_ID = 'healthWorkerToolkitTask';

  const n = value => Number(String(value ?? '').replace(/,/g, '').trim());
  const validPositive = value => Number.isFinite(value) && value > 0;
  const round = (value, digits = 2) => Number(value).toFixed(digits);

  function bmi(weightKg, heightCm) {
    const weight = n(weightKg);
    const height = n(heightCm) / 100;
    if (!validPositive(weight) || !validPositive(height)) return null;
    return weight / (height * height);
  }

  function rate(numerator, denominator, multiplier = 100) {
    const a = n(numerator);
    const b = n(denominator);
    const m = n(multiplier);
    if (!Number.isFinite(a) || a < 0 || !validPositive(b) || !validPositive(m)) return null;
    return (a / b) * m;
  }

  const coverage = (done, target) => rate(done, target, 100);
  const attackRate = (cases, exposed) => rate(cases, exposed, 100);
  const incidence = (cases, population, multiplier = 100000) => rate(cases, population, multiplier);

  const PROMPT_TOOLS = Object.freeze([
    { id: 'ncd', icon: '📊', title: 'สรุปคัดกรอง NCD', desc: 'สรุปจำนวนคัดกรอง กลุ่มเสี่ยง ผลงาน และแผนติดตามจากข้อมูลรวม', task: 'จัดทำสรุปผลการคัดกรองโรคไม่ติดต่อเรื้อรัง (NCD) ระดับพื้นที่' },
    { id: 'homevisit', icon: '🏠', title: 'รายงานเยี่ยมบ้าน', desc: 'จัดบันทึกเยี่ยมบ้านแบบไม่ระบุตัวบุคคล พร้อมงานติดตาม', task: 'จัดทำรายงานการเยี่ยมบ้านและแผนติดตามระดับชุมชน' },
    { id: 'outbreak', icon: '🦠', title: 'สรุปสอบสวนโรค/เหตุการณ์', desc: 'ช่วยเรียบเรียงสถานการณ์ ผู้สัมผัส มาตรการ และสิ่งที่ต้องประสาน', task: 'สรุปเหตุการณ์โรคติดต่อหรือเหตุการณ์ผิดปกติ และจัดทำรายการดำเนินงานควบคุมโรค' },
    { id: 'villagevol', icon: '🤝', title: 'รายงาน อสม.', desc: 'สรุปกิจกรรม อสม. ผลงาน ปัญหา และงานเดือนถัดไป', task: 'จัดทำรายงานผลการปฏิบัติงานของ อสม. และกิจกรรมสุขภาพชุมชน' },
    { id: 'environment', icon: '🚰', title: 'อนามัยสิ่งแวดล้อม', desc: 'สรุปน้ำ อาหาร ขยะ ส้วม เหตุรำคาญ และจุดต้องแก้ไข', task: 'จัดทำสรุปผลสำรวจอนามัยสิ่งแวดล้อมและสุขาภิบาลชุมชน' },
    { id: 'riskcomms', icon: '📣', title: 'สื่อสารความเสี่ยง/สุขศึกษา', desc: 'สร้างข้อความประชาสัมพันธ์ที่เข้าใจง่าย ไม่ขู่ ไม่แต่งข้อมูล', task: 'จัดทำข้อความสุขศึกษาและสื่อสารความเสี่ยงสำหรับประชาชน' },
    { id: 'campaign', icon: '🗓️', title: 'แผนออกหน่วย/รณรงค์', desc: 'เช็กลิสต์ก่อน-ระหว่าง-หลังออกหน่วย พร้อมผู้รับผิดชอบและตัวชี้วัด', task: 'จัดทำแผนและเช็กลิสต์การออกหน่วยหรือรณรงค์สุขภาพชุมชน' },
    { id: 'monthly', icon: '📄', title: 'รายงานประจำเดือน/วันเพจ', desc: 'รวมผลงานเด่น ตัวเลขสำคัญ ปัญหา และแผนเดือนหน้า', task: 'จัดทำรายงานสรุปผลงานสาธารณสุขประจำเดือนหรือวันเพจผู้บริหาร' },
    { id: 'mch', icon: '👶', title: 'แม่และเด็ก', desc: 'สรุปกิจกรรมฝากครรภ์ หลังคลอด เด็กปฐมวัย และงานติดตามจากข้อมูลรวม', task: 'จัดทำสรุปงานอนามัยแม่และเด็กจากข้อมูลสรุประดับพื้นที่' },
    { id: 'ltc', icon: '👵', title: 'ผู้สูงอายุ/LTC', desc: 'สรุปกิจกรรมดูแลผู้สูงอายุ ผู้มีภาวะพึ่งพิง และแผนเยี่ยมติดตาม', task: 'จัดทำสรุปงานผู้สูงอายุและการดูแลระยะยาวจากข้อมูลรวม' },
    { id: 'school', icon: '🏫', title: 'โรงเรียน/ศูนย์เด็กเล็ก', desc: 'สรุปคัดกรอง กิจกรรมสุขศึกษา สุขาภิบาล และงานติดตาม', task: 'จัดทำสรุปกิจกรรมส่งเสริมสุขภาพในโรงเรียนหรือศูนย์พัฒนาเด็กเล็ก' }
  ]);

  function genericPrompt(tool, input = {}) {
    return [
      'บทบาท',
      'คุณเป็นผู้ช่วยงานสาธารณสุขปฐมภูมิและ รพ.สต. ของประเทศไทย ช่วยจัดข้อมูลและร่างงานให้เจ้าหน้าที่ตรวจสอบก่อนใช้จริง',
      '',
      'ภารกิจ',
      tool.task,
      '',
      'ข้อมูลที่ผู้ใช้ให้',
      `- หน่วยงาน/พื้นที่: ${input.agency || '[ยังไม่ได้ระบุ]'}`,
      `- ช่วงเวลา: ${input.period || '[ยังไม่ได้ระบุ]'}`,
      `- กลุ่มเป้าหมาย/ขอบเขต: ${input.target || '[ยังไม่ได้ระบุ]'}`,
      `- ข้อมูลสรุป/ข้อเท็จจริง: ${input.facts || '[ยังไม่ได้ระบุ]'}`,
      `- ปัญหา/สิ่งที่ต้องติดตาม: ${input.issue || '[ยังไม่ได้ระบุ]'}`,
      `- ผลลัพธ์ที่ต้องการ: ${input.output || 'สรุปพร้อมใช้ กระชับ และมีรายการดำเนินงานต่อ'}`,
      '',
      'ข้อกำหนด',
      '- ใช้เฉพาะข้อมูลที่ผู้ใช้ให้ ห้ามสร้างจำนวนผู้ป่วย สถิติ ผลตรวจ ชื่อบุคคล หรือข้อเท็จจริงเพิ่มเอง',
      '- แยกข้อเท็จจริง สรุปผล ปัญหา งานติดตาม ผู้รับผิดชอบ/ผู้ประสาน และข้อเสนอแนะเมื่อเหมาะสม',
      '- หากต้องอ้างเกณฑ์วิชาการ กฎหมาย หรือแนวทาง ให้ระบุว่าต้องตรวจฉบับที่หน่วยงานใช้อยู่ก่อนนำไปใช้',
      '- ไม่วินิจฉัยโรค ไม่สั่งยา ไม่กำหนดขนาดยา และไม่แทนดุลยพินิจของบุคลากรสุขภาพ',
      '- หากข้อมูลบ่งชี้เหตุฉุกเฉินหรืออาการรุนแรง ให้แนะนำให้ปฏิบัติตามระบบส่งต่อ/แนวทางฉุกเฉินของหน่วยบริการ โดยไม่วินิจฉัยแทน',
      '- คำนึงถึง PDPA: ใช้ข้อมูลรวม/ข้อมูลไม่ระบุตัวบุคคล และตัดชื่อ เลขบัตร เบอร์โทร ที่อยู่เฉพาะบุคคล ประวัติการรักษา และข้อมูลสุขภาพที่ไม่จำเป็น',
      '- ใช้ภาษาไทยอ่านง่าย เหมาะกับงานราชการและงาน รพ.สต.'
    ].join('\n');
  }

  const api = Object.freeze({ bmi, rate, coverage, attackRate, incidence, genericPrompt, promptTools: PROMPT_TOOLS });
  if (typeof window === 'object') window.GovPromptPublicHealthToolkit = api;
  if (typeof document !== 'object') return;

  function injectStyles() {
    if (document.getElementById('healthWorkerToolkitStyles')) return;
    const style = document.createElement('style');
    style.id = 'healthWorkerToolkitStyles';
    style.textContent = `
      .health-worker-toolkit-task{border-color:#7ab6a2!important;background:linear-gradient(135deg,#f0fbf6,#f1f7ff)!important}
      .hwt-panel{margin-top:16px;background:#fff;border:1px solid #c7dbe7;border-radius:16px;padding:15px;box-shadow:0 8px 24px rgba(11,59,117,.06)}
      .hwt-panel[hidden]{display:none!important}.hwt-panel h2{margin:0 0 4px;color:#0b3b75;font-size:21px}.hwt-sub{margin:0 0 12px;color:#5b6c80}
      .hwt-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.hwt-tool{border:1px solid #d8e3ec;background:#fff;border-radius:12px;padding:11px;text-align:left;font:inherit;cursor:pointer}.hwt-tool strong{display:block;color:#163b63}.hwt-tool small{display:block;margin-top:4px;color:#65758b;line-height:1.35}.hwt-tool.active{border-color:#0b3b75;background:#f2f7fc;box-shadow:0 0 0 2px #dbe8f7}
      .hwt-work{margin-top:12px;border-top:1px solid #e4eaf2;padding-top:12px}.hwt-work label{display:block;font-weight:750;margin:8px 0 5px}.hwt-work input,.hwt-work textarea,.hwt-work select{width:100%;border:1px solid #d8e1ec;border-radius:10px;padding:10px;font:inherit}.hwt-work textarea{min-height:105px;resize:vertical}.hwt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.hwt-full{grid-column:1/-1}
      .hwt-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.hwt-actions button{border:0;border-radius:10px;padding:10px 13px;font:inherit;font-weight:750;cursor:pointer}.hwt-primary{background:#0b3b75;color:#fff}.hwt-chat{background:#1677ff;color:#fff}.hwt-secondary{background:#edf2f7;color:#10233f}
      .hwt-result{margin-top:12px;padding:12px;border:1px solid #d6e5de;border-radius:11px;background:#f5faf8;white-space:pre-wrap;overflow-wrap:anywhere}.hwt-warning{margin-top:12px;padding:10px;border-radius:10px;background:#fff8e6;color:#664d03;font-size:12px;line-height:1.5}.hwt-privacy{margin-top:8px;padding:10px;border-radius:10px;background:#f3f7fb;color:#536579;font-size:12px;line-height:1.5}
      @media(max-width:650px){.hwt-tabs,.hwt-grid{grid-template-columns:1fr}.hwt-full{grid-column:auto}.hwt-actions button{flex:1 1 45%}}
    `;
    document.head.appendChild(style);
  }

  async function copyText(text) {
    const value = String(text || '');
    if (!value) return false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(value); return true; } catch (_) {}
    }
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    Object.assign(area.style, { position: 'fixed', left: '-9999px', top: '0', opacity: '0.01', fontSize: '16px' });
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    area.remove();
    return ok;
  }

  function createTaskButton(tasks) {
    let button = document.getElementById(TASK_ID);
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.id = TASK_ID;
    button.className = 'task health-worker-toolkit-task';
    button.textContent = '🩺 เครื่องมือหมออนามัย';
    button.dataset.task = 'เครื่องมือหมออนามัยและ รพ.สต.';
    button.setAttribute('aria-controls', TOOLBOX_ID);
    tasks.appendChild(button);
    return button;
  }

  function buildPanel() {
    const panel = document.createElement('section');
    panel.id = TOOLBOX_ID;
    panel.className = 'hwt-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <h2>🩺 เครื่องมือหมออนามัย / รพ.สต.</h2>
      <p class="hwt-sub">รวมเครื่องมือคำนวณงานพื้นฐานและตัวช่วยจัดรายงานจากข้อมูลสรุป — ไม่ใช้แทนการวินิจฉัยหรือแนวทางรักษา</p>
      <div class="hwt-tabs" id="hwtTabs">
        <button class="hwt-tool" type="button" data-hwt="bmi"><strong>⚖️ คำนวณ BMI</strong><small>คำนวณดัชนีมวลกายจากน้ำหนักและส่วนสูง โดยไม่จัดกลุ่มวินิจฉัย</small></button>
        <button class="hwt-tool" type="button" data-hwt="rates"><strong>🧮 คำนวณตัวชี้วัด</strong><small>ความครอบคลุม วัคซีน/คัดกรอง, Attack rate และ Incidence</small></button>
        <button class="hwt-tool" type="button" data-hwt="mosquito"><strong>🦟 HI / CI ลูกน้ำยุงลาย</strong><small>เปิดเครื่องมือสำรวจลูกน้ำเดิม คำนวณเปอร์เซ็นต์และสร้างวันเพจ</small></button>
        ${PROMPT_TOOLS.map(tool => `<button class="hwt-tool" type="button" data-hwt="${tool.id}"><strong>${tool.icon} ${tool.title}</strong><small>${tool.desc}</small></button>`).join('')}
      </div>
      <div class="hwt-work" id="hwtWork"><p>เลือกเครื่องมือด้านบนเพื่อเริ่ม</p></div>
      <div class="hwt-warning"><strong>ข้อควรระวัง:</strong> เครื่องมือนี้ช่วยคำนวณและจัดรูปแบบงานเท่านั้น ไม่ใช่เครื่องมือวินิจฉัย ไม่สั่งยา และไม่แทนแนวทางวิชาชีพ/ระบบส่งต่อของหน่วยบริการ</div>
      <div class="hwt-privacy">🔒 <strong>PDPA:</strong> ใช้ข้อมูลรวม/ข้อมูลไม่ระบุตัวบุคคล ห้ามกรอกชื่อผู้ป่วย เลขบัตรประชาชน เบอร์โทร ที่อยู่เฉพาะบุคคล หรือประวัติการรักษาที่ไม่จำเป็น</div>
    `;
    return panel;
  }

  function renderBMI(work) {
    work.innerHTML = `
      <h3>⚖️ คำนวณ BMI</h3>
      <div class="hwt-grid"><div><label for="hwtWeight">น้ำหนัก (กก.)</label><input id="hwtWeight" inputmode="decimal" placeholder="เช่น 65"></div><div><label for="hwtHeight">ส่วนสูง (ซม.)</label><input id="hwtHeight" inputmode="decimal" placeholder="เช่น 165"></div></div>
      <div class="hwt-actions"><button type="button" class="hwt-primary" id="hwtCalcBMI">คำนวณ</button></div><div id="hwtCalcResult"></div>`;
    document.getElementById('hwtCalcBMI').onclick = () => {
      const result = bmi(document.getElementById('hwtWeight').value, document.getElementById('hwtHeight').value);
      const box = document.getElementById('hwtCalcResult'); box.className = 'hwt-result';
      box.textContent = result === null ? 'กรุณากรอกน้ำหนักและส่วนสูงเป็นตัวเลขมากกว่า 0' : `BMI = ${round(result, 2)}\nใช้ค่าที่คำนวณได้ประกอบการคัดกรองตามเกณฑ์ที่หน่วยงานใช้อยู่ โปรดไม่ตีความเป็นการวินิจฉัยจากเครื่องมือนี้เพียงอย่างเดียว`;
    };
  }

  function renderRates(work) {
    work.innerHTML = `
      <h3>🧮 คำนวณตัวชี้วัดงานชุมชน</h3>
      <div class="hwt-grid">
        <div><label for="hwtRateType">ประเภท</label><select id="hwtRateType"><option value="coverage">ความครอบคลุม (%)</option><option value="attack">Attack rate (%)</option><option value="incidence">Incidence rate</option></select></div>
        <div><label for="hwtMultiplier">ตัวคูณ (เฉพาะ Incidence)</label><select id="hwtMultiplier"><option value="1000">ต่อ 1,000</option><option value="10000">ต่อ 10,000</option><option value="100000" selected>ต่อ 100,000</option></select></div>
        <div><label for="hwtNumerator">ตัวตั้ง: จำนวนทำได้/ผู้ป่วย/ผู้เกิดเหตุ</label><input id="hwtNumerator" inputmode="numeric"></div>
        <div><label for="hwtDenominator">ตัวหาร: เป้าหมาย/ผู้สัมผัส/ประชากร</label><input id="hwtDenominator" inputmode="numeric"></div>
      </div>
      <div class="hwt-actions"><button type="button" class="hwt-primary" id="hwtCalcRate">คำนวณ</button></div><div id="hwtCalcResult"></div>`;
    document.getElementById('hwtCalcRate').onclick = () => {
      const type = document.getElementById('hwtRateType').value;
      const a = document.getElementById('hwtNumerator').value;
      const b = document.getElementById('hwtDenominator').value;
      const multiplier = Number(document.getElementById('hwtMultiplier').value);
      const result = type === 'coverage' ? coverage(a, b) : type === 'attack' ? attackRate(a, b) : incidence(a, b, multiplier);
      const suffix = type === 'incidence' ? ` ต่อ ${multiplier.toLocaleString('th-TH')}` : '%';
      const box = document.getElementById('hwtCalcResult'); box.className = 'hwt-result';
      box.textContent = result === null ? 'ตรวจตัวเลข: ตัวตั้งต้องไม่ติดลบ และตัวหารต้องมากกว่า 0' : `ผลคำนวณ = ${round(result, 2)}${suffix}\nโปรดตรวจนิยามตัวตั้ง ตัวหาร ช่วงเวลา และเกณฑ์รายงานของหน่วยงานก่อนนำไปใช้`;
    };
  }

  function renderPromptTool(work, tool) {
    work.innerHTML = `
      <h3>${tool.icon} ${tool.title}</h3><p>${tool.desc}</p>
      <div class="hwt-grid">
        <div><label for="hwtAgency">หน่วยงาน/พื้นที่</label><input id="hwtAgency" placeholder="เช่น รพ.สต.บ้าน... / ตำบล..."></div>
        <div><label for="hwtPeriod">ช่วงเวลา</label><input id="hwtPeriod" placeholder="เช่น สิงหาคม 2569"></div>
        <div class="hwt-full"><label for="hwtTarget">กลุ่มเป้าหมาย/ขอบเขต</label><input id="hwtTarget" placeholder="ใช้ข้อมูลรวม ไม่ใส่ชื่อบุคคล"></div>
        <div class="hwt-full"><label for="hwtFacts">ข้อมูลสรุป/ข้อเท็จจริง</label><textarea id="hwtFacts" placeholder="เช่น เป้าหมาย 300 คน คัดกรองแล้ว 240 คน พบกลุ่มเสี่ยง 35 คน"></textarea></div>
        <div class="hwt-full"><label for="hwtIssue">ปัญหา/สิ่งที่ต้องติดตาม</label><textarea id="hwtIssue"></textarea></div>
        <div class="hwt-full"><label for="hwtDesired">ผลลัพธ์ที่ต้องการ</label><input id="hwtDesired" placeholder="เช่น สรุปเสนอ ผอ. / รายงานประชุม / ข้อความประชาสัมพันธ์"></div>
      </div>
      <div class="hwt-actions"><button type="button" class="hwt-primary" id="hwtBuild">สร้าง Prompt</button><button type="button" class="hwt-chat" id="hwtChat">คัดลอกแล้วเปิด ChatGPT</button><button type="button" class="hwt-secondary" id="hwtCopy">คัดลอก</button></div><div id="hwtPromptResult"></div>`;
    let prompt = '';
    const build = () => {
      prompt = genericPrompt(tool, {
        agency: document.getElementById('hwtAgency').value.trim(), period: document.getElementById('hwtPeriod').value.trim(), target: document.getElementById('hwtTarget').value.trim(), facts: document.getElementById('hwtFacts').value.trim(), issue: document.getElementById('hwtIssue').value.trim(), output: document.getElementById('hwtDesired').value.trim()
      });
      const box = document.getElementById('hwtPromptResult'); box.className = 'hwt-result'; box.textContent = prompt; return prompt;
    };
    document.getElementById('hwtBuild').onclick = build;
    document.getElementById('hwtCopy').onclick = async () => { const ok = await copyText(prompt || build()); alert(ok ? 'คัดลอกแล้ว' : 'คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความแล้วคัดลอก'); };
    document.getElementById('hwtChat').onclick = async () => { const ok = await copyText(prompt || build()); if (!ok) return alert('คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความแล้วคัดลอก'); window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer'); };
  }

  function openMosquito(panel, generator) {
    const mosquitoButton = document.querySelector('.mosq-task');
    if (mosquitoButton) { panel.hidden = true; generator.style.display = ''; mosquitoButton.click(); return; }
    window.location.href = 'mosquito-onepage.html';
  }

  function initUI() {
    const tasks = document.getElementById('tasks');
    const generator = document.querySelector('.generator');
    if (!tasks || !generator || document.getElementById(TOOLBOX_ID)) return;
    injectStyles();
    const taskButton = createTaskButton(tasks);
    const panel = buildPanel();
    generator.before(panel);
    const work = document.getElementById('hwtWork');

    function activateTab(button) {
      document.querySelectorAll('#hwtTabs .hwt-tool').forEach(item => item.classList.toggle('active', item === button));
      const id = button.dataset.hwt;
      if (id === 'bmi') return renderBMI(work);
      if (id === 'rates') return renderRates(work);
      if (id === 'mosquito') return openMosquito(panel, generator);
      const tool = PROMPT_TOOLS.find(item => item.id === id);
      if (tool) renderPromptTool(work, tool);
    }

    document.getElementById('hwtTabs').addEventListener('click', event => { const button = event.target.closest('.hwt-tool'); if (button) activateTab(button); });
    taskButton.addEventListener('click', () => {
      document.querySelectorAll('.task.active').forEach(item => item.classList.remove('active'));
      taskButton.classList.add('active'); panel.hidden = false; generator.style.display = 'none'; panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tasks.addEventListener('click', event => {
      const clicked = event.target.closest('.task');
      if (!clicked || clicked === taskButton) return;
      taskButton.classList.remove('active'); panel.hidden = true;
      if (!clicked.classList.contains('mosq-task')) generator.style.display = '';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI, { once: true });
  else initUI();
})();
