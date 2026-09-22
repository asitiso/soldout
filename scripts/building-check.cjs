const { chromium } = require('playwright');
const THREE = require('three');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.waitForSelector('#open-button');
  await page.evaluate(() =>
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2000))]),
  );
  async function point(x, z, level = 2) {
    const r = await page.locator('#world').boundingBox();
    const center = (level - 1) * 3;
    const camera = new THREE.OrthographicCamera(
      (-8.3 * r.width) / r.height,
      (8.3 * r.width) / r.height,
      8.3,
      -8.3,
      0.1,
      100,
    );
    camera.position.set(center + 13, 14, 18);
    camera.zoom = Math.min(1, 14 / (12 + (level - 1) * 6));
    camera.lookAt(center, 0.2, 0.9);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const p = new THREE.Vector3(x, 0, z).project(camera);
    return { x: r.x + ((p.x + 1) * r.width) / 2, y: r.y + ((1 - p.y) * r.height) / 2 };
  }
  async function put(x, z) {
    const p = await point(x, z);
    await page.mouse.move(p.x, p.y);
    await page.waitForTimeout(150);
    assert.equal(
      await page.locator('#placement-status').getAttribute('data-valid'),
      'true',
      await page.locator('#placement-status').textContent(),
    );
    await page.mouse.click(p.x, p.y);
  }
  async function save() {
    await page.click('[data-panel="settings"]');
    await page.click('[data-action="save"]');
    await page.click('[data-close]');
    return page.evaluate(() => JSON.parse(localStorage.getItem('sold-out-save-v1')));
  }
  await page.click('[data-panel="build"]');
  await page.screenshot({ path: 'artifacts/11-building-panel.png' });
  await page.click('[data-action="expand"]');
  await page.waitForTimeout(700);
  assert.equal(await page.locator('.level-badge b').textContent(), '02');
  await page.click('[data-action="move-shelf"][data-id="1"]');
  assert.equal(await page.locator('[data-speed="0"]').getAttribute('class'), 'active');
  const p = await point(9, 0);
  await page.mouse.move(p.x, p.y);
  await page.keyboard.press('r');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'artifacts/12-placement-preview.png' });
  await put(9, 0);
  await page.click('[data-action="finish-edit"]');
  await page.click('[data-panel="build"]');
  await page.click('[data-action="place"][data-id="storage"]');
  await put(9, -2);
  await page.click('[data-action="finish-edit"]');
  await page.click('[data-panel="build"]');
  await page.click('[data-action="place"][data-id="bench"]');
  await put(9, 2);
  await page.click('[data-action="finish-edit"]');
  const snapshot = await save();
  assert.equal(snapshot.version, 2);
  assert.equal(snapshot.state.level, 2);
  assert.equal(snapshot.state.placements.length, 2);
  assert.deepEqual(
    snapshot.state.layout.shelves.find((s) => s.zone === 1),
    { zone: 1, x: 9, z: 0, rotation: 1 },
  );
  assert.equal(snapshot.state.speed, 1);
  const bench = snapshot.state.placements.find((p) => p.kind === 'bench');
  await page.click('[data-panel="build"]');
  await page.click(`[data-action="move-furniture"][data-id="${bench.id}"]`);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#editor-toolbar').isVisible(), true);
  await page.click('[data-action="finish-edit"]');
  await page.reload();
  await page.waitForSelector('#open-button');
  assert.equal(await page.locator('.level-badge b').textContent(), '02');
  await page.screenshot({ path: 'artifacts/13-expanded-pharmacy.png' });
  await page.click('#open-button');
  await page.click('[data-speed="3"]');
  await page.waitForTimeout(12000);
  await page.click('[data-panel="build"]');
  await page.click('[data-action="edit-layout"]');
  await page.waitForTimeout(350);
  const startTime = await page.locator('#time-label').textContent();
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('#time-label').textContent(), startTime);
  await page.click('[data-action="finish-edit"]');
  assert.equal(await page.locator('[data-speed="3"]').getAttribute('class'), 'active');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'artifacts/14-expanded-playing.png' });
  const final = await save();
  assert.ok(final.state.stats.served > 0);
  assert.equal(final.state.level, 2);
  fs.writeFileSync('artifacts/building-state.json', JSON.stringify(final, null, 2));
  assert.deepEqual(errors, []);
  console.log(
    'Building E2E passed: expansion, shelf relocation/rotation, storage/bench, preview, cancel, pause/resume, v2 reload, sales.',
  );
  const context = await browser.newContext();
  const damaged = await context.newPage();
  await damaged.addInitScript(() => {
    if (!localStorage.getItem('recovery-test')) {
      localStorage.setItem('sold-out-save-v1', 'damaged-original');
      localStorage.setItem('recovery-test', '1');
    }
  });
  await damaged.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await damaged.waitForSelector('#open-button');
  await damaged.reload();
  await damaged.waitForSelector('#open-button');
  assert.equal(
    await damaged.evaluate(() => localStorage.getItem('sold-out-save-v1')),
    'damaged-original',
  );
  await damaged.click('[data-panel="settings"]');
  await damaged.click('[data-action="save"]');
  assert.equal(
    await damaged.evaluate(() => localStorage.getItem('sold-out-save-v1-recovery')),
    'damaged-original',
  );
  console.log('Damaged-save preservation and manual recovery backup passed.');
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
