const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const { Simulation } = await import('../src/simulation.js');
  const game = new Simulation();
  game.expand();
  game.expand();
  game.open();
  game.s.auto = false;
  game.s.spawnIn = 9999;
  game.s.phoneIn = 9999;
  for (let i = 0; i < 50; i++) game.spawnCustomer('prescription', 'mask');
  for (let i = 0; i < 250; i++) game.update(0.1);
  game.s.speed = 0;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('crowd-fixture')) {
      localStorage.setItem('sold-out-save-v1', raw);
      localStorage.setItem('crowd-fixture', '1');
    }
  }, game.serialize());
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.waitForSelector('#scene-caption');
  await page.waitForTimeout(1000);
  assert.match(await page.locator('#scene-caption').textContent(), /실내 18\/18명 · 외부 32명/);
  fs.mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/18-fifty-customers.png' });
  await page.click('[data-speed="1"]');
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const deltas = [];
        let start = performance.now(),
          last = start;
        function tick(now) {
          deltas.push(now - last);
          last = now;
          if (now - start >= 3000) {
            deltas.sort((a, b) => a - b);
            resolve({
              frames: deltas.length,
              seconds: (now - start) / 1000,
              p95ms: deltas[Math.floor(deltas.length * 0.95)],
            });
          } else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }),
  );
  await page.click('[data-speed="0"]');
  await page.click('[data-panel="settings"]');
  await page.click('[data-action="save"]');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sold-out-save-v1')));
  assert.equal(saved.state.customers.length, 50);
  assert.equal(saved.state.customers.filter((c) => c.state === 'outside').length, 32);
  await page.reload();
  await page.waitForSelector('#scene-caption');
  assert.match(await page.locator('#scene-caption').textContent(), /외부 32명/);
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    'artifacts/crowd-performance.json',
    JSON.stringify(
      { environment: 'Headless Microsoft Edge, local 1440x1000, 50 customers', ...frames },
      null,
      2,
    ),
  );
  console.log(
    'Crowd UI passed: 50 characters, 18 indoor/32 outside, resume/pause, save/reload, no JS errors.',
    frames,
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
