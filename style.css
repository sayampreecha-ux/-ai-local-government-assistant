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

  const normalize = (value) => String(value || "").toLowerCase().trim();

  function renderTools() {
    const query = normalize(toolSearch.value);
    const filtered = tools.filter(t => {
      const categoryMatch = activeCategory === "ทั้งหมด" || t.category === activeCategory;
      const haystack = normalize([t.code,t.name,t.desc,t.category].join(" "));
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
    document.querySelectorAll("[data-open]").forEach(btn => btn.addEventListener("click", () => openWorkspace(btn.dataset.open)));
  }

  function fieldHTML(field) {
    const [id,label,type,required,options] = field;
    const requiredMark = required ? ' <span class="required">*</span>' : "";
    if (type === "textarea") {
      return `<label>${label}${requiredMark}<textarea name="${id}" ${required ? "required":""} placeholder="${options || ""}"></textarea></label>`;
    }
    if (type === "select") {
      return `<label>${label}${requiredMark}<select name="${id}" ${required ? "required":""}><option value="">เลือกข้อมูล</option>${options.map(v=>`<option value="${v}">${v}</option>`).join("")}</select></label>`;
    }
    return `<label>${label}${requiredMark}<input name="${id}" type="text" ${required ? "required":""} placeholder="${options || ""}"></label>`;
  }

  function openWorkspace(id) {
    activeTool = tools.find(t => t.id === id);
    if (!activeTool) return;
    document.getElementById("workspaceCode").textContent = activeTool.code;
    document.getElementById("workspaceTitle").textContent = activeTool.name;
    document.getElementById("workspaceDesc").textContent = activeTool.desc;
    fieldsWrap.innerHTML = activeTool.fields.map(fieldHTML).join("");
    form.reset();
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
    workspace.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function buildPrompt(tool, values) {
    const info = tool.fields.map(field => {
      const [id,label] = field;
      const value = String(values.get(id) || "").trim();
      return `- ${label}: ${value || "[ยังไม่ได้ระบุ]"}`;
    }).join("\n");
    const tone = values.get("outputTone");
    return `บทบาท
คุณเป็น Government AI Copilot ผู้เชี่ยวชาญงานราชการไทย และมีความรู้ตามประเภทงาน "${tool.category}"

ภารกิจ
${tool.name}

ข้อมูลจากผู้ใช้
${info}

รูปแบบผลลัพธ์
- ใช้${tone}
- จัดหัวข้อและลำดับเนื้อหาให้เหมาะกับภารกิจ
- แยกข้อเท็จจริง ข้อวิเคราะห์ ความเสี่ยง และข้อเสนอแนะเมื่อเกี่ยวข้อง
- ระบุข้อมูลสำคัญที่ยังขาดก่อนนำไปใช้จริง

ข้อกำหนดสำคัญ
1. ยึดข้อเท็จจริงและเอกสารที่ผู้ใช้ให้เป็นหลัก
2. ห้ามสมมติชื่อบุคคล วันที่ เลขหนังสือ วงเงิน ข้อกฎหมาย หรือรายละเอียดที่ผู้ใช้ไม่ได้ให้
3. หากข้อมูลสำคัญไม่ครบ ให้ใช้คำว่า "[ต้องตรวจสอบ/เพิ่มเติม]" อย่างชัดเจน
4. ห้ามอ้างกฎหมาย ระเบียบ หนังสือสั่งการ หรือแหล่งข้อมูลที่ไม่สามารถยืนยันได้
5. สำหรับเรื่องกฎหมาย พัสดุ งบประมาณ หรืออำนาจหน้าที่ ให้แยกข้อกฎหมายออกจากการวิเคราะห์ และระบุสิ่งที่ต้องตรวจสอบเพิ่มเติม
6. ตรวจความสอดคล้องของชื่อ วันที่ ตัวเลข หน่วยงาน และข้อเสนอ ก่อนจบคำตอบ
7. ผลลัพธ์เป็นร่างเพื่อประกอบการทำงาน ผู้ใช้ต้องตรวจทานและรับผิดชอบก่อนนำไปใช้จริง

โปรดดำเนินการตามภารกิจข้างต้นทันที`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formMessage.textContent = "";
    const values = new FormData(form);
    if (!document.getElementById("confirmFacts").checked) {
      formMessage.textContent = "กรุณายืนยันการตรวจสอบข้อเท็จจริงก่อนสร้าง Prompt";
      formMessage.className = "form-message error";
      return;
    }
    generatedPrompt = buildPrompt(activeTool, values);
    resultOutput.textContent = generatedPrompt;
    resultOutput.classList.remove("empty");
    copyButton.disabled = false;
    downloadButton.disabled = false;
    successNote.classList.remove("hidden");
    resultOutput.scrollTop = 0;
  });

  copyButton.addEventListener("click", async () => {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
    } catch {
      const area = document.createElement("textarea");
      area.value = generatedPrompt; document.body.appendChild(area); area.select();
      document.execCommand("copy"); area.remove();
    }
    showToast("คัดลอก Prompt แล้ว");
  });

  downloadButton.addEventListener("click", () => {
    if (!generatedPrompt || !activeTool) return;
    const blob = new Blob([generatedPrompt], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${activeTool.code}-${activeTool.name}.txt`; a.click();
    URL.revokeObjectURL(url);
  });

  function searchFromHero() {
    toolSearch.value = heroSearch.value;
    activeCategory = "ทั้งหมด";
    document.querySelectorAll(".category-strip button").forEach(b => b.classList.toggle("active", b.dataset.category === "ทั้งหมด"));
    renderTools();
    document.getElementById("tools").scrollIntoView({behavior:"smooth"});
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(()=>toast.classList.remove("show"), 2200);
  }

  toolSearch.addEventListener("input", renderTools);
  document.getElementById("heroSearchButton").addEventListener("click", searchFromHero);
  heroSearch.addEventListener("keydown", e => { if(e.key === "Enter") searchFromHero(); });
  document.querySelectorAll("[data-query]").forEach(btn => btn.addEventListener("click", () => { heroSearch.value = btn.dataset.query; searchFromHero(); }));
  document.querySelectorAll(".category-strip button").forEach(btn => btn.addEventListener("click", () => {
    activeCategory = btn.dataset.category;
    document.querySelectorAll(".category-strip button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTools();
  }));
  document.getElementById("clearSearch").addEventListener("click", () => { toolSearch.value = ""; activeCategory = "ทั้งหมด"; document.querySelectorAll(".category-strip button").forEach(b => b.classList.toggle("active",b.dataset.category==="ทั้งหมด")); renderTools(); });
  document.getElementById("closeWorkspace").addEventListener("click", closeWorkspace);
  workspace.addEventListener("click", e => { if(e.target === workspace) closeWorkspace(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !workspace.classList.contains("hidden")) closeWorkspace(); });
  document.getElementById("menuButton").addEventListener("click", () => document.getElementById("mainNav").classList.toggle("open"));
  document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => document.getElementById("mainNav").classList.remove("open")));
  document.getElementById("professionalButton").addEventListener("click", () => showToast("Professional อยู่ระหว่างพัฒนาอย่างต่อเนื่อง"));

  renderTools();
})();
