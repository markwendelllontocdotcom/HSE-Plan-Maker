// Smoke test of the single-file build in Chromium: loads, sample data, every group renders, review builds the PDF, exports download.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || '/tmp/hse-e2e';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { delete window.showDirectoryPicker; delete window.showSaveFilePicker; delete window.showOpenFilePicker; });
  await page.goto('file://' + path.resolve('dist/release/HSE Plan Maker.html'));
  await page.waitForSelector('.topbar');
  await page.screenshot({ path: out + '/01-start.png' });
  // sample data from My HSE Plans
  await page.click('.navplans');
  await page.click('text=Load sample data');
  await page.waitForSelector('.rv-frame');
  await page.waitForSelector('iframe.rv-frame', { timeout: 60000 });
  await page.screenshot({ path: out + '/02-review.png', fullPage: true });
  for (const g of ['1. Project Information', '2. Project Parties', '3. Document Control', '4. HSE Organization', '5. HSE Requirements', '6. HSE Policy Statements', '7. Appendices', 'Plan Sections', 'Branding']) {
    await page.click(`.navitem:has-text("${g}")`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${out}/g-${g.replace(/[^\w]+/g, '_')}.png`, fullPage: true });
  }
  // exports
  const [d1] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.exports >> text=Word (.docx)')]);
  await d1.saveAs(out + '/' + d1.suggestedFilename());
  const [d2] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.exports >> text=PDF')]);
  await d2.saveAs(out + '/' + d2.suggestedFilename());
  // plans list
  await page.click('.navplans');
  await page.waitForSelector('.plan');
  await page.screenshot({ path: out + '/03-plans.png', fullPage: true });
  await page.click('.plan >> text=Preview');
  await page.waitForSelector('iframe.pv-frame', { timeout: 60000 });
  await page.screenshot({ path: out + '/04-preview.png' });
  await page.click('.pv-head .panel-close');
  // share dialog
  await page.click('.plan >> text=Share');
  await page.waitForSelector('#sh-title');
  await page.screenshot({ path: out + '/05-share.png' });
  const [d3] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('text=Outlook email draft')]);
  await d3.saveAs(out + '/' + d3.suggestedFilename());
  await page.click('.dialog >> text=Close');
  // about
  await page.click('.about-link');
  await page.waitForSelector('#about-title');
  await page.screenshot({ path: out + '/06-about.png' });
  await page.keyboard.press('Escape');
  // import dialog
  await page.click('.topbar >> text=Import project');
  await page.waitForSelector('#imp-title');
  await page.screenshot({ path: out + '/07-import.png' });
  // phone width
  await page.click('.dialog >> text=Cancel');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('.navplans');
  await page.screenshot({ path: out + '/08-phone.png', fullPage: true });
  console.log('downloads', fs.readdirSync(out).filter((f) => /\.(docx|pdf|eml)$/.test(f)));
  console.log('errors', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
