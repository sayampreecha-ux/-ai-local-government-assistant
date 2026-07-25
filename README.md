<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>ตรวจความพร้อมระบบ | GovPrompt Thailand</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/"><span class="brand-mark">G</span><span><strong>GovPrompt Thailand</strong><small>หน้าตรวจความพร้อมสำหรับเจ้าของระบบ</small></span></a>
    <nav><a href="/">หน้าแรก</a><a href="/admin.html">ผู้ดูแลระบบ</a></nav>
  </header>
  <main class="section" style="max-width:980px;margin:auto;padding-top:110px">
    <div class="section-head compact">
      <div><span class="kicker">Owner Check</span><h1>ตรวจความพร้อมก่อนเปิดขาย</h1></div>
      <button id="runCheck" class="btn primary">ตรวจอีกครั้ง</button>
    </div>
    <div class="notice">หน้านี้ไม่แสดง API Key หรือรหัสลับ จะแสดงเฉพาะสถานะว่าได้ตั้งค่าแล้วหรือยัง</div>
    <div id="overall" class="form-message">กำลังตรวจสอบ...</div>
    <div class="package-grid" id="checks"></div>
    <section class="section soft" style="margin-top:24px">
      <h2>ลำดับก่อนเปิดรับเงิน</h2>
      <ol style="line-height:1.9">
        <li>ฐานข้อมูลต้องขึ้น “พร้อมใช้งาน”</li>
        <li>แพ็กเกจต้องโหลดได้ 3 รายการ</li>
        <li>ข้อมูลชำระเงินต้องตั้งค่าแล้ว</li>
        <li>AI ควรเป็นโหมด Live ก่อนเปิดขายจริง</li>
        <li>ทดสอบเข้าสู่หน้า <a href="/admin.html">ผู้ดูแลระบบ</a> และออกรหัสทดลอง 1 ชุด</li>
      </ol>
    </section>
  </main>
  <script src="/owner-check.js" defer></script>
</body>
</html>
