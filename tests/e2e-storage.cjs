// Shared default idb-keyval database with a PQP project (current) and an HSE plan from 1.0.5: after loading 1.0.6
// My HSE Plans lists only the HSE plan, PQP's data is untouched, and PQP's current is unchanged.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const url = 'file://' + path.resolve('dist/release/HSE Plan Maker.html');
  await page.goto('about:blank');
  await page.goto(url);
  await page.waitForSelector('.topbar');
  // seed the shared database as 1.0.5 + PQP Maker would have left it, and remove the new one
  await page.evaluate(async () => {
    const open = (name, ver, up) => new Promise((res, rej) => { const r = indexedDB.open(name, ver); r.onupgradeneeded = () => up && up(r.result); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (db, k, v) => new Promise((res, rej) => { const t = db.transaction('keyval', 'readwrite'); t.objectStore('keyval').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); });
    const shared = await open('keyval-store', 1, (d) => d.createObjectStore('keyval'));
    await put(shared, 'proj:pqp1', { id: 'pqp1', P01: 'PQP Tower', P02: 'DXB-243', D01: 'OPEM-DXB-243-QM-PQP-001', modified: '2026-10-27T10:00:00Z', Q07: [] });
    await put(shared, 'proj:hse1', { id: 'hse1', P01: 'Old HSE Plan', P02: 'DXB-101', POL: [], S01: ['SWP 001'], T02: '24', appVersion: '1.0.5', modified: '2026-10-28T10:00:00Z' });
    await put(shared, 'snaps:hse1', [{ t: 'x', p: { id: 'hse1' } }]);
    await put(shared, 'current', 'hse1');
    await put(shared, 'recent', [{ id: 'pqp1', name: 'PQP Tower', modified: '2026-10-27T10:00:00Z' }]);
    shared.close();
    await new Promise((res) => { const r = indexedDB.deleteDatabase('hse-plan-maker'); r.onsuccess = r.onerror = r.onblocked = res; });
  });
  await page.reload();
  await page.waitForSelector('.topbar');
  await page.waitForTimeout(1500);
  await page.click('.navplans');
  await page.waitForTimeout(500);
  const list = await page.locator('.plans').innerText().catch(() => page.locator('main').innerText());
  console.log('lists Old HSE Plan:', list.includes('Old HSE Plan'), '| lists PQP Tower:', list.includes('PQP Tower'));
  const shared = await page.evaluate(async () => {
    const d = await new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => res(r.result); });
    const get = (k) => new Promise((res) => { const r = d.transaction('keyval').objectStore('keyval').get(k); r.onsuccess = () => res(r.result); });
    return { current: await get('current'), pqp: !!(await get('proj:pqp1')), hseLeft: !!(await get('proj:hse1')) };
  });
  console.log('shared after:', JSON.stringify(shared));
  // a second load does not move again; new work goes to the own database
  await page.click('text=New plan');
  await page.waitForTimeout(1600);
  const shared2 = await page.evaluate(async () => {
    const d = await new Promise((res) => { const r = indexedDB.open('keyval-store'); r.onsuccess = () => res(r.result); });
    const keys = await new Promise((res) => { const r = d.transaction('keyval').objectStore('keyval').getAllKeys(); r.onsuccess = () => res(r.result); });
    return keys;
  });
  console.log('shared keys after new plan:', JSON.stringify(shared2));
  console.log('errors', errors);
  await browser.close();
})();
