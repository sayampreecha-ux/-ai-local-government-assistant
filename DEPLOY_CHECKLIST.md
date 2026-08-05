<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow,noarchive" />
  <title>GovPrompt Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css" />
</head>
<body style="background:#f3f7fc">
  <header class="topbar">
    <a class="brand" href="/"><span class="brand-mark">G</span><span><strong>GovPrompt Admin</strong><small>คำสั่งซื้อ สิทธิ์ และสถิติ</small></span></a>
    <button id="logoutAdmin" class="nav-login hidden">ออกจากระบบ</button>
  </header>

  <main class="section" style="max-width:1220px">
    <section id="adminLoginPanel" class="order-form" style="max-width:520px;margin:40px auto">
      <span class="kicker">ผู้ดูแลระบบ</span><h1>เข้าสู่ระบบ</h1>
      <form id="adminLoginForm">
        <label>รหัสผู้ดูแล<input required type="password" id="adminSecret" autocomplete="current-password" /></label>
        <button class="btn primary full" type="submit">เข้าสู่ระบบ</button>
        <div id="loginMessage" class="form-message"></div>
      </form>
    </section>

    <section id="adminDashboard" class="hidden">
      <div class="section-head">
        <div><span class="kicker">Enterprise 4.0</span><h1 style="margin:.2rem 0">ศูนย์ควบคุมการขาย</h1></div>
        <div class="admin-actions"><button id="loadAll" class="btn secondary">รีเฟรชทั้งหมด</button><button id="exportOrders" class="btn secondary">ส่งออกคำสั่งซื้อ CSV</button><button id="exportCodes" class="btn secondary">ส่งออกรหัส CSV</button></div>
      </div>

      <div id="statsGrid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:22px">
        <div class="tool-card"><small>รอดำเนินการ</small><strong id="statPending" style="display:block;font-size:30px">0</strong></div>
        <div class="tool-card"><small>มีหลักฐาน</small><strong id="statProof" style="display:block;font-size:30px">0</strong></div>
        <div class="tool-card"><small>ชำระแล้ว</small><strong id="statPaid" style="display:block;font-size:30px">0</strong></div>
        <div class="tool-card"><small>รหัสใช้งาน</small><strong id="statCodes" style="display:block;font-size:30px">0</strong></div>
        <div class="tool-card"><small>ใช้วันนี้</small><strong id="statUsage" style="display:block;font-size:30px">0</strong></div>
        <div class="tool-card"><small>รายได้เดือนนี้</small><strong id="statRevenue" style="display:block;font-size:26px">0</strong><small>บาท</small></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px" class="admin-charts">
        <article class="order-form"><h2>ยอดขายตามแพ็กเกจ</h2><div id="packageSales" class="chart-list"><p class="muted">ยังไม่มีข้อมูล</p></div></article>
        <article class="order-form"><h2>เครื่องมือที่ใช้มาก</h2><div id="toolUsage" class="chart-list"><p class="muted">ยังไม่มีข้อมูล</p></div></article>
      </div>

      <div style="display:grid;grid-template-columns:.85fr 1.15fr;gap:20px" class="workspace-grid">
        <section class="order-form">
          <span class="kicker">เปิดสิทธิ์</span><h2>สร้างรหัสผู้ซื้อ</h2>
          <form id="adminForm">
            <label>เลขคำสั่งซื้อ<input required id="orderId" placeholder="REQ-..." /></label>
            <label>ชื่อผู้ซื้อ<input id="customerName" /></label>
            <label>อีเมลลูกค้า<input type="email" id="customerEmail" /></label>
            <label>แพ็กเกจ<select id="adminPackage" class="input"></select></label>
            <div class="two-col"><label>จำนวนครั้ง<input id="maxUses" type="number" min="1" max="5000" /></label><label>อายุสิทธิ์ (วัน)<input id="expiryDays" type="number" min="1" max="1095" /></label></div>
            <button class="btn primary full" type="submit">สร้างรหัสและส่งอีเมล</button>
          </form>
          <div id="newCode" class="notice hidden" style="margin-top:16px"></div>
          <div id="adminMessage" class="form-message"></div>
        </section>

        <section class="order-form">
          <div class="section-head compact"><div><span class="kicker">คำสั่งซื้อ</span><h2>รายการล่าสุด</h2></div></div>
          <div class="admin-actions">
            <select id="orderFilter" class="input" style="max-width:220px"><option value="">ทุกสถานะ</option><option value="awaiting_payment">รอชำระ</option><option value="proof_submitted">มีหลักฐาน</option><option value="paid">ชำระแล้ว</option><option value="completed">เปิดสิทธิ์แล้ว</option><option value="cancelled">ยกเลิก</option></select>
            <button id="loadOrders" class="mini">โหลดรายการ</button>
          </div>
          <div id="orderList"><p>กรุณาเข้าสู่ระบบ</p></div>
        </section>
      </div>

      <section class="order-form" style="margin-top:20px">
        <div class="section-head compact"><div><span class="kicker">สิทธิ์ใช้งาน</span><h2>รหัสสมาชิก</h2></div></div>
        <button id="loadCodes" class="mini">โหลดรหัส</button>
        <div id="codeList"><p>ยังไม่ได้โหลดข้อมูล</p></div>
      </section>
    </section>
  </main>
  <script src="/admin.js" defer></script>
</body>
</html>
