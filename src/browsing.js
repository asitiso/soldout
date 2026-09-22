import { SPOTS } from './content.js';
import { reservedQueueSpots, shelfFront } from './building.js';
import { blocked, findPath } from './navigation.js';

export function shelfWaitingSpot(game, customer) {
  const front = game.zoneSpot(customer.product),
    obstacles = game.obstacles,
    bounds = game.bounds;
  const reserved = [
    ...Object.values(SPOTS),
    ...reservedQueueSpots(),
    ...game.s.layout.shelves.map(shelfFront),
    ...game.s.customers
      .filter((c) => c !== customer && c.state === 'shelfwait')
      .map((c) => c.destination || c),
  ];
  const candidates = [];
  for (let x = -5.5; x <= bounds.maxX - 0.3; x += 0.5)
    for (let z = 0; z <= 3; z += 0.5) {
      if (!blocked(x, z, obstacles) && !reserved.some((p) => Math.hypot(p.x - x, p.z - z) < 0.6))
        candidates.push({ x, z });
    }
  candidates.sort(
    (a, b) => Math.hypot(a.x - front.x, a.z - front.z) - Math.hypot(b.x - front.x, b.z - front.z),
  );
  return (
    candidates.find(
      (p) =>
        findPath(customer, p, obstacles, bounds).length > 0 ||
        Math.hypot(customer.x - p.x, customer.z - p.z) < 0.2,
    ) || { x: customer.x, z: customer.z }
  );
}
