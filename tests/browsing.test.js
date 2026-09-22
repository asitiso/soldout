import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { PRODUCT } from '../src/content.js';

test('older simultaneous browsing saves keep one owner and move others to waiting', () => {
  const g = new Simulation();
  for (let i = 0; i < 3; i++) {
    const c = g.spawnCustomer('shop', 'mask');
    c.state = 'browse';
    g.path(c, g.zoneSpot('mask'));
  }
  const inventory = structuredClone(g.s.inventory),
    copy = new Simulation();
  copy.restore(g.serialize());
  assert.equal(copy.s.customers.filter((c) => c.state === 'browse').length, 1);
  assert.equal(copy.s.customers.filter((c) => c.state === 'shelfwait').length, 2);
  assert.deepEqual(copy.s.inventory, inventory);
  const again = new Simulation();
  again.restore(copy.serialize());
  assert.deepEqual(again.s, copy.s);
});

test('one customer uses each shelf while other shelves continue independently', () => {
  const g = new Simulation();
  g.open();
  g.s.spawnIn = 9999;
  g.hire('cashier');
  for (let i = 0; i < 6; i++) g.spawnCustomer('shop', 'mask');
  g.spawnCustomer('shop', 'cold');
  let sawWait = false,
    sawOther = false;
  for (let i = 0; i < 2500; i++) {
    g.update(0.1);
    const browsing = g.s.customers.filter((c) => ['browse', 'pick'].includes(c.state));
    for (let zone = 0; zone < 3; zone++)
      assert.ok(browsing.filter((c) => PRODUCT[c.product].zone === zone).length <= 1);
    sawWait ||= g.s.customers.some((c) => c.state === 'shelfwait');
    sawOther ||= browsing.some((c) => c.product === 'cold');
  }
  assert.ok(sawWait);
  assert.ok(sawOther);
  assert.equal(g.s.stats.served, 7);
  assert.equal(g.s.inventory.mask.held, 0);
});
test('shelf waiting survives save, relocation, patience expiry and closing', () => {
  const g = new Simulation();
  g.expand();
  g.open();
  g.s.spawnIn = 9999;
  for (let i = 0; i < 10; i++) g.spawnCustomer('shop', 'mask');
  for (let i = 0; i < 110; i++) g.update(0.1);
  const waiting = g.s.customers.filter((c) => c.state === 'shelfwait');
  assert.ok(waiting.length);
  assert.equal(
    new Set(waiting.map((c) => `${c.destination.x},${c.destination.z}`)).size,
    waiting.length,
  );
  const restored = new Simulation();
  restored.restore(g.serialize());
  assert.deepEqual(restored.s, g.s);
  assert.equal(g.editShelf(1, { x: 9, z: 0, rotation: 1 }).ok, true);
  waiting[0].patience = 0.01;
  g.update(0.1);
  assert.equal(waiting[0].state, 'exit');
  g.close();
  for (let i = 0; i < 10000 && g.s.phase !== 'summary'; i++) g.update(0.1);
  assert.equal(g.s.phase, 'summary');
  assert.equal(g.s.stats.served + g.s.stats.lost, 10);
  assert.equal(g.s.inventory.mask.held, 0);
});
