import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioSystem } from '../src/audio.js';

test('a fresh gesture retries when the previous resume promise never settles', async () => {
  const ctx = context();
  let calls = 0;
  ctx.resume = () => {
    if (++calls === 1) return new Promise(() => {});
    ctx.state = 'running';
    return Promise.resolve();
  };
  const a = new AudioSystem({ contextFactory: () => ctx, storage: null });
  a.unlock();
  const result = await Promise.race([
    a.unlock(),
    new Promise((resolve) => setTimeout(() => resolve('stuck'), 30)),
  ]);
  assert.equal(result, true);
  assert.equal(calls, 2);
  assert.equal(a.play('test'), true);
});
const param = () => ({
  value: 0,
  setValueAtTime(v) {
    this.value = v;
  },
  linearRampToValueAtTime(v) {
    this.value = v;
  },
  exponentialRampToValueAtTime(v) {
    this.value = v;
  },
  setTargetAtTime(v) {
    this.value = v;
  },
  cancelScheduledValues() {},
});
function context() {
  return {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    nodes: [],
    async resume() {
      this.state = 'running';
    },
    createGain() {
      return { gain: param(), connect() {}, disconnect() {} };
    },
    createAnalyser() {
      return {
        fftSize: 256,
        connect() {},
        getFloatTimeDomainData(a) {
          a.fill(0);
        },
      };
    },
    createOscillator() {
      const n = {
        frequency: param(),
        connect() {},
        disconnect() {},
        start() {},
        stop() {
          this.onended?.();
        },
      };
      this.nodes.push(n);
      return n;
    },
  };
}
test('failed activation can retry and audible effect waits for running audio', async () => {
  const ctx = context();
  let fail = true;
  ctx.resume = async () => {
    if (fail) throw Error('blocked');
    ctx.state = 'running';
  };
  const a = new AudioSystem({ contextFactory: () => ctx, storage: null });
  assert.equal(await a.unlock(), false);
  assert.equal(a.play('sale'), false);
  fail = false;
  assert.equal(await a.unlock(), true);
  assert.equal(a.play('test'), true);
  assert.ok(ctx.nodes.length >= 4);
});
test('volumes and mute persist, clamp, and silence the master bus', async () => {
  const values = new Map(),
    storage = { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) },
    ctx = context();
  const a = new AudioSystem({ contextFactory: () => ctx, storage });
  await a.unlock();
  a.setVolume('master', 0);
  assert.equal(a.master.gain.value, 0);
  a.setVolume('effects', 2);
  assert.equal(a.volumes.effects, 1);
  a.setVolume('music', -0.2);
  assert.equal(a.volumes.music, 0);
  a.enabled = false;
  const copy = new AudioSystem({ contextFactory: context, storage });
  assert.equal(copy.enabled, false);
  assert.deepEqual(copy.volumes, a.volumes);
  assert.equal(a.play('sale'), false);
});
test('music schedules after activation and hidden tabs stop all pending voices', async () => {
  const ctx = context(),
    a = new AudioSystem({ contextFactory: () => ctx, storage: null });
  await a.unlock();
  a.update();
  assert.ok(ctx.nodes.length > 0);
  a.setHidden(true);
  assert.equal(a.voices.size, 0);
  const n = ctx.nodes.length;
  a.update();
  a.play('phone');
  assert.equal(ctx.nodes.length, n);
  a.setHidden(false);
  a.update();
  assert.ok(ctx.nodes.length > n);
});
