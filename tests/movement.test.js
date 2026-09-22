import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, blocked } from '../src/navigation.js';
import { moveCrowd } from '../src/movement.js';
import { Simulation } from '../src/simulation.js';

test('invalid saved movement destination and parking flag reject atomically', () => {
  const g = new Simulation();
  g.open();
  g.spawnCustomer('prescription', 'mask');
  for (let i = 0; i < 150; i++) g.update(0.1);
  const before = g.serialize(),
    bad = JSON.parse(before);
  bad.state.staff[0].destination = { x: 'bad', z: 0 };
  bad.state.staff[0].path = [];
  assert.throws(() => g.restore(JSON.stringify(bad)));
  assert.equal(g.serialize(), before);
  const badFlag = JSON.parse(before);
  badFlag.state.staff[0].parking = 'yes';
  assert.throws(() => g.restore(JSON.stringify(badFlag)));
  assert.equal(g.serialize(), before);
});

test('fifty-person live crowd keeps body clearance including arrivals and staff', () => {
  const g = new Simulation();
  g.expand();
  g.expand();
  g.hire('pharmacist');
  g.hire('cashier');
  g.open();
  g.s.spawnIn = 9999;
  for (let i = 0; i < 50; i++) g.spawnCustomer(i % 3 ? 'shop' : 'prescription', 'mask');
  for (let t = 0; t < 1200; t++) {
    const people = [...g.s.staff, ...g.s.customers];
    for (let i = 0; i < people.length; i++)
      for (let j = i + 1; j < people.length; j++)
        assert.ok(
          Math.hypot(people[i].x - people[j].x, people[i].z - people[j].z) >= 0.419,
          `${people[i].id}/${people[j].id} overlap at ${t}`,
        );
    g.update(0.05);
  }
  assert.ok(g.s.stats.served > 0);
});
test('overlapping old positions can separate and paused movement is unchanged', () => {
  const a = actor('a', 0, 0, 2, 0),
    b = actor('b', 0, 0, -2, 0),
    context = { people: [a, b], obstacles: [], bounds };
  const before = JSON.stringify(a);
  moveCrowd(a, 0, 1.5, context);
  assert.equal(JSON.stringify(a), before);
  for (let i = 0; i < 200; i++) {
    moveCrowd(a, 0.05, 1.5, context);
    moveCrowd(b, 0.05, 1.5, context);
  }
  assert.ok(a.x > 1.6 && b.x < -1.6);
});
const bounds = { minX: -4, maxX: 4, minZ: -3, maxZ: 3 };
const actor = (id, x, z, tx, tz) => ({
  id,
  x,
  z,
  destination: { x: tx, z: tz },
  path: findPath({ x, z }, { x: tx, z: tz }, [], bounds),
});
test('opposing pedestrians pass without overlapping and both arrive', () => {
  const a = actor('a', -2, 0, 2, 0),
    b = actor('b', 2, 0, -2, 0),
    context = { people: [a, b], obstacles: [], bounds };
  let arrivedA = false,
    arrivedB = false;
  for (let i = 0; i < 400; i++) {
    arrivedA = moveCrowd(a, 0.05, 1.5, context);
    arrivedB = moveCrowd(b, 0.05, 1.5, context);
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 0.419);
  }
  assert.ok(arrivedA);
  assert.ok(arrivedB);
});
test('stationary person is bypassed while static furniture stays impassable', () => {
  const a = actor('a', -2, 0, 2, 0),
    b = actor('b', 0, 0, 0, 0),
    obstacles = [{ x: 0, z: -1.5, w: 3, d: 1 }],
    context = { people: [a, b], obstacles, bounds };
  let arrived = false;
  for (let i = 0; i < 400; i++) {
    arrived = moveCrowd(a, 0.05, 1.5, context);
    assert.ok(!blocked(a.x, a.z, obstacles));
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= 0.419);
  }
  assert.ok(arrived);
  assert.equal(b.x, 0);
  assert.equal(b.z, 0);
});
test('occupied destination waits then resumes when occupant leaves', () => {
  const a = actor('a', -2, 0, 0, 0),
    b = actor('b', 0, 0, 0, 0),
    context = { people: [a, b], obstacles: [], bounds };
  for (let i = 0; i < 80; i++) assert.equal(moveCrowd(a, 0.05, 1.5, context), false);
  context.people = [a];
  let arrived = false;
  for (let i = 0; i < 100; i++) arrived = moveCrowd(a, 0.05, 1.5, context);
  assert.ok(arrived);
});
