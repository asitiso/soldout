import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { findPath } from '../src/navigation.js';
const run = (g, seconds) => {
  for (let t = 0; t < seconds; t += 0.1) g.update(0.1);
};

test('invalid and unaffordable orders never mutate cash or inventory', () => {
  const g = new Simulation();
  const cash = g.s.cash;
  for (const n of [-1, 0, 1.5, Infinity, NaN, 100000])
    assert.equal(g.order('mask', n, 'standard').ok, false);
  assert.equal(g.s.cash, cash);
  assert.equal(g.s.orders.length, 0);
});
test('delivery must be physically processed before warehouse stock increases', () => {
  const g = new Simulation();
  const initial = g.s.inventory.mask.warehouse;
  assert.equal(g.order('mask', 12, 'express').ok, true);
  assert.equal(g.s.inventory.mask.warehouse, initial);
  g.open();
  run(g, 160);
  assert.equal(g.s.orders[0].status, 'stored');
  assert.ok(g.s.inventory.mask.warehouse >= initial + 12);
});
test('a customer picks, waits, pays, and leaves without creating stock', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  const before = g.s.inventory.cold.shelf;
  g.spawnCustomer('shop', 'cold');
  run(g, 120);
  assert.equal(g.s.stats.served, 1);
  assert.equal(g.s.inventory.cold.sold, 1);
  assert.equal(g.s.inventory.cold.shelf, before - 1);
  assert.equal(g.s.inventory.cold.held, 0);
  assert.ok(g.s.stats.revenue > 0);
  assert.equal(g.s.customers.length, 0);
});
test('prescription work visits the medicine cabinet and compounding station', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  g.spawnCustomer('prescription');
  const actions = new Set();
  for (let i = 0; i < 1600; i++) {
    g.update(0.1);
    actions.add(g.s.staff[0].action);
  }
  assert.ok(actions.has('약 찾기'));
  assert.ok(actions.has('조제'));
  assert.ok(actions.has('포장'));
  assert.equal(g.s.stats.prescriptions, 1);
});
test('duplicate restock requests cannot duplicate inventory', () => {
  const g = new Simulation();
  g.s.inventory.mask.shelf = 0;
  const total = g.s.inventory.mask.warehouse;
  assert.equal(g.restock('mask').ok, true);
  assert.equal(g.restock('mask').ok, false);
  g.open();
  g.s.spawnIn = 9999;
  run(g, 100);
  assert.equal(g.s.inventory.mask.shelf + g.s.inventory.mask.warehouse, total);
  assert.ok(g.s.inventory.mask.shelf > 0);
});
test('abandoning customers return held merchandise', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  g.s.auto = false;
  const n = g.s.inventory.cold.shelf;
  const c = g.spawnCustomer('shop', 'cold');
  c.patience = 18;
  run(g, 90);
  assert.equal(g.s.inventory.cold.shelf, n);
  assert.equal(g.s.inventory.cold.held, 0);
  assert.equal(g.s.stats.lost, 1);
});
test('pause freezes time and customer movement', () => {
  const g = new Simulation();
  g.open();
  g.s.speed = 0;
  const before = JSON.stringify(g.s);
  run(g, 20);
  assert.equal(JSON.stringify(g.s), before);
});
test('save restore preserves active jobs and rejects damaged saves atomically', () => {
  const g = new Simulation();
  g.open();
  run(g, 25);
  const restored = new Simulation();
  restored.restore(g.serialize());
  assert.deepEqual(restored.s, g.s);
  const before = restored.serialize();
  assert.throws(() => restored.restore('{"version":999}'));
  assert.equal(restored.serialize(), before);
  assert.throws(() => restored.restore('{"version":1,"state":{"cash":-2}}'));
  assert.equal(restored.serialize(), before);
  run(restored, 100);
  assert.ok(restored.s.stats.served > 0);
});
test('closing drains customers and settles fixed expenses only once', () => {
  const g = new Simulation();
  g.open();
  run(g, 25);
  g.close();
  run(g, 200);
  assert.equal(g.s.phase, 'summary');
  const cash = g.s.cash;
  run(g, 20);
  assert.equal(g.s.cash, cash);
  assert.equal(g.s.history.length, 1);
  g.nextDay();
  assert.equal(g.s.day, 2);
  assert.equal(g.s.phase, 'ready');
});
test('navigation routes around blocked furniture and rejects sealed destinations', () => {
  const blocks = [{ x: 0, z: 0, w: 2, d: 2 }];
  const path = findPath({ x: -2, z: 0 }, { x: 2, z: 0 }, blocks);
  assert.ok(path.length > 0);
  assert.ok(path.every((p) => !(Math.abs(p.x) < 1 && Math.abs(p.z) < 1)));
  assert.equal(findPath({ x: -2, z: 0 }, { x: 0, z: 0 }, blocks).length, 0);
});
test('closing during a telephone job cannot strand a worker on the next day', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  g.task('phone');
  g.close();
  g.update(0.05);
  g.nextDay();
  g.open();
  g.s.spawnIn = 9999;
  g.spawnCustomer('shop', 'cold');
  run(g, 120);
  assert.equal(g.s.stats.served, 1);
});
test('invalid saved staff role is rejected before changing the running game', () => {
  const g = new Simulation(),
    before = g.serialize(),
    bad = JSON.parse(before);
  delete bad.state.staff[0].role;
  assert.throws(() => g.restore(JSON.stringify(bad)));
  assert.equal(g.serialize(), before);
});
test('prescription materials are paid even without merchandise stock', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  const cash = g.s.cash;
  g.spawnCustomer('prescription');
  run(g, 140);
  assert.equal(g.s.cash - cash, g.s.stats.revenue - g.s.stats.cogs);
});
test('waiting lines do not place customers inside furniture or use identical slots', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  g.s.auto = false;
  for (let i = 0; i < 6; i++) g.spawnCustomer('prescription');
  run(g, 50);
  const positions = g.s.customers.map((c) => `${c.x.toFixed(2)},${c.z.toFixed(2)}`);
  assert.equal(new Set(positions).size, 6);
  for (const c of g.s.customers) assert.ok(!(c.x > -5.4 && c.x < -2.9 && c.z > 0.7 && c.z < 2.1));
});
test('customers reach the service queue before checkout starts', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  g.spawnCustomer('shop', 'sanitizer');
  for (let i = 0; i < 400; i++) {
    g.update(0.05);
    const c = g.s.customers[0];
    if (c?.state === 'service') assert.equal(c.path.length, 0);
  }
});
test('simultaneous arrivals never receive service outside the counter', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  for (let i = 0; i < 12; i++) g.spawnCustomer('prescription');
  for (let i = 0; i < 3600; i++) {
    g.update(0.05);
    for (const c of g.s.customers.filter((c) => c.state === 'service'))
      assert.ok(c.z < 0.4 && c.x < 0);
  }
});
test('price increases reduce product demand and POP limit reduces crisis pressure', () => {
  const g = new Simulation(),
    p = { id: 'mask', price: 1500, tags: ['crisis'] };
  const normal = g.demand(p);
  g.setPrice('mask', 4500);
  assert.ok(g.demand(p) < normal);
  g.s.crisis = 4;
  const crisis = g.demand(p);
  g.installPOP('limit');
  assert.ok(g.demand(p) < crisis);
});
