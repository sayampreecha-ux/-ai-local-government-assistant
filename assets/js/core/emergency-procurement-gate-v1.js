(() => {
'use strict';
const VERSION='1.1.0', GATE_ID='emergency-procurement', GATE_LABEL='Emergency Procurement Decision Gate';
const SOURCES=Object.freeze([
Object.freeze({id:'CGD-W714-2569',title:'กค (กวจ) 0405.4/ว 714 ลงวันที่ 16 กันยายน 2569 — แนวทางการยื่นข้อเสนอโดยวิธีคัดเลือกและวิธีเฉพาะเจาะจงผ่าน e-GP',url:'https://www.cgd.go.th/',status:'current-check-required'}),
Object.freeze({id:'CGD-PROCUREMENT',title:'กรมบัญชีกลาง — แหล่งต้นฉบับกฎหมายและแนวทางจัดซื้อจัดจ้าง',url:'https://www.cgd.go.th/',status:'primary-source-required'})]);
const DISASTER=/อุทกภัย|น้ำท่วม|น้ำป่า|ดินถล่ม|วาตภัย|ภัยแล้ง|ภัยธรรมชาติ|สาธารณภัย|อุบัติภัย|ผู้ประสบภัย/;
const PROCUREMENT=/จัดซื้อ|จัดจ้าง|พัสดุ|วิธีเฉพาะเจาะจง|e-?gp|ข้อ 79|มาตรา 56|ถุงยังชีพ|กระสอบทราย|สูบน้ำ|เครื่องสูบน้ำ|เครื่องปั่นไฟ|เต็นท์|น้ำดื่ม|ยา|เวชภัณฑ์|ซ่อมแซม|ซ่อมถนน|ถนน|สะพาน|ปรับปรุง/;
const EMERGENCY=/ฉุกเฉิน|เร่งด่วน|ด่วน|ทันที|ไม่ทัน|ความเสียหาย|ช่วยเหลือ/;
const AMOUNT=/(?:วงเงิน|ราคา|งบประมาณ|จำนวนเงิน)\s*[^\n]{0,30}?([0-9][0-9,]*(?:\.\d+)?)\s*(?:บาท|บ\.?)?/i;
const norm=v=>String(v??'').normalize('NFC').toLocaleLowerCase().trim();
function parseAmount(t){const m=String(t).match(AMOUNT);if(!m)return null;const n=Number(m[1].replace(/,/g,''));return Number.isFinite(n)?n:null;}
function detect(request){
 const text=norm(request),disaster=DISASTER.test(text),procurement=PROCUREMENT.test(text);if(!disaster||!procurement)return null;
 const amount=parseAmount(text),emergency=EMERGENCY.test(text),le500k=amount!==null&&amount<=500000,gt500k=amount!==null&&amount>500000;
 const bases=[];if(le500k)bases.push('ม.56(2)(ข) + ระเบียบฯ ข้อ 79 วรรคสอง');if(gt500k||amount===null)bases.push('ม.56(2)(ง) — ต้องพิสูจน์องค์ประกอบภัยธรรมชาติ/ฉุกเฉินและความเสียหายร้ายแรง');bases.push('กฎกระทรวงฯ ข้อ 2(5) — ตรวจองค์ประกอบของกรณีฉุกเฉินแยกต่างหาก');
 const missing=[];if(amount===null)missing.push('วงเงินครั้งหนึ่งของการจัดหา');if(!emergency)missing.push('ข้อเท็จจริงที่ยืนยันความจำเป็นเร่งด่วน');missing.push('วันที่/ช่วงเวลาที่เกิดเหตุและช่วงเวลาที่ต้องใช้พัสดุ','เหตุผลว่ากระบวนการปกติหรือวิธีคัดเลือกจะไม่ทันหรือก่อความเสียหายอย่างไร','รายการ/ปริมาณพัสดุและความจำเป็น','ราคาที่เหมาะสมและหลักฐานประกอบ','ตรวจการแบ่งซื้อแบ่งจ้าง','หลักเกณฑ์ e-GP/ข้อยกเว้นที่มีผลใช้บังคับ ณ วันที่ดำเนินการ');
 return Object.freeze({version:VERSION,gateId:GATE_ID,gateLabel:GATE_LABEL,disaster,procurement,emergency,amount,amountBand:le500k?'LE_500K':gt500k?'GT_500K':'UNKNOWN',candidateBases:Object.freeze(bases),decisionLock:true,missingFacts:Object.freeze(missing),sources:SOURCES});
}
function block(g){if(!g)return '';return ['=== EMERGENCY PROCUREMENT DECISION GATE ===','พบการจัดซื้อจัดจ้างในบริบทภัยพิบัติ/อุทกภัย — ห้ามฟันธงจากคำว่า “ฉุกเฉิน” หรือวงเงินเพียงอย่างเดียว','ตรวจแยก: ม.56(2)(ข) + ข้อ 79 วรรคสอง / ม.56(2)(ง) / กฎกระทรวงฯ ข้อ 2(5) ตามข้อเท็จจริงจริง','หากอ้างข้อ 79 วรรคสอง ต้องตรวจเงื่อนไขการดำเนินการก่อนความเห็นชอบและการรายงานขอความเห็นชอบภายหลังตามระเบียบ','e-GP ต้องตรวจหนังสือเวียนที่ใช้บังคับ ณ วันที่ดำเนินการ ไม่ใช้เส้น 500,000 บาทเป็นตัวตัดสิน e-GP โดยอัตโนมัติ','ห้ามเหมารวมว่าอุทกภัยทุกกรณีใช้ข้อ 79 ได้ และห้ามแบ่งซื้อแบ่งจ้างเพื่อหลีกเลี่ยงวิธีการจัดซื้อจัดจ้าง','ข้อมูลที่ต้องตรวจก่อน Final Decision:\n'+g.missingFacts.map((x,i)=>(i+1)+'. '+x).join('\n'),'สถานะ: 🟡 Decision Lock — ต้องตรวจข้อเท็จจริงและต้นฉบับก่อนฟันธง','ผลลัพธ์ต้องแยก: ฐานกฎหมาย / เงื่อนไขที่ผ่าน / เงื่อนไขที่ยังไม่ผ่าน / หลักฐาน / e-GP / Audit Risk','=== END EMERGENCY PROCUREMENT DECISION GATE ==='].join('\n');}
const core=window.GovPromptCore=window.GovPromptCore||{};core.EMERGENCY_PROCUREMENT_GATE_VERSION=VERSION;core.detectEmergencyProcurementGate=detect;core.buildEmergencyProcurementPromptBlock=block;core.EMERGENCY_PROCUREMENT_SOURCES=SOURCES;
if(typeof core.detectAssistanceRoute==='function'){const originalDetect=core.detectAssistanceRoute,originalBuild=core.buildAssistancePromptBlock;core.detectAssistanceRoute=function(request){const route=originalDetect(request),gate=detect(request);if(!route)return route;return Object.freeze({...route,emergencyProcurementGate:gate||null});};if(typeof originalBuild==='function'){core.buildAssistancePromptBlock=function(route){const base=originalBuild(route);return route?.emergencyProcurementGate?base+'\n\n'+block(route.emergencyProcurementGate):base;};}}
})();