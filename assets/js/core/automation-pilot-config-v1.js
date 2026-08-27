(() => {
  'use strict';

  const WORKFLOWS = Object.freeze([
    Object.freeze({
      id: 'PROJECT_DAILY_BRIEF',
      label: 'สรุปโครงการประจำวัน',
      description: 'สรุปจำนวนโครงการ งบประมาณ ความก้าวหน้า งานติดขัด และงานเกินกำหนด'
    }),
    Object.freeze({
      id: 'DEADLINE_WATCH',
      label: 'เฝ้าระวังงานใกล้กำหนด',
      description: 'คัดโครงการและงานที่ใกล้ครบกำหนดหรือเลยกำหนด เพื่อเสนอผู้รับผิดชอบติดตาม'
    }),
    Object.freeze({
      id: 'TASK_WEEKLY_SUMMARY',
      label: 'สรุปงานค้างรายสัปดาห์',
      description: 'สรุปงานตามสถานะ ลำดับความเร่งด่วน และรายการที่ควรเร่งรัดในสัปดาห์ถัดไป'
    })
  ]);

  const CADENCES = Object.freeze([
    Object.freeze({ id: 'DAILY', label: 'ทุกวัน' }),
    Object.freeze({ id: 'WEEKLY', label: 'ทุกสัปดาห์' })
  ]);

  const STATUSES = Object.freeze({
    DRAFT: 'ฉบับร่าง',
    ACTIVE: 'ทำงานอัตโนมัติ',
    PAUSED: 'หยุดชั่วคราว',
    WAITING_APPROVAL: 'รอตรวจและอนุมัติ',
    APPROVED: 'อนุมัติแล้ว',
    REJECTED: 'ส่งกลับแก้ไข',
    FAILED: 'ทำงานไม่สำเร็จ'
  });

  const OUTPUT_FORMAT_IDS = Object.freeze([
    'easy-summary',
    'step-by-step',
    'timeline',
    'comparison',
    'workflow',
    'checklist',
    'do-dont',
    'framework',
    'key-insights',
    'quick-guide'
  ]);

  const find = (items, id) => items.find(item => item.id === id);

  function normalize(raw = {}) {
    const day = Number(raw.dayOfWeek || raw.day_of_week || 1);
    return Object.freeze({
      name: String(raw.name || '').trim(),
      departmentId: raw.departmentId || raw.department_id || null,
      workflowType: String(raw.workflowType || raw.workflow_type || ''),
      cadence: String(raw.cadence || ''),
      runTime: String(raw.runTime || raw.run_time || '07:30').slice(0, 5),
      dayOfWeek: Number.isInteger(day) ? day : 1,
      outputFormatId: String(raw.outputFormatId || raw.output_format_id || 'easy-summary'),
      active: raw.active === true || raw.active === 'true',
      requiresHumanApproval: raw.requiresHumanApproval !== false && raw.requires_human_approval !== false
    });
  }

  function validate(raw) {
    const value = normalize(raw);
    const errors = [];
    if (value.name.length < 3 || value.name.length > 120) errors.push('ตั้งชื่องาน 3–120 ตัวอักษร');
    if (!find(WORKFLOWS, value.workflowType)) errors.push('เลือกประเภทงานอัตโนมัติ');
    if (!find(CADENCES, value.cadence)) errors.push('เลือกรอบการทำงาน');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.runTime)) errors.push('ระบุเวลาให้ถูกต้อง');
    if (value.cadence === 'WEEKLY' && (value.dayOfWeek < 1 || value.dayOfWeek > 7)) errors.push('เลือกวันประจำสัปดาห์');
    if (!OUTPUT_FORMAT_IDS.includes(value.outputFormatId)) errors.push('เลือกรูปแบบผลลัพธ์');
    if (!value.requiresHumanApproval) errors.push('ทุกผลลัพธ์ต้องผ่านการตรวจและอนุมัติโดยเจ้าหน้าที่');
    return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), value });
  }

  function statusLabel(status) {
    return STATUSES[String(status || '')] || String(status || '-');
  }

  window.GOVPROMPT_AUTOMATION_PILOT = Object.freeze({
    workflows: WORKFLOWS,
    cadences: CADENCES,
    outputFormatIds: OUTPUT_FORMAT_IDS,
    statuses: STATUSES,
    normalize,
    validate,
    statusLabel
  });
})();
