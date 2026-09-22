import { blocked, findPath } from './navigation.js';
import { SPOTS } from './content.js';
export const PERSONAL_SPACE = 0.42;
const retries = new WeakMap();
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function arrivalSpot(preferred, people, bounds) {
  const free = (p) => !people.some((other) => distance(p, other) < PERSONAL_SPACE + 0.03);
  if (free(preferred)) return preferred;
  const candidates = [];
  for (let x = -5.5; x < bounds.maxX; x += 0.5)
    for (let z = 4.25; z <= 6.25; z += 0.5) candidates.push({ x, z });
  candidates.sort((a, b) => distance(a, preferred) - distance(b, preferred));
  return candidates.find(free);
}
export function idleSpot(entity, { people, obstacles, bounds }) {
  const reserved = [
    ...Object.values(SPOTS),
    ...people
      .filter((p) => p !== entity)
      .flatMap((p) => (p.destination ? [p, p.destination] : [p])),
  ];
  const candidates = [];
  for (let x = -5.5; x < bounds.maxX; x += 0.5)
    for (let z = -2.5; z <= -1.5; z += 0.5) {
      const p = { x, z };
      if (!blocked(x, z, obstacles) && !reserved.some((r) => distance(r, p) < 0.55))
        candidates.push(p);
    }
  candidates.sort((a, b) => distance(a, entity) - distance(b, entity));
  return candidates.find(
    (p) => findPath(entity, p, obstacles, bounds).length || distance(p, entity) < 0.2,
  );
}
export function moveCrowd(entity, dt, speed, { people, obstacles, bounds }) {
  if (dt <= 0)
    return (
      !entity.path?.length && (!entity.destination || distance(entity, entity.destination) < 0.36)
    );
  retries.set(entity, Math.max(0, (retries.get(entity) || 0) - dt));
  const others = people.filter((p) => p !== entity && p.state !== 'gone');
  const route = () => {
    if (!entity.destination || retries.get(entity) > 0) return false;
    retries.set(entity, 0.35);
    const peopleBlocks = others
      .filter((p) => distance(entity, p) >= PERSONAL_SPACE)
      .map((p) => ({ x: p.x, z: p.z, w: 0.48, d: 0.48 }));
    const barriers = [...obstacles, ...peopleBlocks];
    entity.path = findPath(entity, entity.destination, barriers, bounds);
    if (!entity.path.length) {
      const dx = entity.destination.x - entity.x,
        dz = entity.destination.z - entity.z,
        d = Math.hypot(dx, dz) || 1;
      const turns = [
        [dz / d, -dx / d],
        [-dz / d, dx / d],
        [dx / d, dz / d],
        [-dx / d, -dz / d],
      ];
      for (const [x, z] of turns) {
        const p = {
          x: Math.round((entity.x + x * 0.75) * 4) / 4,
          z: Math.round((entity.z + z * 0.75) * 4) / 4,
        };
        if (p.x < bounds.minX || p.x > bounds.maxX || p.z < bounds.minZ || p.z > bounds.maxZ)
          continue;
        const path = findPath(entity, p, barriers, bounds);
        if (path.length) {
          entity.path = path;
          break;
        }
      }
    }
    return entity.path.length > 0;
  };
  if (!entity.path?.length && entity.destination && distance(entity, entity.destination) >= 0.36)
    route();
  let budget = dt * speed,
    replanned = false;
  while (entity.path?.length && budget > 1e-6) {
    const target = entity.path[0],
      dx = target.x - entity.x,
      dz = target.z - entity.z,
      d = Math.hypot(dx, dz);
    if (d < 1e-6) {
      entity.path.shift();
      continue;
    }
    const step = Math.min(0.08, budget, d),
      next = { x: entity.x + (dx / d) * step, z: entity.z + (dz / d) * step };
    const collision =
      blocked(next.x, next.z, obstacles) ||
      others.some((p) => {
        const before = distance(entity, p),
          after = distance(next, p);
        return before < PERSONAL_SPACE ? after < before + 1e-7 : after < PERSONAL_SPACE;
      });
    if (collision) {
      if (!replanned && route()) {
        replanned = true;
        continue;
      }
      return false;
    }
    entity.angle = Math.atan2(dx, dz);
    entity.x = next.x;
    entity.z = next.z;
    budget -= step;
    if (d <= step + 1e-6) entity.path.shift();
  }
  return (
    !entity.path?.length && (!entity.destination || distance(entity, entity.destination) < 0.36)
  );
}
