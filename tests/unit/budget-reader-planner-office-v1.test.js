import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBaselineBudgetDocument, parseRevenueActualsDocument, parseTargetYearPlanDocument } from '../../src/budget-official-document-parser.js';
import { buildBudgetWorkingDraftEvidence } from '../../src/budget-working-draft-planner.js';
import { buildBudgetDeliverableArtifacts } from '../../src/budget-artifact-factory.js';
import { buildBudgetXlsxBlob, buildBudgetDocxBlob } from '../../assets/js/core/budget-office-export-v1.js';

const AT = '2026-08-15T12:00:00.000Z';
const ev = (key,value,extra={}) => ({key,value,...extra});

const baselineText = `ข้อบัญญัติงบประมาณรายจ่าย ประจำปีงบประมาณ พ.ศ. 2569\nรายได้จัดเก็บเอง 20,000,000 บาท\nรายได้ที่รัฐบาลจัดเก็บและจัดสรรให้ 300,000,000 บาท\nเงินอุดหนุนทั่วไป 250,000,000 บาท\nงบกลาง 60,000,000 บาท\nงบบุคลากร 250,000,000 บาท\nงบดำเนินงาน 130,000,000 บาท\nงบลงทุน 129,000,000 บาท\nงบเงินอุดหนุน 1,000,000 บาท\nรวมรายจ่ายทั้งสิ้น 570,000,000 บาท`;

test('deterministic parser extracts baseline categories and total', () => {
  const result = parseBaselineBudgetDocument(baselineText,{targetYear:2570});
  assert.equal(result.valid,true);
  assert.equal(result.data.fiscalYear,2569);
  assert.equal(result.data.total,570000000);
  assert.ok(result.data.expenseItems.some(row => row.key === 'personnel' && row.amount === 250000000));
  assert.ok(result.data.revenueItems.some(row => row.key === 'general-grant' && row.amount === 250000000));
});

test('revenue and target plan parsers extract structured values without LLM invention', () => {
  const revenue = parseRevenueActualsDocument('รายงานรายรับ ณ วันที่ 31 กรกฎาคม 2569\nรายได้จัดเก็บเอง 16,000,000\nภาษีจัดสรร 230,000,000\nเงินอุดหนุนทั่วไป 205,000,000\nรวมรายรับ 451,000,000');
  assert.equal(revenue.valid,true); assert.equal(revenue.data.total,451000000);
  const plan = parseTargetYearPlanDocument('แผนพัฒนาท้องถิ่น ปีงบประมาณ 2570\nโครงการปรับปรุงถนนสาย ก 5,000,000\nโครงการเสาไฟ LED ระบบโซลาร์เซลล์ 497,000',{targetYear:2570});
  assert.equal(plan.valid,true); assert.equal(plan.data.targetYear,2570); assert.equal(plan.data.projectCount,2);
});

test('working draft planner preserves baseline ceiling and labels all derived budget lines estimated', () => {
  const baseline = parseBaselineBudgetDocument(baselineText,{targetYear:2570}).data;
  const evidence = [
    ev('baselineBudget',baseline,{official:true,verified:true}),
    ev('latestRevenueActuals',{total:451000000,rows:[{key:'r',amount:451000000}]},{official:true,verified:true}),
    ev('targetYearPlan',{targetYear:2570,projects:[{id:'P1',name:'ถนน',amount:5000000}]},{official:true,verified:true})
  ];
  const result = buildBudgetWorkingDraftEvidence({evidence});
  assert.equal(result.status,'ready-working-draft');
  const totals = result.evidence.find(item => item.key === 'budgetTotals').value;
  assert.equal(totals.revenueTotal,570000000); assert.equal(totals.expenseTotal,570000000);
  assert.ok(totals.revenueItems.every(item => item.status === 'estimated' && item.estimated === true));
  assert.ok(totals.expenseItems.every(item => item.status === 'estimated' && item.estimated === true));
  const priority = result.evidence.find(item => item.key === 'priorityReadiness').value;
  assert.ok(priority.rows.every(row => row.priority === 'Reserve' && row.readiness === 'unverified'));
});

test('Office exporter creates actual XLSX and DOCX ZIP packages from governed structured artifact', async () => {
  const baseline = parseBaselineBudgetDocument(baselineText,{targetYear:2570}).data;
  const planned = buildBudgetWorkingDraftEvidence({evidence:[
    ev('baselineBudget',baseline,{official:true,verified:true}), ev('latestRevenueActuals',{total:451000000,rows:[{key:'r',amount:451000000}]},{official:true,verified:true}),
    ev('targetYearPlan',{targetYear:2570,projects:[{id:'P1',name:'ปรับปรุงถนน',amount:5000000}]},{official:true,verified:true}),
    ev('budgetSourceRegister',[{evidenceKey:'baselineBudgetSource',documentTitle:'ข้อบัญญัติงบประมาณ 2569',sourceName:'อบจ.',sourceUrl:'https://example.go.th/baseline',contentReadAndVerified:true}]),
    ev('organizationContext',{organizationName:'อบจ.พะเยา'}), ev('targetBudgetYear',2570)
  ]});
  const artifacts = buildBudgetDeliverableArtifacts({evidence:planned.evidence,generatedAt:AT});
  assert.equal(artifacts.status,'ready');
  const artifact = artifacts.artifacts.find(item => item.key === 'budget-structured-export');
  const xlsx = new Uint8Array(await buildBudgetXlsxBlob(artifact).arrayBuffer());
  const docx = new Uint8Array(await buildBudgetDocxBlob(artifact).arrayBuffer());
  assert.equal(xlsx[0],0x50); assert.equal(xlsx[1],0x4b); assert.equal(docx[0],0x50); assert.equal(docx[1],0x4b);
  const xlsxText = Buffer.from(xlsx).toString('latin1');
  const docxText = Buffer.from(docx).toString('latin1');
  assert.match(xlsxText,/xl\/workbook\.xml/); assert.match(xlsxText,/xl\/worksheets\/sheet1\.xml/);
  assert.match(docxText,/word\/document\.xml/);
});
