import './style.css';
import './building.css';
import './crisis.css';
import './audio.css';
import { Simulation } from './simulation.js';
import { World } from './world.js';
import { UI } from './ui.js';
import { AudioSystem } from './audio.js';
const SAVE_KEY = 'sold-out-save-v1';
const game = new Simulation(),
  audio = new AudioSystem();
let ui, world;
let loadError = '';
let automaticSaveBlocked = false;
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) game.restore(raw);
} catch (error) {
  automaticSaveBlocked = true;
  loadError =
    '저장을 읽지 못했어요. 원본을 보존하고 자동 저장을 멈췄습니다. 수동 저장하면 원본을 별도로 보관합니다.';
}
const save = (quiet = false) => {
  try {
    if (automaticSaveBlocked && quiet) return;
    if (automaticSaveBlocked) {
      const original = localStorage.getItem(SAVE_KEY);
      if (original) localStorage.setItem(`${SAVE_KEY}-recovery`, original);
    }
    const snapshot = JSON.parse(game.serialize());
    if (world?.editing) snapshot.state.speed = ui.editor.previousSpeed;
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    automaticSaveBlocked = false;
    if (!quiet) ui?.toast('현재 약국을 저장했어요.');
    const e = document.querySelector('#save-hint');
    if (e)
      e.textContent =
        '저장됨 · ' +
        new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    ui?.toast('저장 공간을 사용할 수 없어요. 브라우저 설정을 확인해주세요.', 'warning');
  }
};
const load = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      ui.toast('아직 저장한 게임이 없어요.', 'warning');
      return;
    }
    game.restore(raw);
    automaticSaveBlocked = false;
    ui.selected = null;
    ui.summaryShown = 0;
    ui.toast('저장한 약국을 불러왔어요.');
  } catch (error) {
    ui.toast(error.message, 'warning');
  }
};
try {
  world = new World(document.querySelector('#world'), game, (s) => ui?.select(s));
  ui = new UI(game, world, audio, save, load);
} catch (error) {
  document.querySelector('#ui').innerHTML =
    '<div style="pointer-events:auto;margin:15vh auto;padding:35px;background:#fafaf0;max-width:550px;border-radius:18px"><h1>3D 화면을 시작할 수 없어요.</h1><p>WebGL을 지원하는 Chrome 또는 Edge에서 하드웨어 가속을 켜고 다시 실행해주세요.</p><p id="render-error"></p></div>';
  document.querySelector('#render-error').textContent = error.message;
  throw error;
}
if (loadError) ui.toast(loadError, 'warning');
document.addEventListener('pointerdown', () => audio.unlock());
document.addEventListener('keydown', () => audio.unlock());
document.addEventListener('click', (e) => {
  if (
    e.target.closest('button') &&
    !e.target.closest('[data-action="sound-test"],[data-action="sound"]')
  )
    audio.play('click');
});
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (!world.editing) game.s.speed = game.s.speed ? 0 : 1;
  }
  if (e.code === 'KeyQ') world.rotate(-1);
  if (e.code === 'KeyR' && world.placing) {
    e.preventDefault();
    world.rotatePlacement();
  }
  if (e.code === 'KeyE') world.rotate(1);
  if (e.key === 'Escape') {
    if (ui.panel) {
      ui.closePanel();
      return;
    }
    if (world.placing) {
      ui.editor.cancel();
      return;
    }
    if (world.editing) {
      ui.editor.finish();
      return;
    }
    ui.selected = null;
    world.selected = null;
  }
  if (e.key === 'Tab' && ui.panel) {
    const focusable = [...ui.modal.querySelectorAll('button:not(:disabled),input,select')],
      first = focusable[0],
      last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
let previous = performance.now(),
  accumulator = 0,
  uiClock = 0,
  labelClock = 0,
  saveClock = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  accumulator += delta;
  while (accumulator >= 0.05) {
    game.update(0.05);
    accumulator -= 0.05;
  }
  world.update(now / 1000);
  audio.update();
  uiClock += delta;
  labelClock += delta;
  saveClock += delta;
  if (uiClock > 0.25) {
    ui.update();
    uiClock = 0;
  }
  if (labelClock > 0.08) {
    ui.worldLabels();
    labelClock = 0;
  }
  if (saveClock > 30) {
    save(true);
    saveClock = 0;
  }
  for (const event of game.events.splice(0)) {
    audio.play(event.type);
    if (event.type === 'sale') ui.saleEffect(event.revenue);
    if (event.type === 'soldout') {
      const el = document.querySelector('#soldout-flash');
      el.textContent = 'SOLD OUT';
      setTimeout(() => (el.textContent = ''), 2000);
    }
    if (!['sale', 'summary'].includes(event.type)) ui.toast(event.text);
  }
}
requestAnimationFrame(frame);
window.addEventListener('beforeunload', () => save(true));
document.addEventListener('visibilitychange', () => {
  audio.setHidden(document.hidden);
  if (document.hidden) save(true);
  previous = performance.now();
});
