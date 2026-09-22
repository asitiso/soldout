export function blocked(x, z, obstacles, margin = 0.19) {
  return obstacles.some(
    (b) => Math.abs(x - b.x) < b.w / 2 + margin && Math.abs(z - b.z) < b.d / 2 + margin,
  );
}
export function findPath(
  from,
  to,
  obstacles = [],
  bounds = { minX: -5.8, maxX: 5.8, minZ: -3, maxZ: 6.5 },
) {
  const step = 0.25,
    snap = (v) => Math.round(v / step),
    key = (x, z) => `${x},${z}`;
  const start = { x: snap(from.x), z: snap(from.z) },
    end = { x: snap(to.x), z: snap(to.z) };
  if (blocked(end.x * step, end.z * step, obstacles)) return [];
  const open = [start],
    parents = new Map(),
    seen = new Set([key(start.x, start.z)]);
  let cursor = 0,
    found = false;
  while (cursor < open.length) {
    const p = open[cursor++];
    if (p.x === end.x && p.z === end.z) {
      found = true;
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: p.x + dx, z: p.z + dz },
        k = key(n.x, n.z),
        x = n.x * step,
        z = n.z * step;
      if (
        seen.has(k) ||
        x < bounds.minX ||
        x > bounds.maxX ||
        z < bounds.minZ ||
        z > bounds.maxZ ||
        blocked(x, z, obstacles)
      )
        continue;
      seen.add(k);
      parents.set(k, p);
      open.push(n);
    }
  }
  if (!found) return [];
  const result = [];
  let p = end;
  while (p.x !== start.x || p.z !== start.z) {
    result.push({ x: p.x * step, z: p.z * step });
    p = parents.get(key(p.x, p.z));
  }
  return result.reverse();
}
export function moveAlong(entity, dt, speed) {
  let budget = dt * speed;
  while (entity.path?.length && budget > 0) {
    const target = entity.path[0],
      dx = target.x - entity.x,
      dz = target.z - entity.z,
      d = Math.hypot(dx, dz);
    entity.angle = Math.atan2(dx, dz);
    if (d <= budget) {
      entity.x = target.x;
      entity.z = target.z;
      entity.path.shift();
      budget -= d;
    } else {
      entity.x += (dx / d) * budget;
      entity.z += (dz / d) * budget;
      budget = 0;
    }
  }
  return (
    !entity.path?.length &&
    (!entity.destination ||
      Math.hypot(entity.x - entity.destination.x, entity.z - entity.destination.z) < 0.36)
  );
}
