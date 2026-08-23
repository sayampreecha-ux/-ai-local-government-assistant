import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const runtimeUrl = new URL(`assets/js/core/government-workflow-runtime-v5.js?e2e=${Date.now()}`, frontend).toString();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error?.message || error)));

try {
  await page.goto(frontend, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => document.readyState === 'complete' && Boolean(document.getElementById('chatForm')), undefined, { timeout: 20_000 });
  await page.waitForFunction(() => Boolean(document.querySelector('.gp-case-button')), undefined, { timeout: 20_000 });

  const result = await page.evaluate(async ({ runtimeUrl }) => {
    localStorage.removeItem('govprompt-v7-case-memory');
    const runtime = await import(runtimeUrl);

    const machine = runtime.buildWorkflowRuntimeView({ query: 'อบจ.จะซื้อเครื่องจักร 100 ล้านบาท' });
    const workforce = runtime.buildWorkflowRuntimeView({ query: 'ทำแผนอัตรากำลัง อบต.ดงสุวรรณ รอบ 2570-2572' });
    const citizen = runtime.buildWorkflowRuntimeView({ query: 'ขออนุญาตก่อสร้างบ้านต้องทำอย่างไร' });
    const citizenResume = runtime.buildWorkflowRuntimeView({ query: 'ทำต่อ ขออนุญาต บริการประชาชน' });

    await new Promise((resolve) => setTimeout(resolve, 50));
    const caseButton = document.querySelector('.gp-case-button');
    const count = Number(caseButton?.querySelector('.gp-case-count')?.textContent || 0);
    const memory = localStorage.getItem('govprompt-v7-case-memory') || '';

    return {
      bridgeVersion: runtime.WORKFLOW_RUNTIME_BRIDGE_VERSION,
      machine: {
        primary: machine.primary?.workflowId,
        ids: machine.workflowIds,
        failClosed: machine.governance?.failClosed,
        missing: machine.primary?.missingEvidence || [],
        autoApprovalAllowed: machine.primary?.autoApprovalAllowed,
        rawEvidenceValuesReturned: machine.governance?.rawEvidenceValuesReturned
      },
      workforce: {
        primary: workforce.primary?.workflowId,
        ids: workforce.workflowIds,
        failClosed: workforce.governance?.failClosed,
        missing: workforce.primary?.missingEvidence || [],
        substantiveDecisionMade: workforce.primary?.qualityGate?.substantiveDecisionMade
      },
      citizen: {
        primary: citizen.primary?.workflowId,
        ids: citizen.workflowIds,
        stageId: citizen.primary?.currentStage?.id,
        status: citizen.primary?.workflowStatus,
        missing: citizen.primary?.missingEvidence || [],
        caseId: citizen.caseId
      },
      citizenResume: {
        resumed: citizenResume.resumedCase,
        primary: citizenResume.primary?.workflowId,
        caseId: citizenResume.caseId
      },
      caseUI: {
        exists: Boolean(caseButton),
        count,
        label: caseButton?.textContent || ''
      },
      memory
    };
  }, { runtimeUrl });

  assert.equal(result.bridgeVersion, '5.3');

  assert.equal(result.machine.primary, 'gov.procurement');
  assert.ok(result.machine.ids.includes('gov.project'));
  assert.ok(result.machine.ids.includes('gov.finance'));
  assert.equal(result.machine.failClosed, true);
  assert.ok(result.machine.missing.includes('missionAuthority'));
  assert.equal(result.machine.autoApprovalAllowed, false);
  assert.equal(result.machine.rawEvidenceValuesReturned, false);

  assert.equal(result.workforce.primary, 'gov.hr');
  assert.ok(result.workforce.ids.includes('gov.hr'));
  assert.equal(result.workforce.failClosed, true);
  assert.ok(result.workforce.missing.includes('hrIntent'));
  assert.ok(result.workforce.missing.includes('facts'));
  assert.equal(result.workforce.substantiveDecisionMade, false);

  assert.equal(result.citizen.primary, 'gov.citizen-service');
  assert.ok(result.citizen.ids.includes('gov.engineering'));
  assert.ok(result.citizen.ids.includes('gov.legal'));
  assert.equal(result.citizen.stageId, 'identify-service');
  assert.equal(result.citizen.status, 'blocked-missing-evidence');
  assert.ok(result.citizen.missing.includes('serviceType'));

  assert.equal(result.citizenResume.resumed, true);
  assert.equal(result.citizenResume.primary, 'gov.citizen-service');
  assert.equal(result.citizenResume.caseId, result.citizen.caseId);

  assert.equal(result.caseUI.exists, true);
  assert.match(result.caseUI.label, /งานค้าง/);
  assert.ok(result.caseUI.count >= 3, `expected at least 3 active cases, got ${result.caseUI.count}`);
  assert.equal(result.memory.includes('100 ล้านบาท'), false);
  assert.equal(result.memory.includes('ดงสุวรรณ'), false);
  assert.equal(result.memory.includes('ก่อสร้างบ้านต้องทำอย่างไร'), false);
  assert.deepEqual(pageErrors, [], `browser page errors: ${JSON.stringify(pageErrors)}`);

  console.log(JSON.stringify({
    frontend,
    checks: {
      machineryProcurement: 'PASS',
      workforcePlan: 'PASS',
      buildingPermitCitizenService: 'PASS',
      exactCaseResume: 'PASS',
      pendingCaseBadge: 'PASS',
      privacyMinimizedCaseMemory: 'PASS',
      browserErrors: 'PASS'
    }
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
