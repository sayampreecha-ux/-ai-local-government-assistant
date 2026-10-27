import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.GOVPROMPT_TEST_URL || 'http://127.0.0.1:4177/index.html';
const labels = [
  'ภาษีที่ดินและสิ่งปลูกสร้าง', 'ภาษีป้าย', 'ภาษีผู้เข้าพักโรงแรม (อบจ.)', 'น้ำมัน ก๊าซ และยาสูบ (อบจ.)', 'การประเมินและอุทธรณ์ภาษี',
  'ภาษีค้างชำระและเร่งรัด', 'แผนที่ภาษีและสำรวจทรัพย์สิน',
  'LTAX GIS / ONLINE', 'New e-LAAS', 'หนังสือแจ้งภาษี'
];
const browser = await chromium.launch({headless:true});
try {
  for (const viewport of [{width:390,height:844},{width:1280,height:900}]) {
    const page = await browser.newPage({viewport, hasTouch: viewport.width <= 390});
    await page.goto(base, {waitUntil:'domcontentloaded'});
    const revenue = page.locator('.work-catalog-group[data-category-id="revenue"]');
    await revenue.waitFor();
    assert.equal(await revenue.count(),1);
    assert.equal(await revenue.locator('.work-catalog-tasks').isVisible(),false);
    const heading = revenue.locator(':scope > h3 > button.work-catalog-category-toggle');
    await heading.click();
    assert.equal(await heading.getAttribute('aria-expanded'),'true');
    const tasks = revenue.locator('.work-catalog-task');
    assert.equal(await tasks.count(),10);
    for (let i=0;i<labels.length;i++) {
      const button = tasks.nth(i);
      assert.equal((await button.innerText()).trim(),labels[i]);
      if (i > 0) page.once('dialog', dialog => dialog.accept());
      await button.evaluate(el => el.click());
      const text = await page.locator('#promptInput').inputValue();
      assert.ok(text.length>20 && text.includes(i===7?'LTAX':i===8?'e-LAAS':i===9?'หนังสือแจ้งภาษี':i===3?'น้ำมัน':'ภาษี'),labels[i]);
      assert.equal(await page.locator('#conversation .message').count(),0,'menu selection must not send');
      assert.equal(await page.locator('#promptInput').evaluate(el=>document.activeElement===el),true);
      await page.locator('#promptInput').fill(text+' เพิ่มข้อมูล');
      assert.ok((await page.locator('#promptInput').inputValue()).endsWith('เพิ่มข้อมูล'));
    }
    const editedDraft = await page.locator('#promptInput').inputValue();
    page.once('dialog', dialog => dialog.dismiss());
    await tasks.first().evaluate(el => el.click());
    assert.equal(await page.locator('#promptInput').inputValue(), editedDraft);
    assert.equal(await heading.getAttribute('aria-controls'), 'work-catalog-tasks-revenue');
    await heading.focus();
    assert.equal(await heading.evaluate(el => document.activeElement === el), true);
    await heading.press('Space');
    assert.equal(await heading.getAttribute('aria-expanded'),'false');
    const other = page.locator('.work-catalog-group[data-category-id="records"]');
    const otherHeading = other.locator(':scope > h3 > button.work-catalog-category-toggle');
    await otherHeading.click();
    assert.equal(await otherHeading.getAttribute('aria-expanded'),'true');
    await heading.click();
    assert.equal(await otherHeading.getAttribute('aria-expanded'),'false');
    assert.equal(await heading.getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('.work-catalog-group').count(),14);
    await heading.press('Enter');
    assert.equal(await heading.getAttribute('aria-expanded'), 'false');
    await heading.press('Enter');
    assert.equal(await heading.getAttribute('aria-expanded'), 'true');
    assert.equal(await revenue.locator('.work-catalog-tasks').isVisible(), true);
    await heading.press('Space');
    assert.equal(await revenue.locator('.work-catalog-tasks').isVisible(), false);
    // Exercise touch on mobile and pointer on desktop against native button.
    if (viewport.width <= 390) {
      await heading.tap();
      assert.equal(await heading.getAttribute('aria-expanded'), 'true');
    }
    // The normal form is still the only send path. Selecting a revenue task
    // never bypasses the user's explicit submit action.
    assert.equal(await page.locator('#chatForm button[type="submit"]').count(),1);
    // Tort follows the same result-page route as other legal actions, not revenue fill-only behavior.
    const legal = page.locator('.work-catalog-group[data-category-id="audit"]');
    await legal.locator('.work-catalog-category-toggle').click();
    const tort = legal.locator('.work-catalog-task', {hasText:'⚖️ งานความรับผิดทางละเมิด'});
    assert.equal(await tort.count(),1);
    assert.equal(await page.locator('.work-catalog-task', {hasText:'⚖️ งานความรับผิดทางละเมิด'}).count(),1);
    assert.equal(await tort.getAttribute('data-revenue-prompt'),null);
    const before = await page.locator('#conversation .message').count();
    await Promise.all([
      page.waitForURL(url => url.searchParams.get('view') === 'result'),
      tort.click()
    ]);
    assert.equal(new URL(page.url()).searchParams.get('view'),'result');
    await page.locator('body').waitFor({state:'visible'});
    assert.ok((await page.locator('body').innerText()).length > 30,'result page must render');
    console.log((viewport.width<=390?'mobile':'desktop')+' tort legal normal result navigation PASS');
    await page.close();
  }
  console.log('Revenue eight-menu Chromium mobile/desktop E2E PASS');
} finally {
  await browser.close();
}
