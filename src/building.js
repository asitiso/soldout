import { ZONES, BLOCKS, SPOTS, PRODUCTS } from './content.js';
import { blocked } from './navigation.js';

export const EXPANSIONS = [
  {
    level: 1,
    name: '작은 동네약국',
    area: 8,
    right: 6,
    cost: 0,
    storage: 300,
    staff: 4,
    rent: 45000,
  },
  {
    level: 2,
    name: '넉넉한 동네약국',
    area: 12,
    right: 12,
    cost: 950000,
    storage: 600,
    staff: 6,
    rent: 65000,
  },
  {
    level: 3,
    name: '성장하는 생존약국',
    area: 16,
    right: 18,
    cost: 1800000,
    storage: 900,
    staff: 8,
    rent: 85000,
  },
];
export const FURNITURE = {
  plant: {
    id: 'plant',
    name: '초록빛 화분',
    w: 0.8,
    d: 0.8,
    h: 1.1,
    cost: 30000,
    storage: 0,
    description: '편안한 분위기를 만드는 작은 초록',
  },
  bench: {
    id: 'bench',
    name: '대기 벤치',
    w: 1.5,
    d: 0.7,
    h: 1.05,
    cost: 80000,
    storage: 0,
    description: '손님 인내심 +8초 · 최대 3개 효과',
  },
  storage: {
    id: 'storage',
    name: '창고 선반',
    w: 1.8,
    d: 0.7,
    h: 1.85,
    cost: 120000,
    storage: 120,
    description: '실제 보관 한도 +120개',
  },
};
export const defaultLayout = () => ({
  shelves: ZONES.map((z, zone) => ({ zone, x: z.x, z: z.z, rotation: 0 })),
});
export const buildingBounds = (level) => ({
  minX: -5.8,
  maxX: EXPANSIONS[level - 1].right - 0.2,
  minZ: -3,
  maxZ: 6.5,
});
export function dimensions(kind, rotation) {
  const def = kind === 'shelf' ? { w: 2.1, d: 0.8 } : FURNITURE[kind];
  return rotation % 2 ? { w: def.d, d: def.w } : { w: def.w, d: def.d };
}
export function shelfFront(shelf) {
  const [dx, dz] = [
    [0, 0.8],
    [0.8, 0],
    [0, -0.8],
    [-0.8, 0],
  ][shelf.rotation];
  return { x: shelf.x + dx, z: shelf.z + dz };
}
export function layoutObstacles(s) {
  return [
    BLOCKS[0],
    BLOCKS[4],
    BLOCKS[5],
    ...s.layout.shelves.map((p) => ({ ...p, ...dimensions('shelf', p.rotation) })),
    ...s.placements.map((p) => ({ ...p, ...dimensions(p.kind, p.rotation) })),
  ];
}
export function reservedQueueSpots() {
  return [true, false].flatMap((rx) =>
    Array.from({ length: 18 }, (_, i) => ({
      x: (rx ? -2.7 : -0.5) + Math.floor(i / 5) * 0.65,
      z: 0.05 + (i % 5) * 0.6,
    })),
  );
}
function reachable(from, obstacles, bounds) {
  const unit = 0.25,
    key = (x, z) => `${x},${z}`,
    start = { x: Math.round(from.x / unit), z: Math.round(from.z / unit) };
  const queue = [start],
    seen = new Set([key(start.x, start.z)]);
  let cursor = 0;
  while (cursor < queue.length) {
    const p = queue[cursor++];
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = p.x + dx,
        z = p.z + dz,
        k = key(x, z),
        wx = x * unit,
        wz = z * unit;
      if (
        seen.has(k) ||
        wx < bounds.minX ||
        wx > bounds.maxX ||
        wz < bounds.minZ ||
        wz > bounds.maxZ ||
        blocked(wx, wz, obstacles)
      )
        continue;
      seen.add(k);
      queue.push({ x, z });
    }
  }
  return (p) => seen.has(key(Math.round(p.x / unit), Math.round(p.z / unit)));
}
export function checkLayout(s, { actors = true } = {}) {
  const bad = (message) => ({ ok: false, message });
  const edge = EXPANSIONS[s.level - 1]?.right;
  if (!edge) return bad('알 수 없는 확장 단계입니다.');
  const furniture = [...s.layout.shelves.map((p) => ({ ...p, kind: 'shelf' })), ...s.placements];
  for (let i = 0; i < furniture.length; i++) {
    const p = furniture[i];
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.z) ||
      !Number.isInteger(p.rotation) ||
      p.rotation < 0 ||
      p.rotation > 3 ||
      (p.kind !== 'shelf' && !Object.hasOwn(FURNITURE, p.kind))
    )
      return bad('올바른 위치와 회전을 선택해주세요.');
    const a = { ...p, ...dimensions(p.kind, p.rotation) };
    if (
      a.x - a.w / 2 < -5.7 ||
      a.x + a.w / 2 > edge - 0.3 ||
      a.z - a.d / 2 < -3.15 ||
      a.z + a.d / 2 > 3.5
    )
      return bad('구입한 매장 바닥 안에 놓아주세요.');
    const others = [
      BLOCKS[0],
      BLOCKS[4],
      BLOCKS[5],
      ...furniture.slice(i + 1).map((p) => ({ ...p, ...dimensions(p.kind, p.rotation) })),
    ];
    if (
      others.some(
        (b) =>
          Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 0.16 &&
          Math.abs(a.z - b.z) < (a.d + b.d) / 2 + 0.16,
      )
    )
      return bad('다른 가구와 겹치거나 너무 가까워요.');
    if (actors && [...s.staff, ...s.customers].some((e) => blocked(e.x, e.z, [a], 0.2)))
      return bad('사람이 서 있는 위치에는 놓을 수 없어요.');
  }
  const obstacles = layoutObstacles(s),
    canReach = reachable(SPOTS.door, obstacles, buildingBounds(s.level));
  const points = [
    ...Object.values(SPOTS),
    ...s.layout.shelves.map(shelfFront),
    ...reservedQueueSpots(),
  ];
  if (points.some((p) => blocked(p.x, p.z, obstacles) || !canReach(p)))
    return bad('출입구·대기줄·업무 동선을 막는 배치입니다.');
  if ([...s.staff, ...s.customers].some((p) => !canReach(p)))
    return bad('사람이 밖으로 나올 수 없는 배치입니다.');
  return { ok: true, message: '이 위치에 놓을 수 있어요.' };
}
export function migrateSave(data) {
  const copy = structuredClone(data);
  if (copy?.version === 1 && copy.state?.version === 1) {
    if (copy.state.level !== 1 || !Array.isArray(copy.state.placements))
      throw new Error('이전 저장의 매장 정보가 올바르지 않습니다.');
    copy.version = copy.state.version = 2;
    copy.state.layout = defaultLayout();
    const old = copy.state.placements;
    copy.state.placements = [];
    copy.migrationNotices = [];
    for (const item of old) {
      if (
        item.kind !== 'plant' ||
        typeof item.id !== 'string' ||
        !Number.isFinite(item.x) ||
        !Number.isFinite(item.z)
      )
        throw new Error('이전 저장의 화분 정보가 올바르지 않습니다.');
      const placement = { ...item, rotation: 0 };
      const candidates = [{ x: item.x, z: item.z }];
      for (let x = -5; x <= 5; x += 0.5)
        for (let z = -2.5; z <= 3; z += 0.5) candidates.push({ x, z });
      candidates.sort(
        (a, b) => Math.hypot(a.x - item.x, a.z - item.z) - Math.hypot(b.x - item.x, b.z - item.z),
      );
      const spot = candidates.find(
        (p) =>
          checkLayout({
            ...copy.state,
            placements: [...copy.state.placements, { ...placement, ...p }],
          }).ok,
      );
      if (spot) {
        copy.state.placements.push({ ...placement, ...spot });
        if (spot.x !== item.x || spot.z !== item.z)
          copy.migrationNotices.push('이전 화분을 가까운 빈자리로 옮겨 대기 동선을 확보했어요.');
      } else {
        copy.state.cash += FURNITURE.plant.cost;
        copy.migrationNotices.push('놓을 자리가 없는 이전 화분의 구입비를 전액 돌려드렸어요.');
      }
    }
  }
  if (copy?.version === 2 && Array.isArray(copy.state?.orders))
    for (const order of copy.state.orders)
      if (order && !Object.hasOwn(order, 'orderedDay')) order.orderedDay = copy.state.day;
  return copy;
}
