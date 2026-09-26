(() => {
  'use strict';

  const VERSION = '1.0.0';
  const OWNER_GROUP = 'G09';
  const ROUTE_ID = 'assistance';
  const ROUTE_LABEL = 'ช่วยเหลือประชาชนและสาธารณภัย';

  const SOURCES = Object.freeze([
    Object.freeze({
      id: 'MOI-ASSIST-2566',
      authority: 'กระทรวงมหาดไทย',
      title: 'ระเบียบกระทรวงมหาดไทยว่าด้วยค่าใช้จ่ายเพื่อช่วยเหลือประชาชนตามอำนาจหน้าที่ขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2566',
      type: 'regulation',
      url: 'https://www.dla.go.th/upload/document/type2/2023/7/29615_1_1688699973285.pdf?time=1689547202478',
      useFor: ['การช่วยเหลือประชาชนตามอำนาจหน้าที่ของ อปท.', 'ตรวจอำนาจหน้าที่', 'ตรวจคณะกรรมการและขั้นตอน'],
      rule: 'ใช้เป็นฐานหลักสำหรับการช่วยเหลือประชาชนของ อปท. แต่ต้องตรวจข้อเท็จจริง ประเภทความช่วยเหลือ และเงื่อนไขเฉพาะกรณี'
    }),
    Object.freeze({
      id: 'MOF-DISASTER-2569',
      authority: 'กระทรวงการคลัง',
      title: 'หลักเกณฑ์ วิธีการ เงื่อนไข การใช้จ่ายเงินทดรองราชการเพื่อช่วยเหลือผู้ประสบภัยพิบัติกรณีฉุกเฉิน พ.ศ. 2569',
      type: 'criteria',
      document: 'กค 0402.5/ว 17 ลงวันที่ 20 กุมภาพันธ์ 2569',
      url: 'https://backofficeminisite.disaster.go.th/apiv1/apps/minisite_help/194/sitedownload/704/download?TypeMenu=MainMenu&filename=5cd3ebd7072c0ba0283e456c6d19d40a.pdf',
      useFor: ['ภัยพิบัติกรณีฉุกเฉิน', 'เงินทดรองราชการ', 'อัตราและเงื่อนไขการช่วยเหลือ'],
      rule: 'ห้ามใช้ตัวเลขหรืออัตราโดยไม่ตรวจฉบับที่ใช้บังคับ วันที่เกิดเหตุ และเงื่อนไขของรายการนั้น'
    })
  ]);

  const AP = Object.freeze({
    AP001: { label: 'ตรวจว่าช่วยเหลือได้หรือไม่', keywords: [/ช่วยเหลือประชาชน/, /ขอความช่วยเหลือ/, /ช่วยได้ไหม/, /ช่วยได้หรือไม่/] },
    AP002: { label: 'ตรวจอำนาจหน้าที่', keywords: [/อำนาจหน้าที่/, /อบจ\.?/, /เทศบาล/, /อบต\.?/, /มีอำนาจไหม/, /มีอำนาจหรือไม่/] },
    AP003: { label: 'ตรวจคุณสมบัติผู้ขอรับความช่วยเหลือ', keywords: [/คุณสมบัติ/, /ผู้ขอ/, /ผู้ประสบภัย/, /ครัวเรือน/, /ผู้สูงอายุ/, /คนพิการ/, /เด็ก/] },
    AP004: { label: 'ตรวจกรณีภัยพิบัติ', keywords: [/ภัยพิบัติ/, /สาธารณภัย/, /น้ำท่วม/, /น้ำป่า/, /ดินถล่ม/, /วาตภัย/, /อัคคีภัย/, /ภัยแล้ง/, /ฉุกเฉิน/] },
    AP005: { label: 'ตรวจสิทธิ เงื่อนไข อัตรา และวงเงิน', keywords: [/เท่าไร/, /กี่บาท/, /วงเงิน/, /อัตรา/, /ค่าอาหาร/, /ถุงยังชีพ/, /บ้านเสียหาย/, /ค่าเช่าบ้าน/, /เครื่องนอน/] },
    AP006: { label: 'ตรวจความเสียหาย', keywords: [/เสียหาย/, /สำรวจความเสียหาย/, /บ้านพัง/, /บ้านเสียหาย/, /ประเมินความเสียหาย/, /ภาพถ่าย/] },
    AP007: { label: 'ตรวจเอกสารและหลักฐาน', keywords: [/หลักฐาน/, /เอกสาร/, /ภาพถ่าย/, /ทะเบียนบ้าน/, /แบบคำขอ/, /ใบรับรอง/] },
    AP008: { label: 'ตรวจการช่วยเหลือซ้ำซ้อน', keywords: [/ซ้ำซ้อน/, /ได้รับความช่วยเหลือแล้ว/, /หน่วยงานอื่น/, /ได้รับเงินแล้ว/] },
    AP009: { label: 'ตรวจงบประมาณและการจ่ายเงิน', keywords: [/งบประมาณ/, /เบิกจ่าย/, /จ่ายเงิน/, /เงินสด/, /เช็ค/, /e-?payment/, /แหล่งเงิน/] },
    AP010: { label: 'จัดทำ Checklist เจ้าหน้าที่', keywords: [/checklist/, /เช็กลิสต์/, /รายการตรวจ/, /ขั้นตอนเจ้าหน้าที่/] },
    AP011: { label: 'จัดทำเรื่องเสนอคณะกรรมการ', keywords: [/คณะกรรมการ/, /เสนอคณะกรรมการ/, /ประชุมคณะกรรมการ/] },
    AP012: { label: 'จัดทำบันทึกเสนอผู้บริหาร', keywords: [/บันทึกเสนอ/, /เสนอผู้บริหาร/, /เสนอปลัด/, /เสนอนายก/] },
    AP013: { label: 'ตรวจเบิกจ่ายและบัญชี', keywords: [/บัญชี/, /ฎีกา/, /การเงิน/, /ลงบัญชี/, /ตั้งเบิก/] },
    AP014: { label: 'ตรวจความเสี่ยงและ Audit Trail', keywords: [/ตรวจสอบ/, /สตง/, /ปปช/, /ป.ป.ช/, /ความเสี่ยง/, /audit/, /หลักฐานการตรวจสอบ/] },
    AP015: { label: 'อธิบายให้ประชาชนเข้าใจง่าย', keywords: [/อธิบายประชาชน/, /ตอบประชาชน/, /ประชาสัมพันธ์/, /ภาษาง่าย/, /เข้าใจง่าย/] }
  });

  const ALL_KEYWORDS = Object.freeze([
    /ช่วยเหลือประชาชน/, /ผู้ประสบภัย/, /ภัยพิบัติ/, /สาธารณภัย/, /น้ำท่วม/, /น้ำป่า/, /ดินถล่ม/,
    /วาตภัย/, /อัคคีภัย/, /ภัยแล้ง/, /ถุงยังชีพ/, /บ้านเสียหาย/, /ผู้ประสบภัยพิบัติ/,
    /เงินทดรองราชการ/, /คณะกรรมการช่วยเหลือประชาชน/
  ]);

  const DECISION_WORDS = Object.freeze([
    /ได้ไหม/, /ได้หรือไม่/, /มีสิทธิ/, /มีอำนาจ/, /เท่าไร/, /กี่บาท/, /เบิกได้/, /จ่ายได้/,
    /ทำได้/, /ถูกต้อง/, /ผิดระเบียบ/, /ควรดำเนินการ/
  ]);

  const REQUIRED_FACTS = Object.freeze([
    'หน่วยงาน/ประเภท อปท.',
    'ประเภทเหตุหรือปัญหา',
    'วันที่เกิดเหตุหรือช่วงเวลาที่เกี่ยวข้อง',
    'สถานที่/พื้นที่',
    'ลักษณะความเสียหายหรือความเดือดร้อน',
    'สถานะผู้ขอรับความช่วยเหลือ',
    'การได้รับความช่วยเหลือจากหน่วยงานอื่น (ถ้ามี)',
    'เอกสารและหลักฐานที่มี'
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().trim();
  }

  function countMatches(text, patterns) {
    return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
  }

  function detectAP(text) {
    const source = normalize(text);
    const ranked = Object.entries(AP).map(([id, definition]) => ({
      id,
      label: definition.label,
      score: countMatches(source, definition.keywords)
    })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return ranked[0]?.score ? ranked[0] : { id: 'AP001', label: AP.AP001.label, score: 0 };
  }

  function detectAssistanceRoute(request) {
    const source = normalize(request);
    const matchedKeywords = ALL_KEYWORDS.filter(pattern => pattern.test(source)).map(pattern => pattern.source);
    if (!matchedKeywords.length) return null;

    const ap = detectAP(source);
    const decisionTask = DECISION_WORDS.some(pattern => pattern.test(source));
    const disaster = /ภัยพิบัติ|สาธารณภัย|น้ำท่วม|น้ำป่า|ดินถล่ม|วาตภัย|อัคคีภัย|ภัยแล้ง|ผู้ประสบภัยพิบัติ|เงินทดรองราชการ/.test(source);
    const legalBase = disaster
      ? ['MOI-ASSIST-2566', 'MOF-DISASTER-2569']
      : ['MOI-ASSIST-2566'];

    return Object.freeze({
      version: VERSION,
      routeId: ROUTE_ID,
      routeLabel: ROUTE_LABEL,
      ownerGroup: OWNER_GROUP,
      apId: ap.id,
      apLabel: ap.label,
      apScore: ap.score,
      matchedKeywords: Object.freeze(matchedKeywords),
      disaster,
      decisionTask,
      decisionLock: decisionTask,
      legalBase: Object.freeze(legalBase),
      requiredFacts: REQUIRED_FACTS,
      crossModules: Object.freeze(['G03', 'G05', 'G07', 'G11']),
      gates: Object.freeze([
        'AUTHORITY',
        'VERSION',
        'TIME',
        'FACT_MATCH',
        'LATER_CHANGE',
        'CONFLICT_TRANSITION',
        'EVIDENCE',
        'DUPLICATE_ASSISTANCE'
      ])
    });
  }

  function buildAssistancePromptBlock(route) {
    if (!route) return '';
    const sources = route.legalBase.map(id => SOURCES.find(source => source.id === id)).filter(Boolean);
    const sourceLines = sources.map(source =>
      '- ' + source.title + ' — ' + source.authority + (source.document ? ' (' + source.document + ')' : '') + '\n  ' + source.url
    ).join('\n');

    return [
      '=== ASSISTANCE ROUTE: ช่วยเหลือประชาชนและสาธารณภัย ===',
      'เจ้าของงานเชิงตรรกะ: G09 | ชุดความสามารถ: ' + route.apId + ' — ' + route.apLabel,
      'สถานะ: ' + (route.decisionLock ? 'Decision Lock — ต้องตรวจสอบก่อนสรุปสิทธิ/วงเงิน/อำนาจ' : 'วิเคราะห์เบื้องต้นได้ แต่ห้ามสมมติข้อเท็จจริง'),
      '',
      'หลักการบังคับ',
      '1. แยกฐานกฎหมาย “การช่วยเหลือประชาชนตามอำนาจหน้าที่ของ อปท.” ออกจาก “เงินทดรองราชการเพื่อช่วยเหลือผู้ประสบภัยพิบัติกรณีฉุกเฉิน” ทุกครั้ง',
      '2. ตรวจ AUTHORITY → VERSION → TIME → FACT_MATCH → LATER_CHANGE → CONFLICT_TRANSITION ก่อนสรุปผล',
      '3. ห้าม hard-code อัตรา/วงเงิน/จำนวนวัน/คุณสมบัติจากความจำหรือจากอินโฟกราฟิก หากยังไม่ได้ตรวจต้นฉบับที่ใช้บังคับ',
      '4. ตัวเลขที่พบในเอกสารเป็น “อัตราตามหลักเกณฑ์” ไม่ใช่การรับรองสิทธิอัตโนมัติ ต้องตรวจองค์ประกอบและหลักฐานก่อน',
      '5. หากข้อมูลไม่พอตัดสิน ให้ค้นฐานอำนาจก่อน แล้วแสดง “ข้อมูลที่ยังขาด” แยกจาก “ข้อมูลที่ใช้เริ่มค้นได้”',
      '6. ตรวจการช่วยเหลือซ้ำซ้อน แหล่งเงิน วิธีจ่าย และหลักฐานการจ่ายก่อนเสนออนุมัติ',
      '7. ถ้ามีความขัดแย้งระหว่างระเบียบ หนังสือ หรือช่วงเวลา ให้หยุดการฟันธงและแสดง Conflict/Transition ที่ต้องตรวจ',
      '',
      'ฐานกฎหมายที่ต้องตรวจจากต้นฉบับ',
      sourceLines,
      '',
      'ข้อมูลสำคัญที่ควรตรวจ',
      route.requiredFacts.map((item, index) => (index + 1) + '. ' + item).join('\n'),
      '',
      'การเชื่อมงานข้ามระบบ',
      '- G03: ตรวจฐานอำนาจ กฎหมาย ระเบียบ ฉบับ และวันที่มีผล',
      '- G05: ตรวจการเงิน การจ่ายเงิน และเอกสารเบิกจ่าย',
      '- G07: ตรวจงบประมาณ แผน และแหล่งเงิน',
      '- G11: ตรวจหลักฐาน ความเสี่ยง และ Audit Trail',
      '',
      'รูปแบบผลลัพธ์ที่ต้องการ',
      '1) คำตอบสั้นก่อน 2) ข้อเท็จจริงที่ตรวจแล้ว 3) ฐานอำนาจ/แหล่งต้นฉบับ 4) เงื่อนไข 5) ข้อมูลที่ยังขาด 6) ขั้นตอนถัดไป 7) หลักฐานที่ต้องเก็บ 8) ความเสี่ยง',
      'ถ้ายังสรุปไม่ได้ ให้ใช้สถานะ: “🟡 ต้องตรวจเพิ่ม” ไม่ฟันธง',
      '=== END ASSISTANCE ROUTE ==='
    ].join('\n');
  }

  function getKnowledgeEntries(route) {
    if (!route) return [];
    return route.legalBase.map(id => SOURCES.find(source => source.id === id)).filter(Boolean);
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    ASSISTANCE_ROUTE_VERSION: VERSION,
    ASSISTANCE_ROUTE_ID: ROUTE_ID,
    ASSISTANCE_OWNER_GROUP: OWNER_GROUP,
    ASSISTANCE_AP: AP,
    ASSISTANCE_SOURCES: SOURCES,
    detectAssistanceRoute,
    buildAssistancePromptBlock,
    getAssistanceKnowledgeEntries: getKnowledgeEntries
  });
})();