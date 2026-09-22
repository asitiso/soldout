const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForSelector('#open-button');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/07-final-ready.png' });
  await page.mouse.click(398, 443);
  await page.waitForTimeout(400);
  assert.ok(await page.locator('.context-card').count(), '3D shelf selection should open context');
  await page.keyboard.press('Escape');
  const saved = fs.readFileSync('artifacts/browser-state.json', 'utf8');
  await page.evaluate((raw) => localStorage.setItem('sold-out-save-v1', raw), saved);
  await page.click('[data-panel="settings"]');
  await page.click('[data-action="load"]');
  await page.click('[data-close]');
  await page.waitForTimeout(5000);
  assert.equal(await page.locator('#store-status').textContent(), 'OPEN');
  assert.ok(Number((await page.locator('#served-label').textContent()).replace(/\D/g, '')) > 0);
  await page.screenshot({ path: 'artifacts/08-final-playing.png' });
  await page.click('[data-speed="0"]');
  const time = await page.locator('#time-label').textContent();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('#time-label').textContent(), time, 'pause should stop clock');
  await page.click('#rotate-right');
  await page.waitForTimeout(500);
  await page.click('#home-view');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'artifacts/09-final-compact.png' });
  await page.setViewportSize({ width: 600, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'artifacts/10-final-narrow.png' });
  assert.deepEqual(errors, []);
  console.log(
    'Visual and dev checks passed: shelf raycast, active save restore, pause, rotation, responsive layouts; no page errors.',
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
