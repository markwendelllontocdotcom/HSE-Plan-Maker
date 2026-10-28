// Import flows: Library file, Master List (Excel), pasted Library link; then plans list, duplicate, delete; a shared #hse= link.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || '/tmp/hse-e2e-import';
fs.mkdirSync(out, { recursive: true });
const fx = (f) => path.resolve('tests/fixtures/' + f);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { delete window.showDirectoryPicker; delete window.showSaveFilePicker; delete window.showOpenFilePicker; });
  const url = 'file://' + path.resolve('dist/release/HSE Plan Maker.html');
  await page.goto(url);
  await page.waitForSelector('.topbar');
  const val = (id) => page.inputValue('#f-' + id);
  const check = (label, a, b) => { if (a !== b) errors.push(`${label}: got "${a}", expected "${b}"`); else console.log('ok', label, a); };

  // 1. Library file into the blank plan
  await page.click('.topbar >> text=Import project');
  let [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('text=Project Library or PQP Maker file')]);
  await fc.setFiles(fx('library-sample.pqp.json'));
  await page.waitForSelector('#sheet-title:has-text("Review")');
  await page.click('.navitem:has-text("1. Project Information")');
  check('P01', await val('P01'), 'Sample Library Tower');
  check('P02', await val('P02'), 'DXB-777');
  await page.click('.navitem:has-text("4. HSE Organization")');
  check('K04 HSE manager', await page.inputValue('#f-K04'), 'HSE Sample');
  check('K02 PM', await page.inputValue('#f-K02'), 'PM Sample');
  await page.click('.navitem:has-text("3. Document Control")');
  check('D06 follows', await val('D06'), 'HSE Sample');

  // 2. Master List: P902 in Abu Dhabi -> new plan, code column OSHAD
  await page.click('.topbar >> text=Import project');
  [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('text=Projects Master List (Excel)')]);
  await fc.setFiles(fx('master-list-sample.xlsx'));
  await page.waitForSelector('.master-row');
  await page.screenshot({ path: out + '/master.png' });
  await page.click('.master-row:has-text("Sample Island Villas")');
  await page.waitForSelector('#dlg-title');
  await page.screenshot({ path: out + '/ask.png' });
  await page.click('.dialog button:has-text("Start a new plan")');
  await page.click('.navitem:has-text("1. Project Information")');
  check('master P01', await val('P01'), 'Sample Island Villas');
  check('master P02 (from no.)', await val('P02'), 'P902');
  check('master P04', await page.inputValue('#f-P04'), 'Abu Dhabi');
  await page.click('.navitem:has-text("2. Project Parties")');
  check('master R02 (lead na -> MEP consultant)', await val('R02'), 'Sample Engineering');
  await page.click('.navitem:has-text("5. HSE Requirements")');
  check('code column follows the imported emirate', await page.inputValue('#f-C01 select'), 'abudhabi');

  // 3. Pasted link, update the open plan
  await page.click('.topbar >> text=Import project');
  await page.fill('.imp-link textarea', fs.readFileSync(fx('library-link.txt'), 'utf8'));
  await page.click('text=Import from link');
  await page.waitForSelector('#dlg-title');
  await page.click('.dialog button:has-text("Update the open plan")');
  await page.click('.navitem:has-text("1. Project Information")');
  check('link P01', await val('P01'), 'Sample Library Tower');

  // 4. Emirate change switches the code column (the link brought Dubai back)
  await page.click('.navitem:has-text("5. HSE Requirements")');
  check('code after Dubai link', await page.inputValue('#f-C01 select'), 'dubai');
  await page.click('.navitem:has-text("1. Project Information")');
  await page.selectOption('#f-P04', 'Abu Dhabi');
  await page.click('.navitem:has-text("5. HSE Requirements")');
  check('code after emirate', await page.inputValue('#f-C01 select'), 'abudhabi');

  // plans list, duplicate and delete
  await page.click('.navplans');
  await page.waitForTimeout(1300);
  await page.click('.navplans');
  const n0 = await page.locator('.plan').count();
  await page.locator('.plan').first().locator('text=More').click();
  await page.locator('.plan').first().locator('text=Duplicate').click();
  await page.waitForTimeout(300);
  check('duplicate', String(await page.locator('.plan').count()), String(n0 + 1));
  await page.locator('.plan').first().locator('text=More').click();
  await page.locator('.plan').first().locator('text=Delete…').click();
  await page.click('.dialog button:text-is("Delete")');
  await page.waitForTimeout(300);
  check('delete', String(await page.locator('.plan').count()), String(n0));
  await page.screenshot({ path: out + '/plans.png', fullPage: true });

  // a shared link (#hse=) opens as a copy
  const link = await page.evaluate(async () => {
    const p = { P01: 'Shared Link Tower', P02: 'DXB-555', D01: 'OPEM-DXB-555-HSE-001', D03: '01', D04: '28.10.2026' };
    const json = JSON.stringify({ format: 'hse-plan-maker-project', version: 1, project: p });
    const z = new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
    let s = ''; z.forEach((b) => (s += String.fromCharCode(b)));
    return '#hse=' + btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  });
  await page.goto(url + link);
  await page.waitForSelector('#dlg-title:has-text("shared")');
  await page.click('.dialog button:has-text("Open the plan")');
  await page.waitForSelector('#sheet-title:has-text("Review")');
  check('shared title', await page.textContent('.tb .v'), 'Shared Link Tower');
  console.log('errors', errors);
  await browser.close();
  if (errors.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
