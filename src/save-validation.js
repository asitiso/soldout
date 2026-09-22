import { PRODUCTS, PRODUCT, ROLES, SUPPLIERS, POPS } from './content.js';
import { EXPANSIONS, FURNITURE, checkLayout } from './building.js';
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const integer = (v) => Number.isSafeInteger(v) && v >= 0;
const point = (p) => p && finite(p.x) && finite(p.z) && Math.abs(p.x) < 100 && Math.abs(p.z) < 100;
export function validateSave(data) {
  const fail = () => {
    throw new Error('손상되었거나 지원하지 않는 저장 파일입니다. 현재 게임은 유지됩니다.');
  };
  const s = data?.state;
  if (
    data?.version !== 2 ||
    !s ||
    s.version !== 2 ||
    !finite(s.cash) ||
    !integer(s.day) ||
    s.day < 1 ||
    !['ready', 'open', 'closing', 'summary'].includes(s.phase)
  )
    fail();
  if (
    !Number.isInteger(s.level) ||
    !EXPANSIONS[s.level - 1] ||
    !s.layout ||
    !Array.isArray(s.layout.shelves) ||
    s.layout.shelves.length !== 3 ||
    new Set(s.layout.shelves.map((p) => p.zone)).size !== 3 ||
    !s.layout.shelves.every((p) => [0, 1, 2].includes(p.zone))
  )
    fail();
  for (const key of ['time', 'elapsed', 'spawnIn', 'phoneIn', 'reputation'])
    if (!finite(s[key])) fail();
  if (
    s.time < 540 ||
    s.time > 1080 ||
    s.elapsed < 0 ||
    s.reputation < 0 ||
    s.reputation > 100 ||
    ![0, 1, 2, 3].includes(s.speed) ||
    typeof s.auto !== 'boolean' ||
    !integer(s.seed) ||
    !integer(s.nextId) ||
    !integer(s.crisis) ||
    s.crisis > 9 ||
    !integer(s.newsIndex) ||
    s.newsIndex > 14
  )
    fail();
  for (const key of [
    'staff',
    'customers',
    'tasks',
    'orders',
    'placements',
    'pop',
    'history',
    'regulars',
  ])
    if (!Array.isArray(s[key])) fail();
  if (
    !s.staff.length ||
    s.staff.length > EXPANSIONS[s.level - 1].staff ||
    s.customers.length > 100 ||
    s.orders.length > 10000 ||
    s.tasks.length > 1000 ||
    s.placements.length > 200 ||
    s.history.length > 10000 ||
    s.regulars.length > 10000
  )
    fail();
  const ids = [...s.staff, ...s.customers, ...s.tasks, ...s.orders, ...s.placements].map(
    (e) => e?.id,
  );
  if (
    ids.some((id) => typeof id !== 'string' || id.length > 60) ||
    new Set(ids).size !== ids.length
  )
    fail();
  for (const p of PRODUCTS) {
    const i = s.inventory?.[p.id];
    if (
      !i ||
      !['shelf', 'warehouse', 'held', 'sold'].every((k) => integer(i[k])) ||
      i.shelf > p.capacity ||
      !finite(s.prices?.[p.id]) ||
      s.prices[p.id] < p.cost ||
      s.prices[p.id] > p.price * 3
    )
      fail();
  }
  const statKeys = [
    'revenue',
    'cogs',
    'served',
    'lost',
    'prescriptions',
    'units',
    'visitors',
    'waitTotal',
    'questions',
    'expenses',
  ];
  if (!s.stats || !statKeys.every((k) => finite(s.stats[k]) && s.stats[k] >= 0)) fail();
  const types = ['prescription', 'checkout', 'consult', 'delivery', 'restock', 'phone'];
  if (
    !s.priorities ||
    !types.every((k) => integer(s.priorities[k]) && s.priorities[k] >= 1 && s.priorities[k] <= 10)
  )
    fail();
  for (const e of [...s.staff, ...s.customers])
    if (
      !point(e) ||
      !Array.isArray(e.path) ||
      e.path.length > 2000 ||
      !e.path.every(point) ||
      (Object.hasOwn(e, 'destination') && !point(e.destination))
    )
      fail();
  for (const st of s.staff) {
    if (
      !ROLES[st.role] ||
      typeof st.name !== 'string' ||
      !finite(st.speed) ||
      st.speed <= 0 ||
      typeof st.action !== 'string'
    )
      fail();
    if (Object.hasOwn(st, 'parking') && typeof st.parking !== 'boolean') fail();
    if (st.task !== null && !s.tasks.some((t) => t.id === st.task && t.assigned === st.id)) fail();
  }
  const outsideCustomers = s.customers.filter((c) => c.state === 'outside');
  if (
    outsideCustomers.length > 32 ||
    new Set(outsideCustomers.map((c) => c.outsideSlot)).size !== outsideCustomers.length
  )
    fail();
  for (const c of s.customers) {
    if (
      !PRODUCT[c.product] ||
      !['shop', 'consult', 'prescription'].includes(c.purpose) ||
      !['outside', 'enter', 'shelfwait', 'browse', 'pick', 'queue', 'service', 'exit'].includes(
        c.state,
      ) ||
      !finite(c.patience) ||
      !finite(c.maxPatience) ||
      !finite(c.wait) ||
      !finite(c.timer) ||
      !integer(c.appearance) ||
      typeof c.held !== 'boolean'
    )
      fail();
    if (c.state === 'shelfwait' && (c.held || s.tasks.some((t) => t.customer === c.id))) fail();
    if (
      c.state === 'outside' &&
      (c.held ||
        !integer(c.outsideSlot) ||
        c.outsideSlot >= 32 ||
        s.tasks.some((t) => t.customer === c.id))
    )
      fail();
  }
  for (const p of PRODUCTS)
    if (s.inventory[p.id].held !== s.customers.filter((c) => c.product === p.id && c.held).length)
      fail();
  for (const t of s.tasks) {
    if (
      !types.includes(t.type) ||
      !finite(t.priority) ||
      !integer(t.step) ||
      !finite(t.elapsed) ||
      !Array.isArray(t.steps)
    )
      fail();
    if (t.customer && !s.customers.some((c) => c.id === t.customer)) fail();
    if (t.product && !PRODUCT[t.product]) fail();
    if (['checkout', 'consult', 'prescription'].includes(t.type) && !t.customer) fail();
    if (t.type === 'restock' && !t.product) fail();
    if (t.type === 'delivery' && !s.orders.some((o) => o.id === t.order)) fail();
    if (t.assigned !== null) {
      if (
        !s.staff.some((st) => st.id === t.assigned && st.task === t.id) ||
        t.step >= t.steps.length
      )
        fail();
      if (t.type === 'prescription' && (!t.rx || !finite(t.rx.reward) || !finite(t.rx.cost)))
        fail();
    }
    for (const step of t.steps)
      if (
        !point(step) ||
        typeof step.action !== 'string' ||
        !finite(step.duration) ||
        step.duration < 0
      )
        fail();
  }
  for (const o of s.orders)
    if (
      !PRODUCT[o.product] ||
      !SUPPLIERS.some((v) => v.id === o.supplier) ||
      !['transit', 'arrived', 'stored'].includes(o.status) ||
      !integer(o.quantity) ||
      !integer(o.orderedDay) ||
      o.orderedDay < 1 ||
      o.orderedDay > s.day ||
      o.quantity < 1 ||
      !finite(o.eta) ||
      !integer(o.cost)
    )
      fail();
  for (const p of s.placements) if (!point(p) || !Object.hasOwn(FURNITURE, p.kind)) fail();
  if (!checkLayout(s, { actors: false }).ok) fail();
  if (
    new Set(s.pop).size !== s.pop.length ||
    !s.pop.every((id) => POPS.some((p) => p.id === id)) ||
    !s.regulars.every(integer)
  )
    fail();
  for (const h of s.history)
    if (!integer(h.day) || !finite(h.profit) || !statKeys.every((k) => finite(h[k]) && h[k] >= 0))
      fail();
  return s;
}
