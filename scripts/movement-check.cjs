const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const { Simulation } = await import('../src/simulation.js');
  const game = new Simulation();
  game.expand();
  game.expand();
  game.hire('pharmacist');
  game.hire('cashier');
  game.open();
  game.s.spawnIn = 9999;
  game.s.speed = 0;
  for (let i = 0; i < 50; i++) game.spawnCustomer(i % 3 ? 'shop' : 'prescription', 'mask');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('movement-fixture')) {
      localStorage.setItem('sold-out-save-v1', raw);
      localStorage.setItem('movement-fixture', '1');
    }
  }, game.serialize());
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.waitForSelector('#open-button');
  await page.click('[data-speed="3"]');
  await page.waitForTimeout(10000);
  const performanceSample = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let start = performance.now(),
          last = start,
          d = [];
        function tick(now) {
          d.push(now - last);
          last = now;
          if (now - start >= 3000) {
            d.sort((a, b) => a - b);
            resolve({
              frames: d.length,
              seconds: (now - start) / 1000,
              p95ms: d[Math.floor(d.length * 0.95)],
            });
          } else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }),
  );
  await page.click('[data-speed="0"]');
  await page.click('[data-panel="settings"]');
  await page.click('[data-action="save"]');
  await page.click('[data-close]');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sold-out-save-v1'))),
    people = [...saved.state.staff, ...saved.state.customers];
  assert.ok(saved.state.stats.served > 0);
  let minDistance = Infinity;
  for (let i = 0; i < people.length; i++)
    for (let j = i + 1; j < people.length; j++)
      minDistance = Math.min(
        minDistance,
        Math.hypot(people[i].x - people[j].x, people[i].z - people[j].z),
      );
  assert.ok(minDistance >= 0.419);
  fs.mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/20-pedestrian-avoidance.png' });
  await page.reload();
  await page.waitForSelector('#open-button');
  assert.equal(await page.locator('[data-speed="0"]').getAttribute('class'), 'active');
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    'artifacts/movement-performance.json',
    JSON.stringify(
      {
        environment: 'Headless Edge 1440x1000; started with 50 customers, speed 3',
        people: people.length,
        served: saved.state.stats.served,
        minDistance,
        ...performanceSample,
      },
      null,
      2,
    ),
  );
  console.log('Movement UI passed: 3x crowded service, clearance, pause, save/reload.', {
    people: people.length,
    served: saved.state.stats.served,
    minDistance,
    ...performanceSample,
  });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
