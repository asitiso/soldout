const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const { Simulation } = await import('../src/simulation.js');
  const game = new Simulation();
  game.s.day = 8;
  game.s.crisis = 5;
  game.s.newsIndex = 7;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('fixture-loaded')) {
      localStorage.setItem('sold-out-save-v1', raw);
      localStorage.setItem('fixture-loaded', '1');
    }
  }, game.serialize());
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.waitForSelector('#open-button');
  await page.click('[data-panel="news"]');
  assert.match(await page.locator('.crisis-board').textContent(), /위기의 정점/);
  fs.mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/15-crisis-dashboard.png' });
  await page.locator('.crisis-actions [data-panel="order"]').click();
  const qty = page.locator('[data-qty="mask"]');
  assert.equal(await qty.getAttribute('max'), '35');
  await qty.fill('35');
  await page.click('[data-action="order"][data-id="mask"]');
  assert.equal(await page.locator('[data-action="order"][data-id="mask"]').isDisabled(), true);
  await page.screenshot({ path: 'artifacts/16-daily-supply.png' });
  await page.selectOption('#supplier', 'express');
  assert.equal(await page.locator('[data-action="order"][data-id="mask"]').isEnabled(), true);
  await page.click('[data-close]');
  await page.click('[data-panel="settings"]');
  await page.click('[data-action="save"]');
  await page.reload();
  await page.waitForSelector('#open-button');
  await page.click('[data-panel="order"]');
  assert.equal(await page.locator('[data-action="order"][data-id="mask"]').isDisabled(), true);
  await page.click('[data-close]');
  await page.click('[data-panel="news"]');
  await page.locator('.crisis-actions [data-panel="inventory"]').click();
  assert.match(await page.locator('#modal-title').textContent(), /재고|매대|채우/);
  await page.click('[data-close]');
  await page.setViewportSize({ width: 600, height: 800 });
  await page.click('[data-panel="news"]');
  await page.screenshot({ path: 'artifacts/17-crisis-mobile.png' });
  assert.equal(
    await page.locator('.crisis-board').evaluate((e) => e.scrollWidth <= e.clientWidth),
    true,
  );
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    'Crisis UI passed: stage, forecast, action links, daily sellout, supplier switch, reload and mobile.',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
