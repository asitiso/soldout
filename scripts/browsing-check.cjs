const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const { Simulation } = await import('../src/simulation.js');
  const game = new Simulation();
  game.expand();
  game.open();
  game.s.spawnIn = 9999;
  for (let i = 0; i < 10; i++) game.spawnCustomer('shop', 'mask');
  for (let i = 0; i < 100; i++) game.update(0.1);
  game.s.speed = 0;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('browsing-fixture')) {
      localStorage.setItem('sold-out-save-v1', raw);
      localStorage.setItem('browsing-fixture', '1');
    }
  }, game.serialize());
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.waitForSelector('#open-button');
  await page.waitForTimeout(500);
  const meshCounts = await page.evaluate(async () => {
    const { character, disposeModel } = await import('/src/models.js');
    const c = character(20);
    let total = 0,
      visible = 0;
    c.traverse((o) => {
      if (o.isMesh) {
        total++;
        let v = true;
        for (let p = o; p; p = p.parent) v &&= p.visible;
        if (v) visible++;
      }
    });
    disposeModel(c);
    return { total, visible };
  });
  assert.ok(meshCounts.visible <= 7, JSON.stringify(meshCounts));
  fs.mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/19-shelf-waiting.png' });
  await page.click('[data-panel="settings"]');
  await page.click('[data-action="save"]');
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('sold-out-save-v1')));
  assert.ok(save.state.customers.some((c) => c.state === 'shelfwait'));
  assert.equal(save.state.customers.filter((c) => ['browse', 'pick'].includes(c.state)).length, 1);
  await page.reload();
  await page.waitForSelector('#open-button');
  await page.click('[data-speed="3"]');
  await page.waitForTimeout(10000);
  await page.click('[data-speed="0"]');
  await page.click('[data-panel="settings"]');
  await page.click('[data-action="save"]');
  const later = await page.evaluate(() => JSON.parse(localStorage.getItem('sold-out-save-v1')));
  assert.ok(later.state.stats.served > 0);
  assert.deepEqual(errors, []);
  console.log('Shelf UI passed: waiting/restored/served; visible meshes per character', meshCounts);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
