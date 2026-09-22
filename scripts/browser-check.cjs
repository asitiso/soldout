const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-gpu-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:4173');
  await page.waitForSelector('#open-button');
  assert.equal(await page.locator('canvas').count(), 1);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/01-ready.png' });
  console.log('title', await page.title(), 'canvas', await page.locator('canvas').count());
  await page.click('#open-button');
  await page.click('[data-speed="3"]');
  await page.waitForTimeout(12000);
  await page.screenshot({ path: 'artifacts/02-playing.png' });
  console.log(
    'after opening',
    await page.locator('#time-label').textContent(),
    await page.locator('#served-label').textContent(),
  );
  await page.click('[data-panel="order"]');
  await page.screenshot({ path: 'artifacts/03-order.png' });
  await page.selectOption('#supplier', 'express');
  await page.locator('[data-qty="mask"]').fill('12');
  await page.locator('[data-action="order"][data-id="mask"]').click();
  await page.click('[data-close]');
  await page.click('[data-panel="staff"]');
  await page.click('[data-action="hire"][data-id="cashier"]');
  await page.click('[data-close]');
  await page.click('[data-panel="build"]');
  await page.click('[data-action="pop"][data-id="cold"]');
  await page.click('[data-close]');
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.toast')].some((e) =>
        e.textContent.includes('창고 입고 완료'),
      ),
    {},
    { timeout: 45000 },
  );
  await page.click('[data-panel="inventory"]');
  await page.click('[data-action="restock"][data-id="mask"]');
  await page.click('[data-close]');
  await page.waitForFunction(
    () => [...document.querySelectorAll('.toast')].some((e) => e.textContent.includes('진열 완료')),
    {},
    { timeout: 45000 },
  );
  await page.screenshot({ path: 'artifacts/04-busy.png' });
  await page.click('[data-panel="settings"]');
  await page.click('[data-action="save"]');
  await page.click('[data-close]');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sold-out-save-v1')));
  assert.equal(saved.state.staff.length, 2);
  assert.equal(saved.state.orders[0].status, 'stored');
  assert.ok(saved.state.pop.includes('cold'));
  assert.ok(saved.state.stats.served > 0);
  assert.ok(saved.state.stats.prescriptions > 0);
  fs.writeFileSync('artifacts/browser-state.json', JSON.stringify(saved, null, 2));
  console.log(
    'game state',
    JSON.stringify({
      phase: saved.state.phase,
      staff: saved.state.staff.length,
      served: saved.state.stats.served,
      orders: saved.state.orders,
      pop: saved.state.pop,
    }),
  );
  await page.click('#open-button');
  await page.click('[data-action="close-day"]');
  await page.waitForSelector('[data-action="nextday"]', { timeout: 90000 });
  await page.screenshot({ path: 'artifacts/05-summary.png' });
  await page.click('[data-action="nextday"]');
  console.log('next day', await page.locator('#day-label').textContent());
  assert.equal(await page.locator('#day-label').textContent(), 'DAY 02');
  await page.reload();
  await page.waitForSelector('#day-label');
  console.log('restored', await page.locator('#day-label').textContent());
  assert.equal(await page.locator('#day-label').textContent(), 'DAY 02');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.screenshot({ path: 'artifacts/06-compact.png' });
  console.log('page errors', errors);
  assert.deepEqual(errors, []);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
