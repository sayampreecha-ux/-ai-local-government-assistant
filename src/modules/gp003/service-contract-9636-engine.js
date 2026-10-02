const TRAVEL_PATTERN = /(?:เดินทางไปปฏิบัติงานนอกสถานที่|เดินทางไปราชการ|เดินทางนอกพื้นที่|พักค้างแรม|ค่าเดินทาง|ค่าพาหนะ|ค่าเช่าที่พัก)/i;
const TRAINING_PATTERN = /(?:อบรม|ฝึกอบรม|ศึกษาดูงาน|ประชุม|เพิ่มพูนความรู้|เพิ่มประสิทธิภาพ)/i;
const LEAVE_PATTERN = /(?:ลาป่วย|ลากิจ|ลาพักผ่อน|วันลา)/i;
const DEDICATED_TRAINING_PATTERN = /(?:อบรมเฉพาะ|จัดอบรมให้ผู้รับจ้างโดยเฉพาะ|ทริปแยก|ศึกษาดูงานเฉพาะ)/i;
const BROAD_ORGANIZATION_PATTERN = /(?:อปท\.?(?:ผู้ว่าจ้าง)?เป็นผู้จัด|องค์กรปกครองส่วนท้องถิ่น.*ผู้จัด|จัดขึ้นในภาพรวม)/i;
const RELATED_WORK_PATTERN = /(?:งานตามสัญญา|เพิ่มพูนความรู้|เพิ่มประสิทธิภาพ|เพื่อประโยชน์ของทางราชการ|เกี่ยวข้องโดยตรง)/i;
const EXPLICIT_TRAVEL_RIGHT_PATTERN = /(?:สิทธิ.*เดินทาง|เบิก.*ค่าเดินทาง|ค่าใช้จ่ายในการเดินทาง.*ตามระเบียบ|เดินทาง.*ตามระเบียบ)/i;

export function reviewServiceContract9636(input = {}) {
  const text = [
    input?.objective ?? "",
    ...(input?.specifications ?? []).map((x) => x?.requirement ?? ""),
    ...(input?.contractTerms ?? []),
  ].join(" ");

  const hasTravel = TRAVEL_PATTERN.test(text);
  const hasTraining = TRAINING_PATTERN.test(text);
  const leaveRisk = LEAVE_PATTERN.test(text);
  const dedicatedTrainingRisk = DEDICATED_TRAINING_PATTERN.test(text);
  const trainingConditionsMet =
    BROAD_ORGANIZATION_PATTERN.test(text) && RELATED_WORK_PATTERN.test(text);
  const travelClausePresent = EXPLICIT_TRAVEL_RIGHT_PATTERN.test(text);

  const findings = [];
  if (leaveRisk) findings.push({
    code: "leave-like-condition",
    level: "high",
    message: "พบเงื่อนไขลักษณะสิทธิการลา ควรตรวจว่าทำให้สัญญามีลักษณะจ้างแรงงานหรือไม่",
  });
  if (hasTraining && dedicatedTrainingRisk) findings.push({
    code: "dedicated-training-risk",
    level: "high",
    message: "การอบรม/ศึกษาดูงานเฉพาะผู้รับจ้างต้องทบทวนตาม ว 9636",
  });
  if (hasTraining && !trainingConditionsMet) findings.push({
    code: "training-context-incomplete",
    level: "medium",
    message: "ยังไม่มีข้อมูลยืนยันว่า อปท. เป็นผู้จัดในภาพรวมและเกี่ยวข้องกับงานตามสัญญา",
  });
  if (hasTravel && !travelClausePresent) findings.push({
    code: "travel-clause-incomplete",
    level: "medium",
    message: "พบภารกิจเดินทาง แต่ยังไม่พบเงื่อนไขใน TOR/สัญญาที่ระบุสิทธิและหลักเกณฑ์การเบิกจ่าย",
  });

  return {
    authority: {
      reference: "มท 0808.2/ว 9636",
      date: "10 กันยายน 2567",
      title: "หลักเกณฑ์การจ้างเหมาบริการขององค์กรปกครองส่วนท้องถิ่น",
    },
    travel: {
      detected: hasTravel,
      explicitContractCondition: travelClausePresent,
      status: hasTravel && !travelClausePresent ? "review-required" : "ok-or-not-applicable",
    },
    training: {
      detected: hasTraining,
      dedicatedTrainingRisk,
      broadOrganizationEvidence: BROAD_ORGANIZATION_PATTERN.test(text),
      relatedWorkEvidence: RELATED_WORK_PATTERN.test(text),
      status: hasTraining && !trainingConditionsMet ? "review-required" : "ok-or-not-applicable",
    },
    leaveRisk,
    findings,
    decisionLock: findings.some(({ level }) => level === "high") ||
      (findings.some(({ code }) => code === "training-context-incomplete") && !input?.evidence?.officialTrainingOrder),
    budgetRule: {
      hardCode: false,
      message: "ห้าม GP ฟันธงหมวดงบประมาณจากข้อความทั่วไป ต้องตรวจจำแนกงบประมาณ/ระเบียบที่ใช้ ณ วันที่เบิกจ่าย และเงื่อนไขที่ระบุใน TOR/สัญญาก่อน",
    },
    note: "ว 9636 ต้องอ่านร่วมกับข้อเท็จจริงของงานและสัญญา ไม่ใช่ใช้คำใดคำหนึ่งเป็นเหตุสรุปโดยอัตโนมัติ",
  };
}
