import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { PRODUCT } from '../src/content.js';
import { stageForDay } from '../src/crisis.js';

test('purchase-limit POP stops suppressing demand after the active crisis', () => {
  const g = new Simulation();
  g.installPOP('limit');
  g.s.crisis = 5;
  assert.equal(g.demand(PRODUCT.mask), 3.2);
  g.s.crisis = 8;
  assert.equal(g.demand(PRODUCT.mask), 0.7);
  g.s.crisis = 9;
  assert.equal(g.demand(PRODUCT.mask), 1);
});

test('twelve-day campaign progresses through recovery and restores every daily save', () => {
  const g = new Simulation();
  g.hire('pharmacist');
  g.hire('cashier');
  for (let day = 1; day <= 12; day++) {
    assert.equal(g.s.crisis, stageForDay(day));
    g.open();
    let ticks = 0;
    while (g.s.phase !== 'summary' && ticks++ < 10000) {
      g.update(0.1);
      if (ticks % 100 === 0)
        for (const [id, inv] of Object.entries(g.s.inventory)) {
          if (inv.shelf < 6 && inv.warehouse) g.restock(id);
          if (inv.warehouse < 6) g.order(id, 12, 'standard');
        }
    }
    assert.equal(g.s.phase, 'summary', `day ${day} must close`);
    const restored = new Simulation();
    restored.restore(g.serialize());
    assert.deepEqual(restored.s, g.s);
    if (day < 12) g.nextDay();
  }
  assert.equal(g.s.crisis, 9);
  assert.equal(g.s.history.length, 12);
});

test('recovery restores supplier prices, delivery speed and supply', () => {
  const g = new Simulation(),
    normal = g.quote('mask', 1, 'standard');
  g.s.crisis = 5;
  const peak = g.quote('mask', 1, 'standard');
  assert.ok(peak.cost > normal.cost);
  assert.ok(peak.eta > normal.eta);
  assert.ok(peak.limit < normal.limit);
  g.s.crisis = 9;
  assert.deepEqual(g.quote('mask', 1, 'standard'), normal);
  assert.equal(g.demand(PRODUCT.mask), 1);
});
test('daily supplier allowance cannot be bypassed with split orders or reload', () => {
  const g = new Simulation();
  g.s.crisis = 5;
  const limit = g.quote('mask', 1, 'standard').limit;
  assert.equal(g.order('mask', limit, 'standard').ok, true);
  const cash = g.s.cash;
  assert.equal(g.order('mask', 1, 'standard').ok, false);
  assert.equal(g.s.cash, cash);
  const restored = new Simulation();
  restored.restore(g.serialize());
  assert.equal(restored.quote('mask', 1, 'standard').limit, 0);
  assert.ok(restored.quote('mask', 1, 'express').limit > 0);
});
test('a new day resets allowance without repricing deliveries', () => {
  const g = new Simulation();
  g.s.day = 8;
  g.s.crisis = 5;
  g.order('mask', 5, 'standard');
  const order = structuredClone(g.s.orders[0]);
  g.s.phase = 'summary';
  g.nextDay();
  assert.equal(g.quote('mask', 1, 'standard').limit, g.quote('mask', 1, 'standard').dailyLimit);
  assert.deepEqual(g.s.orders[0], order);
});
test('old orders inherit today once and invalid order dates reject atomically', () => {
  const g = new Simulation();
  g.order('mask', 5, 'standard');
  const data = JSON.parse(g.serialize());
  delete data.state.orders[0].orderedDay;
  const restored = new Simulation();
  restored.restore(JSON.stringify(data));
  assert.equal(restored.s.orders[0].orderedDay, 1);
  const before = restored.serialize();
  data.state.orders[0].orderedDay = 2;
  assert.throws(() => restored.restore(JSON.stringify(data)));
  assert.equal(restored.serialize(), before);
});
test('peak crowd drains at closing without losing held inventory', () => {
  const g = new Simulation();
  g.hire('pharmacist');
  g.hire('cashier');
  g.open();
  g.s.crisis = 5;
  g.s.spawnIn = 9999;
  for (let i = 0; i < 18; i++) g.spawnCustomer(i % 3 === 0 ? 'prescription' : 'shop', 'mask');
  g.close();
  for (let i = 0; i < 10000 && g.s.phase !== 'summary'; i++) g.update(0.1);
  assert.equal(g.s.phase, 'summary');
  assert.equal(g.s.inventory.mask.held, 0);
  assert.equal(g.s.stats.served + g.s.stats.lost, 18);
  assert.equal(
    g.s.inventory.mask.shelf + g.s.inventory.mask.warehouse + g.s.inventory.mask.sold,
    18,
  );
});
