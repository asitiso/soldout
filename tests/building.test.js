import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.js';
import { PRODUCTS } from '../src/content.js';

test('expansion preserves stock and tasks while opening new buildable space', () => {
  const g = new Simulation(),
    stock = structuredClone(g.s.inventory);
  g.restock('mask');
  const tasks = structuredClone(g.s.tasks);
  const result = g.expand();
  assert.equal(result.ok, true);
  assert.equal(g.s.level, 2);
  assert.equal(g.s.cash, 4050000);
  assert.deepEqual(g.s.inventory, stock);
  assert.deepEqual(g.s.tasks, tasks);
  assert.equal(g.bounds.maxX, 11.8);
  assert.equal(g.place(9, 1, 'bench').ok, true);
});
test('expansion refuses missing funds and the final stage without charging', () => {
  const g = new Simulation();
  g.s.cash = 10;
  const before = g.serialize();
  assert.equal(g.expand().ok, false);
  assert.equal(g.serialize(), before);
  g.s.cash = 5000000;
  g.expand();
  g.expand();
  const final = g.serialize();
  assert.equal(g.expand().ok, false);
  assert.equal(g.serialize(), final);
});
test('moving and rotating a shelf preserves every unit and updates the customer destination', () => {
  const g = new Simulation();
  g.expand();
  const before = structuredClone(g.s.inventory);
  assert.equal(g.editShelf(1, { x: 9, z: 0, rotation: 1 }).ok, true);
  assert.deepEqual(g.s.inventory, before);
  const p = g.zoneSpot('mask');
  assert.equal(p.x, 9.8);
  assert.equal(p.z, 0);
  assert.equal(
    g.obstacles.some((b) => b.x === 9 && b.z === 0 && b.w === 0.8),
    true,
  );
});
test('placement previews and rejected edits never mutate state', () => {
  const g = new Simulation(),
    before = g.serialize();
  assert.equal(g.previewPlacement({ kind: 'plant', x: 1.5, z: 3.5, rotation: 0 }).ok, false);
  assert.equal(g.previewPlacement({ kind: 'bench', x: NaN, z: 1, rotation: 0 }).ok, false);
  assert.equal(g.editShelf(1, { x: -2.5, z: -1, rotation: 0 }).ok, false);
  assert.equal(g.serialize(), before);
});
test('storage furniture increases order capacity and cannot be sold while committed stock needs it', () => {
  const g = new Simulation();
  g.expand();
  assert.equal(g.place(9, -2, 'storage').ok, true);
  const f = g.s.placements.at(-1);
  assert.equal(g.storageCapacity, 720);
  g.s.inventory.mask.warehouse = 620;
  assert.equal(g.sellFurniture(f.id).ok, false);
  g.s.inventory.mask.warehouse = 12;
  assert.equal(g.sellFurniture(f.id).ok, true);
  assert.equal(g.storageCapacity, 600);
});
test('orders over committed storage capacity are rejected before spending', () => {
  const g = new Simulation();
  assert.equal(g.order('mask', 100, 'standard').ok, true);
  const cash = g.s.cash;
  assert.equal(g.order('cold', 30, 'standard').ok, false);
  assert.equal(g.s.cash, cash);
});
test('layout v2 and original v1 saves both restore without losing inventory', () => {
  const g = new Simulation();
  g.expand();
  g.editShelf(2, { x: 9, z: 2, rotation: 3 });
  g.place(8, -2, 'storage');
  const restored = new Simulation();
  restored.restore(g.serialize());
  assert.deepEqual(restored.s, g.s);
  const legacy = new Simulation();
  const raw = JSON.parse(legacy.serialize());
  raw.version = 1;
  raw.state.version = 1;
  delete raw.state.layout;
  raw.state.placements = [{ id: 'f99', kind: 'plant', x: 5, z: 0 }];
  raw.state.nextId = 100;
  restored.restore(JSON.stringify(raw));
  assert.equal(restored.s.version, 2);
  assert.equal(restored.s.layout.shelves.length, 3);
  assert.equal(restored.s.placements[0].rotation, 0);
  assert.deepEqual(restored.s.inventory, legacy.s.inventory);
});
test('customers and restocking still complete after relocating an occupied shelf', () => {
  const g = new Simulation();
  g.expand();
  g.open();
  g.s.spawnIn = 9999;
  g.spawnCustomer('shop', 'mask');
  for (let i = 0; i < 60; i++) g.update(0.1);
  assert.equal(g.editShelf(1, { x: 9, z: 0, rotation: 1 }).ok, true);
  g.restock('mask');
  for (let i = 0; i < 1600; i++) g.update(0.1);
  assert.equal(g.s.stats.served, 1);
  assert.equal(g.s.inventory.mask.held, 0);
  for (const p of PRODUCTS) assert.ok(g.s.inventory[p.id].shelf >= 0);
  assert.ok(!g.s.tasks.some((t) => t.type === 'restock'));
});
test('furniture cannot isolate a person even when every service point remains accessible', () => {
  const g = new Simulation();
  g.expand();
  g.s.staff[0].x = 9;
  g.s.staff[0].z = 0;
  assert.equal(g.place(9, 1.5, 'bench', 0).ok, true);
  assert.equal(g.place(9, -1.5, 'bench', 0).ok, true);
  assert.equal(g.place(7.5, 0, 'bench', 1).ok, true);
  const before = g.serialize();
  assert.equal(g.place(10.5, 0, 'bench', 1).ok, false);
  assert.equal(g.serialize(), before);
});
test('legacy plants that conflict with new queue reservations are relocated without losing the save', () => {
  const original = new Simulation(),
    raw = JSON.parse(original.serialize());
  raw.version = raw.state.version = 1;
  delete raw.state.layout;
  raw.state.placements = [{ id: 'f99', kind: 'plant', x: -2, z: 1.5 }];
  raw.state.nextId = 100;
  raw.state.cash = 4321000;
  const g = new Simulation();
  g.restore(JSON.stringify(raw));
  assert.equal(g.s.cash, 4321000);
  assert.deepEqual(g.s.inventory, original.s.inventory);
  assert.equal(g.s.placements.length, 1);
  assert.notDeepEqual({ x: g.s.placements[0].x, z: g.s.placements[0].z }, { x: -2, z: 1.5 });
  assert.ok(g.events.some((e) => e.type === 'info'));
  const restored = new Simulation();
  restored.restore(g.serialize());
  assert.deepEqual(restored.s, g.s);
});
