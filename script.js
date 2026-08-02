(() => {
  const tools = window.GOVPROMPT_TOOLS || [];
  const grid = document.getElementById("toolGrid");
  const toolSearch = document.getElementById("toolSearch");
  const heroSearch = document.getElementById("heroSearch");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("emptyState");
  const workspace = document.getElementById("workspace");
  const form = document.getElementById("generatorForm");
  const fieldsWrap = document.getElementById("dynamicFields");
  const resultOutput = document.getElementById("resultOutput");
  const copyButton = document.getElementById("copyButton");
  const downloadButton = document.getElementById("downloadButton");
  const successNote = document.getElementById("successNote");
  const formMessage = document.getElementById("formMessage");
  const toast = document.getElementById("toast");
  let activeCategory = "ทั้งหมด";
  let activeTool = null;
  let generatedPrompt = "";

  const normalize = value => String(value || "").toLowerCase().trim();

  function moduleRoute(value) {
    const q = normalize(value);
    if (!q) return null;
    if (q.includes("tor") || q.includes("ทีโออาร์") || q.includes("ล็อกสเปก") || q.includes("สเปก")) return "gp003.html";
    if (q.includes("ข้อกฎหมาย") || q.includes("วิเคราะห์กฎหมาย") || q.includes("อำนาจหน้าที่") || q.includes("กฎหมาย อปท")) return "gp002.html";
    if (q.includes("ร่างหนังสือ") || q.includes("หนังสือราชการ") || q.includes("บันทึกข้อความ")) return "gp001.html";
    return null;
  }

  function goToModule(value) {
    const route = moduleRoute(value);
    if (!route) return false;
    window.location.href = route;
    return true;
  }

  function toolModuleRoute(tool) {
    if (!tool) return null;
    if (tool.id === "gp009" || normalize(tool.name).includes("tor")) return "gp003.html";
    if (tool.id === "gp005" || normalize(tool.name).includes("วิเคราะห์ข้อกฎหมาย")) return "gp002.html";
    if (tool.id === "gp001") return "gp001.html";
    return null;
  }

  function renderTools() {
    if (!grid || !toolSearch || !resultCount || !emptyState) return;
    const query = normalize(toolSearch.value);
    const filtered = tools.filter(t => {
      const categoryMatch = activeCategory === "ทั้งหมด" || t.category === activeCategory;
      const haystack = normalize([t.code, t.name, t.desc, t.category].join(" "));
      return categoryMatch && (!query || haystack.includes(query));
    });
    grid.innerHTML = filtered.map(t => `
      <article class="tool-card">
        <div class="tool-card-top"><span class="tool-icon">${t.icon}</span><span class="tool-code">${t.code}</span></div>
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
        <div class="tool-meta"><span class="category-pill">${t.category}</span><span>ใช้เวลา 1–3 นาที</span></div>
        <button type="button" data-open="${t.id}">เริ่มใช้เครื่องมือนี้</button>
      </article>`).join("");
    resultCount.textContent = `${filtered.length} เครื่องมือ`;
    emptyState.classList.toggle("hidden", filtered.length !== 0);
    grid.classList.toggle("hidden", filtered.length === 0);
    document.querySelectorAll("[data-open]").forEach(btn => btn.addEventListener("click", () => {
      const tool = tools.find(t => t.id === btn.dataset.open);
      const route = toolModuleRoute(tool);
      if (route) window.location.href = route;
      else openWorkspace(btn.dataset.open);
    }));
  }

  function fieldHTML(field) {
    const [id, label, type, required, options] = field;
    const requiredMark = required ? ' <span class="required">*</span>' : "";
    if (type === "textarea") return `<label>${label}${requiredMark}<textarea name="${id}" ${required ? "required" : ""} placeholder="${options || ""}"></textarea></label>`;
    if (type === "select") return `<label>${label}${requiredMark}<select name="${id}" ${required ? "required" : ""}><option value="">เลือกข้อมูล</option>${options.map(v => `<option value="${v}">${v}</option>`).join("")}</select></label>`;
    return `<label>${label}${requiredMark}<input name="${id}" type="text" ${required ? "required" : ""} placeholder="${options || ""}"></label>`;
  }

  function ensurePdpaCheckpoint() {
    if (!form || document.getElementById("pdpaCheckpoint")) return;
    const confirmFacts = document.getElementById("confirmFacts");
    const factsLabel = confirmFacts ? confirmFacts.closest("label") : null;
    const wrapper = document.createElement("section");
    wrapper.id = "pdpaCheckpoint";
    wrapper.style.cssText = "margin:14px 0;padding:14px;border:1px solid #d7e3f4;border-radius:12px;background:#f7fbff";
    wrapper.innerHTML = `<strong style="display:block;margin-bottom:8px">🔒 PDPA Checkpoint — ต้องตรวจทุกครั้ง</strong><div id="pdpaScanResult" style="font-size:.94rem;line-height:1.6;margin-bottom:10px">ระบบจะตรวจหาข้อมูลส่วนบุคคลเบื้องต้นก่อนสร้าง Prompt</div><label class="confirm" style="margin:0"><input id="confirmPDPA" type="checkbox" required> ยืนยันว่าได้ตรวจสอบความจำเป็น ฐานการใช้ข้อมูล การปกปิดข้อมูลเกินจำเป็น และสิทธิในการนำข้อมูลไปประมวลผลแล้ว</label>`;
    if (factsLabel) factsLabel.insertAdjacentElement("afterend", wrapper);
    else form.insertBefore(wrapper, form.querySelector('button[type="submit"]'));
  }

  function scanPersonalData(values) {
    const text = Array.from(values.entries()).filter(([key]) => key !== "outputTone").map(([, value]) => String(value || "")).join("\n");
    const checks = [
      ["เลขประจำตัวประชาชน", /\b\d{13}\b/g], ["หมายเลขโทรศัพท์", /(?:\+66|0)\d{8,9}\b/g],
      ["อีเมล", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi], ["เลขบัญชีหรือข้อมูลการเงิน", /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์|เงินเดือน|ค่าจ้าง|รายได้)/gi],
      ["ข้อมูลสุขภาพ", /(?:โรค|อาการป่วย|แพทย์|โรงพยาบาล|ผลตรวจ|สุขภาพ|ความพิการ)/gi], ["ข้อมูลคดีหรือวินัย", /(?:คดี|ผู้ต้องหา|จำเลย|ความผิด|สอบสวน|วินัย|ลงโทษ)/gi],
      ["ที่อยู่หรือสถานที่พัก", /(?:บ้านเลขที่|หมู่ที่|ตำบล|อำเภอ|จังหวัด|ที่อยู่|บ้านพัก)/gi], ["ชื่อบุคคลหรือข้อมูลระบุตัวบุคคล", /(?:นาย|นาง|นางสาว|ดร\.|เด็กชาย|เด็กหญิง)\s*[ก-๙A-Za-z]/g]
    ];
    return [...new Set(checks.filter(([, pattern]) => { pattern.lastIndex = 0; return pattern.test(text); }).map(([label]) => label))];
  }

  function updatePdpaDisplay(found) {
    const result = document.getElementById("pdpaScanResult");
    if (!result) return;
    if (!found.length) {
      result.innerHTML = "✅ ไม่พบรูปแบบข้อมูลส่วนบุคคลที่ระบบตรวจจับได้ชัดเจน แต่ผู้ใช้ยังต้องตรวจทานด้วยตนเอง";
      result.style.color = "#176b3a";
    } else {
      result.innerHTML = `⚠️ พบข้อมูลที่อาจเป็นข้อมูลส่วนบุคคล: <strong>${found.join(", ")}</strong><br>ควรปกปิด ตัดทอน หรือใช้นามสมมติ หากไม่จำเป็นต่อภารกิจ`;
      result.style.color = "#9a4d00";
    }
  }

  function openWorkspace(id) {
    if (!workspace || !form || !fieldsWrap) return;
    activeTool = tools.find(t => t.id === id);
    if (!activeTool) return;
    document.getElementById("workspaceCode").textContent = activeTool.code;
    document.getElementById("workspaceTitle").textContent = activeTool.name;
    document.getElementById("workspaceDesc").textContent = activeTool.desc;
    fieldsWrap.innerHTML = activeTool.fields.map(fieldHTML).join("");
    ensurePdpaCheckpoint();
    form.reset();
    updatePdpaDisplay([]);
    resultOutput.textContent = "Prompt ที่สร้างจากข้อมูลของคุณจะแสดงที่นี่";
    resultOutput.classList.add("empty");
    successNote.classList.add("hidden");
    copyButton.disabled = true;
    downloadButton.disabled = true;
    formMessage.textContent = "";
    generatedPrompt = "";
    workspace.classList.remove("hidden");
    document.body.classList.add("modal-open");
    workspace.scrollTop = 0;
  }

  function closeWorkspace() {
    if (!workspace) return;
    workspace.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function buildPrompt(tool, values, pdpaFindings) {
    const info = tool.fields.map(field => {
      const [id, label] = field;
      return `- ${label}: ${String(values.get(id) || "").trim() || "[ยังไม่ได้ระบุ]"}`;
    }).join("\n");
    const tone = values.get("outputTone");
    const pdpaStatus = pdpaFindings.length ? `ตรวจพบข้อมูลที่อาจเป็นข้อมูลส่วนบุคคล: ${pdpaFindings.join(", ")}` : "ไม่พบรูปแบบข้อมูลส่วนบุคคลที่ระบบตรวจจับได้ชัดเจนจากข้อมูลที่กรอก";
    return `บทบาท\nคุณเป็น Government AI Copilot ผู้เชี่ยวชาญงานราชการไทย และมีความรู้ตามประเภทงาน "${tool.category}"\n\nภารกิจ\n${tool.name}\n\nข้อมูลจากผู้ใช้\n${info}\n\nPDPA CHECKPOINT (ต้องดำเนินการก่อนตอบทุกครั้ง)\n- สถานะการตรวจเบื้องต้นจากระบบ: ${pdpaStatus}\n- ตรวจว่าข้อมูลใดเป็นข้อมูลส่วนบุคคล ข้อมูลอ่อนไหว หรือข้อมูลที่ระบุตัวบุคคลได้\n- หากข้อมูลส่วนบุคคลไม่จำเป็นต่อภารกิจ ให้ปกปิด ตัดทอน หรือแทนด้วย [ข้อมูลส่วนบุคคล]\n- ห้ามนำเลขประจำตัวประชาชน เลขบัญชี ข้อมูลสุขภาพ ข้อมูลคดี ข้อมูลวินัย ที่อยู่ เบอร์โทรศัพท์ หรือข้อมูลอ่อนไหวมาแสดงซ้ำโดยไม่จำเป็น\n- หากมีความเสี่ยงสูงหรือข้อมูลอ่อนไหว ให้หยุดก่อนร่างฉบับสมบูรณ์ และขอให้ผู้ใช้ยืนยันหรือส่งข้อมูลที่ปกปิดแล้ว\n\nรูปแบบผลลัพธ์\n- ใช้${tone}\n- จัดหัวข้อและลำดับเนื้อหาให้เหมาะกับภารกิจ\n- เริ่มด้วยหัวข้อ "ผลการตรวจ PDPA"\n- แยกข้อเท็จจริง ข้อวิเคราะห์ ความเสี่ยง และข้อเสนอแนะเมื่อเกี่ยวข้อง\n- ระบุข้อมูลสำคัญที่ยังขาดก่อนนำไปใช้จริง\n\nข้อกำหนดสำคัญ\n1. ยึดข้อเท็จจริงและเอกสารที่ผู้ใช้ให้เป็นหลัก\n2. ห้ามสมมติชื่อบุคคล วันที่ เลขหนังสือ วงเงิน ข้อกฎหมาย หรือรายละเอียดที่ผู้ใช้ไม่ได้ให้\n3. หากข้อมูลสำคัญไม่ครบ ให้ใช้คำว่า "[ต้องตรวจสอบ/เพิ่มเติม]" อย่างชัดเจน\n4. ห้ามอ้างกฎหมาย ระเบียบ หนังสือสั่งการ หรือแหล่งข้อมูลที่ไม่สามารถยืนยันได้\n5. ผลลัพธ์เป็นร่างเพื่อประกอบการทำงาน ผู้ใช้ต้องตรวจทานและรับผิดชอบก่อนนำไปใช้จริง\n\nโปรดดำเนินการตามภารกิจข้างต้นทันที`;
  }

  function searchFromHero() {
    if (!heroSearch || !toolSearch) return;
    if (goToModule(heroSearch.value)) return;
    toolSearch.value = heroSearch.value;
    activeCategory = "ทั้งหมด";
    document.querySelectorAll(".category-strip button").forEach(b => b.classList.toggle("active", b.dataset.category === "ทั้งหมด"));
    renderTools();
    document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }

  if (form) {
    form.addEventListener("input", () => updatePdpaDisplay(scanPersonalData(new FormData(form))));
    form.addEventListener("submit", e => {
      e.preventDefault();
      formMessage.textContent = "";
      const values = new FormData(form);
      const findings = scanPersonalData(values);
      updatePdpaDisplay(findings);
      if (!document.getElementById("confirmFacts")?.checked) { formMessage.textContent = "กรุณายืนยันการตรวจสอบข้อเท็จจริงก่อนสร้าง Prompt"; formMessage.className = "form-message error"; return; }
      if (!document.getElementById("confirmPDPA")?.checked) { formMessage.textContent = "กรุณาผ่าน PDPA Checkpoint และยืนยันการใช้ข้อมูลก่อนสร้าง Prompt"; formMessage.className = "form-message error"; return; }
      generatedPrompt = buildPrompt(activeTool, values, findings);
      resultOutput.textContent = generatedPrompt;
      resultOutput.classList.remove("empty");
      copyButton.disabled = false;
      downloadButton.disabled = false;
      successNote.textContent = "✅ สร้างสำเร็จ — ผ่าน PDPA Checkpoint เบื้องต้นแล้ว โปรดตรวจทานอีกครั้งก่อนใช้จริง";
      successNote.classList.remove("hidden");
    });
  }

  copyButton?.addEventListener("click", async () => {
    if (!generatedPrompt) return;
    try { await navigator.clipboard.writeText(generatedPrompt); }
    catch { const area = document.createElement("textarea"); area.value = generatedPrompt; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove(); }
    showToast("คัดลอก Prompt แล้ว");
  });

  downloadButton?.addEventListener("click", () => {
    if (!generatedPrompt || !activeTool) return;
    const url = URL.createObjectURL(new Blob([generatedPrompt], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `${activeTool.code}-${activeTool.name}.txt`; a.click(); URL.revokeObjectURL(url);
  });

  toolSearch?.addEventListener("input", renderTools);
  document.getElementById("heroSearchButton")?.addEventListener("click", searchFromHero);
  heroSearch?.addEventListener("keydown", e => { if (e.key === "Enter") searchFromHero(); });
  document.querySelectorAll("[data-query]").forEach(btn => btn.addEventListener("click", () => {
    if (goToModule(btn.dataset.query)) return;
    if (heroSearch) heroSearch.value = btn.dataset.query;
    searchFromHero();
  }));
  document.querySelectorAll(".category-strip button").forEach(btn => btn.addEventListener("click", () => {
    activeCategory = btn.dataset.category;
    document.querySelectorAll(".category-strip button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTools();
  }));
  document.getElementById("clearSearch")?.addEventListener("click", () => { toolSearch.value = ""; activeCategory = "ทั้งหมด"; renderTools(); });
  document.getElementById("closeWorkspace")?.addEventListener("click", closeWorkspace);
  workspace?.addEventListener("click", e => { if (e.target === workspace) closeWorkspace(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && workspace && !workspace.classList.contains("hidden")) closeWorkspace(); });
  document.getElementById("menuButton")?.addEventListener("click", () => document.getElementById("mainNav")?.classList.toggle("open"));
  document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => document.getElementById("mainNav")?.classList.remove("open")));
  document.getElementById("professionalButton")?.addEventListener("click", () => showToast("Professional อยู่ระหว่างพัฒนาอย่างต่อเนื่อง"));

  ensurePdpaCheckpoint();
  renderTools();
})();