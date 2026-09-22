import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';

test('a new arrival reuses a vacated exterior slot without duplicating another', () => {
  const g = new Simulation();
  for (let i = 0; i < 12; i++) g.spawnCustomer('shop', 'mask');
  g.abandon(g.s.customers[8]);
  g.spawnCustomer('shop', 'mask');
  const waiting = g.s.customers.filter((c) => c.state === 'outside');
  assert.equal(new Set(waiting.map((c) => c.outsideSlot)).size, waiting.length);
  const copy = new Simulation();
  copy.restore(g.serialize());
  assert.deepEqual(copy.s, g.s);
});

test('invalid exterior slots and held goods reject without replacing the game', () => {
  const g = new Simulation();
  for (let i = 0; i < 10; i++) g.spawnCustomer('shop', 'mask');
  const before = g.serialize(),
    raw = JSON.parse(before),
    outside = raw.state.customers.filter((c) => c.state === 'outside');
  outside[1].outsideSlot = outside[0].outsideSlot;
  assert.throws(() => g.restore(JSON.stringify(raw)));
  assert.equal(g.serialize(), before);
  outside[1].outsideSlot = 1;
  outside[0].held = true;
  raw.state.inventory.mask.held = 1;
  assert.throws(() => g.restore(JSON.stringify(raw)));
  assert.equal(g.serialize(), before);
});

test('small pharmacy reserves only eight indoor places and preserves FIFO admission', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  const cs = Array.from({ length: 12 }, () => g.spawnCustomer('prescription', 'mask'));
  assert.equal(cs.filter((c) => c.state === 'enter').length, 8);
  assert.equal(cs.filter((c) => c.state === 'outside').length, 4);
  g.abandon(cs[0]);
  g.update(0.1);
  assert.equal(cs[8].state, 'enter');
  assert.equal(cs[9].state, 'outside');
});
test('expanded pharmacy supports fifty people with unique exterior slots and a hard cap', () => {
  const g = new Simulation();
  g.expand();
  g.expand();
  const cs = Array.from({ length: 50 }, () => g.spawnCustomer('shop', 'mask'));
  assert.equal(cs.filter((c) => c.state === 'enter').length, 18);
  const outside = cs.filter((c) => c.state === 'outside');
  assert.equal(outside.length, 32);
  assert.equal(new Set(outside.map((c) => `${c.x},${c.z}`)).size, 32);
  const before = g.serialize();
  assert.equal(g.spawnCustomer(), null);
  assert.equal(g.serialize(), before);
  const copy = new Simulation();
  copy.restore(g.serialize());
  assert.deepEqual(copy.s, g.s);
});
test('outside patience and closing drain all fifty customers without orphaned jobs', () => {
  const g = new Simulation();
  g.expand();
  g.expand();
  g.hire('pharmacist');
  g.hire('cashier');
  g.open();
  g.s.spawnIn = 9999;
  for (let i = 0; i < 50; i++) g.spawnCustomer('prescription', 'mask');
  const outside = g.s.customers.find((c) => c.state === 'outside');
  outside.patience = 0.01;
  g.update(0.1);
  assert.equal(outside.state, 'exit');
  assert.equal(outside.held, false);
  g.close();
  for (let i = 0; i < 10000 && g.s.phase !== 'summary'; i++) g.update(0.1);
  assert.equal(g.s.phase, 'summary');
  assert.equal(g.s.stats.served + g.s.stats.lost, 50);
  assert.equal(g.s.customers.length, 0);
  assert.ok(!g.s.tasks.some((t) => t.customer));
});
test('older over-capacity indoor saves remain valid but block further admission', () => {
  const g = new Simulation();
  for (let i = 0; i < 12; i++) {
    const c = g.spawnCustomer('prescription', 'mask');
    c.state = 'enter';
  }
  const copy = new Simulation();
  copy.restore(g.serialize());
  assert.equal(copy.spawnCustomer('shop', 'mask').state, 'outside');
});
