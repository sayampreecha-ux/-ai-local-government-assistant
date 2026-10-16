export const outputScopeCases = [
 {id:'drawing-only',task:'T05',estimate:false,question:'ตรวจแบบก่อสร้างอาคาร จัดทำตารางตรวจและข้อขัดแย้ง ยังไม่มีแบบหรือรายการคำนวณให้ ห้ามสมมติว่าตรวจจริง'},
 {id:'acceptance-only',task:'T09',estimate:false,question:'จัดทำ checklist ตรวจรับงานก่อสร้างอาคาร ผลทดสอบกำลังอัดยังไม่ออก ไม่ทราบข้อมูลสัญญา ให้แยกข้อที่ตรวจได้กับข้อที่ยังสรุปไม่ได้ ไม่ลงนามตรวจรับ'},
 {id:'supervision-only',task:'T08',estimate:false,question:'ตรวจทานรายงานประจำวันควบคุมงานก่อสร้างถนน ยังไม่มีบันทึกหน้างานจริง ห้ามแต่งปริมาณหรือผลทดสอบ'},
 {id:'maintenance-only',task:'T12',estimate:false,question:'ตรวจแผนซ่อมบำรุงงานก่อสร้างถนน ยังไม่มีผลสำรวจหรือประวัติซ่อม ห้ามรับรองความปลอดภัย'},
 {id:'drawing-estimate',task:'T05',estimate:true,question:'ตรวจแบบก่อสร้างอาคารเทียบ BOQ ปร.4 และราคากลาง'},
 {id:'acceptance-estimate',task:'T09',estimate:true,question:'ตรวจรับงานก่อสร้างอาคารและตรวจปริมาณเทียบ ปร.4'},
 {id:'supervision-estimate',task:'T08',estimate:true,question:'ตรวจควบคุมงานก่อสร้างถนนเทียบ BOQ และ ปร.4'},
 {id:'maintenance-estimate',task:'T12',estimate:true,question:'ตรวจแผนซ่อมบำรุงถนนพร้อมประมาณราคาและ ปร.5'}
];
