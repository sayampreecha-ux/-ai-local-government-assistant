(() => {
  'use strict';

  const normalizeNumber = value => Number(String(value ?? '').replace(/,/g, '').trim());
  const percent = (found, surveyed) => surveyed > 0 ? (found / surveyed) * 100 : 0;
  const fmt = value => `${Number(value || 0).toFixed(2)}%`;

  function splitDelimited(line) {
    if (line.includes('|')) return line.split('|').map(item => item.trim());
    if (line.includes('\t')) return line.split('\t').map(item => item.trim());
    return null;
  }

  function parseHIRow(line, lineNumber) {
    const delimited = splitDelimited(line);
    let villageNo;
    let village;
    let surveyed;
    let found;

    if (delimited && delimited.length >= 4) {
      villageNo = Number((delimited[0].match(/\d+/) || [])[0]);
      village = delimited[1];
      surveyed = normalizeNumber(delimited[2]);
      found = normalizeNumber(delimited[3]);
    } else {
      const match = line.match(/หมู่(?:ที่)?\s*(\d+)\s+(.+?)\s*สำรวจ\s*(\d+)\s*(?:หลังคาเรือน|หลัง)?\s*พบ\s*(\d+)\s*(?:หลังคาเรือน|หลัง)?/i);
      if (match) {
        villageNo = Number(match[1]);
        village = match[2].trim();
        surveyed = normalizeNumber(match[3]);
        found = normalizeNumber(match[4]);
      }
    }

    if (!Number.isInteger(villageNo) || !village || !Number.isFinite(surveyed) || !Number.isFinite(found)) {
      return { error: `บรรทัด HI ${lineNumber}: อ่านข้อมูลไม่ได้ กรุณาใช้รูปแบบ “หมู่ 1 | บ้านตัวอย่าง | 40 | 5”` };
    }
    if (surveyed <= 0 || found < 0 || found > surveyed) {
      return { error: `บรรทัด HI ${lineNumber}: จำนวนสำรวจ/จำนวนพบไม่ถูกต้อง` };
    }
    return { row: { villageNo, village, surveyed, found, rate: percent(found, surveyed) } };
  }

  function parseCIRow(line, lineNumber) {
    const delimited = splitDelimited(line);
    let place;
    let surveyed;
    let found;

    if (delimited && delimited.length >= 3) {
      place = delimited[0];
      surveyed = normalizeNumber(delimited[1]);
      found = normalizeNumber(delimited[2]);
    } else {
      const match = line.match(/^(.+?)\s*สำรวจ\s*(\d+)\s*(?:ภาชนะ)?\s*พบ\s*(\d+)\s*(?:ภาชนะ)?/i);
      if (match) {
        place = match[1].trim();
        surveyed = normalizeNumber(match[2]);
        found = normalizeNumber(match[3]);
      }
    }

    if (!place || !Number.isFinite(surveyed) || !Number.isFinite(found)) {
      return { error: `บรรทัด CI ${lineNumber}: อ่านข้อมูลไม่ได้ กรุณาใช้รูปแบบ “วัดตัวอย่าง หมู่ 1 | 20 | 3”` };
    }
    if (surveyed <= 0 || found < 0 || found > surveyed) {
      return { error: `บรรทัด CI ${lineNumber}: จำนวนสำรวจ/จำนวนพบไม่ถูกต้อง` };
    }
    return { row: { place, surveyed, found, rate: percent(found, surveyed) } };
  }

  function parseRows(text, parser) {
    const rows = [];
    const errors = [];
    String(text ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach((line, index) => {
      const parsed = parser(line, index + 1);
      if (parsed.row) rows.push(parsed.row);
      if (parsed.error) errors.push(parsed.error);
    });
    return Object.freeze({ rows: Object.freeze(rows), errors: Object.freeze(errors) });
  }

  function parseHI(text) {
    return parseRows(text, parseHIRow);
  }

  function parseCI(text) {
    return parseRows(text, parseCIRow);
  }

  function summarize(rows) {
    const surveyed = rows.reduce((sum, row) => sum + row.surveyed, 0);
    const found = rows.reduce((sum, row) => sum + row.found, 0);
    const rate = percent(found, surveyed);
    const max = rows.reduce((best, row) => !best || row.rate > best.rate ? row : best, null);
    return Object.freeze({ surveyed, found, rate, max });
  }

  function hiTable(rows) {
    return [
      '| หมู่ที่ | หมู่บ้าน | สำรวจ (หลังคาเรือน) | พบ (หลังคาเรือน) | HI (%) |',
      '|---:|---|---:|---:|---:|',
      ...rows.map(row => `| ${row.villageNo} | ${row.village} | ${row.surveyed} | ${row.found} | ${fmt(row.rate)} |`)
    ].join('\n');
  }

  function ciTable(rows) {
    return [
      '| สถานที่ | สำรวจ (ภาชนะ) | พบ (ภาชนะ) | CI (%) |',
      '|---|---:|---:|---:|',
      ...rows.map(row => `| ${row.place} | ${row.surveyed} | ${row.found} | ${fmt(row.rate)} |`)
    ].join('\n');
  }

  function buildPrompt(input, hiRows, ciRows) {
    const hi = summarize(hiRows);
    const ci = summarize(ciRows);
    const title = input.title || `แจ้งผลสุ่มสำรวจลูกน้ำยุงลาย ค่า HI และ CI ${input.area || ''} ${input.period || ''}`.replace(/\s+/g, ' ').trim();
    const logoInstruction = input.logoName
      ? `ผู้ใช้จะนำไฟล์โลโก้ “${input.logoName}” ไปแนบใน ChatGPT หลังเปิดหน้าใหม่ ให้ใช้เฉพาะโลโก้ที่ผู้ใช้แนบจริงและวางด้านบนมุมขวา`
      : 'ยังไม่มีไฟล์โลโก้ ให้เว้นพื้นที่โลโก้ด้านบนมุมขวา ห้ามสร้างหรือเลียนแบบตราหน่วยงานขึ้นเอง';
    const hiMax = hi.max ? `หมู่ ${hi.max.villageNo} ${hi.max.village} = ${fmt(hi.max.rate)}` : '-';
    const ciMax = ci.max ? `${ci.max.place} = ${fmt(ci.max.rate)}` : '-';

    return `สร้างภาพวันเพจเชิงทางการสำหรับงานสาธารณสุขไทย\n\nหน่วยงาน: ${input.agency || '[ยังไม่ได้ระบุ]'}\nพื้นที่สำรวจ: ${input.area || '[ยังไม่ได้ระบุ]'}\nช่วงเวลา: ${input.period || '[ยังไม่ได้ระบุ]'}\nหัวข้อ: ${title}\nโทนสี: ${input.theme || 'เขียว ขาว ฟ้า'}\nโลโก้: ${logoInstruction}\n\nนิยามที่ใช้\n- House Index (HI) = ร้อยละของหลังคาเรือนที่พบลูกน้ำยุงลาย\n- Container Index (CI) = ร้อยละของภาชนะที่พบลูกน้ำยุงลาย\n\nข้อมูล HI\n${hiTable(hiRows)}\nรวม HI: สำรวจ ${hi.surveyed} หลังคาเรือน พบ ${hi.found} หลังคาเรือน = ${fmt(hi.rate)}\nจุดที่พบค่า HI สูงสุด: ${hiMax}\n\nข้อมูล CI\n${ciTable(ciRows)}\nรวม CI: สำรวจ ${ci.surveyed} ภาชนะ พบ ${ci.found} ภาชนะ = ${fmt(ci.rate)}\nจุดที่พบค่า CI สูงสุด: ${ciMax}\n\nข้อเสนอแนะสำหรับแสดงในภาพ\n${input.recommendation || 'ควรเร่งรณรงค์ทำลายแหล่งเพาะพันธุ์ยุงลายอย่างต่อเนื่อง และดำเนินมาตรการ 3 เก็บ ป้องกัน 3 โรค เพื่อเฝ้าระวังโรคไข้เลือดออกในชุมชน'}\n\nข้อกำหนดการออกแบบ\n- ออกแบบเป็น A4 แนวตั้งหรือสัดส่วนวันเพจที่อ่านง่ายบนมือถือ ลักษณะเชิงทางการ ทันสมัย\n- ใช้ตาราง HI และ CI ที่อ่านง่าย มีไอคอนเกี่ยวกับบ้าน ภาชนะ การตรวจลูกน้ำ และการป้องกันยุงลาย\n- แสดงสรุปภาพรวม HI = ${fmt(hi.rate)} และ CI = ${fmt(ci.rate)} ให้เด่นชัด\n- เน้นจุดที่มีค่าสูงสุดโดยไม่ทำให้ดูตื่นตระหนก\n- ตรวจตัวเลขจากตารางนี้อย่างเคร่งครัด ห้ามเปลี่ยนยอดรวม จำนวนสำรวจ จำนวนพบ หรือเปอร์เซ็นต์\n- ใช้ภาษาไทยให้ถูกต้องและตัวอักษรอ่านชัด\n- ห้ามสร้างหรือเติมเบอร์โทร เว็บไซต์ ที่อยู่ สโลแกน ตราราชการ ชื่อบุคคล หรือข้อมูลอื่นที่ผู้ใช้ไม่ได้ให้\n- ห้ามเพิ่มข้อมูลผู้ป่วยหรือข้อมูลส่วนบุคคล\n- หากข้อความยาว ให้ลดองค์ประกอบตกแต่งก่อนลดขนาดตัวอักษร\n- ส่งออกเป็นภาพวันเพจพร้อมใช้งาน`; 
  }

  const api = Object.freeze({ parseHI, parseCI, summarize, buildPrompt, fmt });
  window.GovPromptMosquitoOnepage = api;

  if (typeof document !== 'object') return;

  function injectStyles() {
    if (document.getElementById('mosquitoOnepageStyles')) return;
    const style = document.createElement('style');
    style.id = 'mosquitoOnepageStyles';
    style.textContent = `
      .mosq-task{border-color:#8cc8b3!important;background:linear-gradient(135deg,#eefaf5,#eef6ff)!important}
      .mosq-panel{margin-top:16px;background:#fff;border:1px solid #b9d9cb;border-radius:16px;padding:15px;box-shadow:0 8px 24px rgba(11,59,117,.06)}
      .mosq-panel[hidden]{display:none!important}.mosq-panel h2{margin:0 0 6px;font-size:20px;color:#0a5b42}.mosq-panel p{margin:4px 0 10px;color:#536579}
      .mosq-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mosq-full{grid-column:1/-1}.mosq-panel label{display:block;font-weight:750;margin:5px 0}
      .mosq-panel input,.mosq-panel textarea{width:100%;border:1px solid #cfdde6;border-radius:10px;padding:10px;font:inherit;background:#fff}.mosq-panel textarea{min-height:110px;resize:vertical}
      .mosq-help{font-size:12px;color:#64748b;margin-top:4px}.mosq-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mosq-actions button{border:0;border-radius:10px;padding:10px 13px;font:inherit;font-weight:750;cursor:pointer}.mosq-primary{background:#0a5b42;color:#fff}.mosq-chat{background:#1677ff;color:#fff}.mosq-secondary{background:#edf2f7;color:#10233f}
      .mosq-output{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5faf8;border:1px solid #d4e8df;border-radius:12px;padding:12px;margin-top:12px;max-height:520px;overflow:auto}.mosq-summary{font-weight:750;color:#0a5b42;margin-top:10px}.mosq-error{color:#b42318;background:#fff3f2;border:1px solid #f5c2bf;border-radius:10px;padding:10px;margin-top:10px}.mosq-privacy{font-size:12px;color:#526473;margin-top:10px;padding:8px 10px;background:#f4f8fb;border-radius:10px}
      @media(max-width:650px){.mosq-grid{grid-template-columns:1fr}.mosq-full{grid-column:auto}.mosq-actions button{flex:1 1 45%}}
    `;
    document.head.appendChild(style);
  }

  function initUI() {
    const tasks = document.getElementById('tasks');
    const generator = document.querySelector('.generator');
    if (!tasks || !generator || document.getElementById('mosquitoOnepageTool')) return;
    injectStyles();

    const taskButton = document.createElement('button');
    taskButton.type = 'button';
    taskButton.className = 'task mosq-task';
    taskButton.textContent = '🦟 วันเพจลูกน้ำยุงลาย';
    taskButton.setAttribute('aria-controls', 'mosquitoOnepageTool');
    tasks.prepend(taskButton);

    const panel = document.createElement('section');
    panel.className = 'mosq-panel';
    panel.id = 'mosquitoOnepageTool';
    panel.hidden = true;
    panel.innerHTML = `
      <h2>🦟 สร้างวันเพจผลสำรวจลูกน้ำยุงลาย</h2>
      <p>กรอกจำนวนสำรวจและจำนวนที่พบ ระบบจะคำนวณ HI / CI และสร้าง Prompt พร้อมใช้ให้โดยอัตโนมัติ</p>
      <div class="mosq-grid">
        <div><label for="mosqAgency">หน่วยงาน</label><input id="mosqAgency" placeholder="เช่น รพ.สต.บ้าน... / โรงพยาบาล..."></div>
        <div><label for="mosqArea">พื้นที่สำรวจ</label><input id="mosqArea" placeholder="เช่น ตำบลเชียงยืน"></div>
        <div><label for="mosqPeriod">เดือน/ปี</label><input id="mosqPeriod" placeholder="เช่น มิถุนายน 2569"></div>
        <div><label for="mosqTheme">โทนสี</label><input id="mosqTheme" value="เขียว ขาว ฟ้า"></div>
        <div class="mosq-full"><label for="mosqTitle">หัวข้อวันเพจ (ไม่ใส่ก็ได้)</label><input id="mosqTitle" placeholder="ระบบจะสร้างจากพื้นที่และเดือนให้อัตโนมัติ"></div>
        <div class="mosq-full"><label for="mosqLogo">โลโก้หน่วยงาน</label><input id="mosqLogo" type="file" accept="image/*"><div class="mosq-help">GovPrompt ไม่อัปโหลดไฟล์นี้ออกจากเครื่อง เมื่อเปิด ChatGPT ให้แนบโลโก้อีกครั้งก่อนสั่งสร้างภาพ</div></div>
        <div class="mosq-full"><label for="mosqHI">ข้อมูล HI — 1 บรรทัดต่อ 1 หมู่บ้าน</label><textarea id="mosqHI" placeholder="หมู่ 1 | บ้านตัวอย่าง | 40 | 5\nหมู่ 2 | บ้านตัวอย่างสอง | 40 | 3"></textarea><div class="mosq-help">รูปแบบ: หมู่ที่ | ชื่อหมู่บ้าน | จำนวนสำรวจ | จำนวนพบ</div></div>
        <div class="mosq-full"><label for="mosqCI">ข้อมูล CI — 1 บรรทัดต่อ 1 สถานที่</label><textarea id="mosqCI" placeholder="วัดตัวอย่าง หมู่ 1 | 15 | 1\nโรงเรียนตัวอย่าง | 22 | 4"></textarea><div class="mosq-help">รูปแบบ: สถานที่ | จำนวนภาชนะสำรวจ | จำนวนภาชนะที่พบ</div></div>
        <div class="mosq-full"><label for="mosqRecommendation">ข้อเสนอแนะ (ไม่ใส่ก็ได้)</label><textarea id="mosqRecommendation" placeholder="ระบบมีข้อความมาตรฐานให้ หากต้องการปรับให้พิมพ์ที่นี่"></textarea></div>
      </div>
      <div class="mosq-actions">
        <button type="button" class="mosq-primary" id="mosqBuild">คำนวณ + สร้าง Prompt</button>
        <button type="button" class="mosq-chat" id="mosqChatGPT">คัดลอกแล้วเปิด ChatGPT</button>
        <button type="button" class="mosq-secondary" id="mosqCopy">คัดลอก Prompt</button>
        <button type="button" class="mosq-secondary" id="mosqClear">ล้างข้อมูล</button>
      </div>
      <div id="mosqMessage" aria-live="polite"></div>
      <div id="mosqOutput" class="mosq-output" hidden></div>
      <div class="mosq-privacy">🔒 ใช้เฉพาะข้อมูลสรุประดับพื้นที่ ไม่ใส่ชื่อผู้ป่วย เลขบัตรประชาชน หรือข้อมูลสุขภาพที่ระบุตัวบุคคลได้</div>
    `;
    generator.before(panel);

    const byId = id => document.getElementById(id);
    let currentPrompt = '';

    function values() {
      return {
        agency: byId('mosqAgency').value.trim(),
        area: byId('mosqArea').value.trim(),
        period: byId('mosqPeriod').value.trim(),
        title: byId('mosqTitle').value.trim(),
        theme: byId('mosqTheme').value.trim(),
        recommendation: byId('mosqRecommendation').value.trim(),
        logoName: byId('mosqLogo').files?.[0]?.name || ''
      };
    }

    function build() {
      const hi = parseHI(byId('mosqHI').value);
      const ci = parseCI(byId('mosqCI').value);
      const errors = [...hi.errors, ...ci.errors];
      const message = byId('mosqMessage');
      message.className = '';
      message.textContent = '';

      if (!hi.rows.length || !ci.rows.length) errors.unshift('กรุณากรอกข้อมูล HI และ CI อย่างน้อยอย่างละ 1 รายการ');
      if (errors.length) {
        message.className = 'mosq-error';
        message.textContent = errors.join('\n');
        currentPrompt = '';
        byId('mosqOutput').hidden = true;
        return '';
      }

      const hiSummary = summarize(hi.rows);
      const ciSummary = summarize(ci.rows);
      currentPrompt = buildPrompt(values(), hi.rows, ci.rows);
      message.className = 'mosq-summary';
      message.textContent = `ตรวจแล้ว: HI ${hiSummary.found}/${hiSummary.surveyed} = ${fmt(hiSummary.rate)} · CI ${ciSummary.found}/${ciSummary.surveyed} = ${fmt(ciSummary.rate)}`;
      byId('mosqOutput').textContent = currentPrompt;
      byId('mosqOutput').hidden = false;
      return currentPrompt;
    }

    async function copyPrompt() {
      const prompt = currentPrompt || build();
      if (!prompt) return false;
      try {
        await navigator.clipboard.writeText(prompt);
      } catch (_) {
        const textarea = document.createElement('textarea');
        textarea.value = prompt;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      const message = byId('mosqMessage');
      message.className = 'mosq-summary';
      message.textContent = 'คัดลอก Prompt แล้ว ✓';
      return true;
    }

    taskButton.addEventListener('click', () => {
      document.querySelectorAll('.task.active').forEach(item => item.classList.remove('active'));
      taskButton.classList.add('active');
      panel.hidden = false;
      generator.style.display = 'none';
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    tasks.addEventListener('click', event => {
      const clicked = event.target.closest('.task');
      if (!clicked || clicked === taskButton) return;
      taskButton.classList.remove('active');
      panel.hidden = true;
      generator.style.display = '';
    });

    byId('mosqBuild').addEventListener('click', build);
    byId('mosqCopy').addEventListener('click', copyPrompt);
    byId('mosqChatGPT').addEventListener('click', () => {
      const prompt = currentPrompt || build();
      if (!prompt) return;
      copyPrompt();
      window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
    });
    byId('mosqClear').addEventListener('click', () => {
      ['mosqAgency','mosqArea','mosqPeriod','mosqTitle','mosqHI','mosqCI','mosqRecommendation'].forEach(id => { byId(id).value = ''; });
      byId('mosqTheme').value = 'เขียว ขาว ฟ้า';
      byId('mosqLogo').value = '';
      byId('mosqMessage').textContent = '';
      byId('mosqMessage').className = '';
      byId('mosqOutput').textContent = '';
      byId('mosqOutput').hidden = true;
      currentPrompt = '';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI, { once: true });
  else initUI();
})();
