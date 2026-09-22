const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
  await page.waitForSelector('#open-button');
  await page.click('[data-panel="settings"]');
  await page.waitForFunction(
    () => document.querySelector('#audio-status')?.textContent === '오디오 활성화됨',
  );
  await page.waitForFunction(() => document.querySelector('#audio-meter').value > 0.001);
  console.log('Background audio signal detected.');
  async function volume(channel, value) {
    await page.locator('#audio-' + channel).evaluate((e, v) => {
      e.value = v;
      e.dispatchEvent(new Event('input', { bubbles: true }));
    }, String(value));
  }
  await volume('music', 0);
  await page.waitForTimeout(350);
  await page.click('[data-action="sound-test"]');
  await page.waitForFunction(() => document.querySelector('#audio-meter').value > 0.01);
  const audible = await page.locator('#audio-meter').evaluate((e) => e.value);
  await volume('master', 0);
  await page.waitForTimeout(350);
  assert.ok((await page.locator('#audio-meter').evaluate((e) => e.value)) < 0.000001);
  await volume('master', 80);
  await page.click('[data-action="sound"]');
  await page.click('[data-action="sound-test"]');
  await page.waitForTimeout(350);
  assert.ok((await page.locator('#audio-meter').evaluate((e) => e.value)) < 0.000001);
  await page.click('[data-action="sound"]');
  await page.click('[data-action="sound-test"]');
  await page.waitForFunction(() => document.querySelector('#audio-meter').value > 0.01);
  await volume('effects', 65);
  await volume('music', 20);
  await page.reload();
  await page.waitForSelector('#open-button');
  await page.click('[data-panel="settings"]');
  assert.equal(await page.inputValue('#audio-effects'), '65');
  assert.equal(await page.inputValue('#audio-music'), '20');
  assert.equal(await page.inputValue('#audio-master'), '80');
  await page.click('[data-action="sound-test"]');
  await page.waitForFunction(() => document.querySelector('#audio-meter').value > 0.005);
  fs.mkdirSync('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/21-audio-settings.png' });
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    'artifacts/audio-verification.json',
    JSON.stringify(
      {
        browser: 'Microsoft Edge',
        testSignalRMS: audible,
        musicSignal: true,
        masterZeroSilent: true,
        muteSilent: true,
        settingsRestored: true,
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    'Audio UI passed: audible PCM signal, background, master zero, mute/unmute, settings restored.',
    { testSignalRMS: audible },
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
