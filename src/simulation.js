import {
  PRODUCTS,
  PRODUCT,
  SUPPLIERS,
  PROFILES,
  PRESCRIPTIONS,
  POPS,
  NEWS,
  ZONES,
  BLOCKS,
  SPOTS,
  ROLES,
} from './content.js';
import { findPath, moveAlong, blocked } from './navigation.js';
import { validateSave } from './save-validation.js';
import { CRISIS_STAGES, stageForDay } from './crisis.js';
import { MAX_CUSTOMERS, MAX_OUTSIDE, indoorCapacity, isIndoor, outsideSpot } from './crowd.js';
import { shelfWaitingSpot } from './browsing.js';
import { moveCrowd, idleSpot, arrivalSpot } from './movement.js';
import {
  EXPANSIONS,
  FURNITURE,
  defaultLayout,
  buildingBounds,
  layoutObstacles,
  shelfFront,
  checkLayout,
  migrateSave,
} from './building.js';
const stats = () => ({
  revenue: 0,
  cogs: 0,
  served: 0,
  lost: 0,
  prescriptions: 0,
  units: 0,
  visitors: 0,
  waitTotal: 0,
  questions: 0,
  expenses: 0,
});
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export class Simulation {
  constructor() {
    this.events = [];
    this.s = {
      version: 2,
      day: 1,
      time: 540,
      elapsed: 0,
      phase: 'ready',
      speed: 1,
      cash: 5000000,
      reputation: 50,
      level: 1,
      layout: defaultLayout(),
      auto: true,
      seed: 48117,
      nextId: 1,
      spawnIn: 3,
      phoneIn: 70,
      inventory: Object.fromEntries(
        PRODUCTS.map((p) => [
          p.id,
          { shelf: p.id === 'mask' ? 6 : 8, warehouse: 12, held: 0, sold: 0 },
        ]),
      ),
      prices: Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price])),
      customers: [],
      staff: [
        {
          id: 'player',
          name: '나 · 약사',
          role: 'pharmacist',
          x: -2,
          z: -1.6,
          path: [],
          action: '대기',
          task: null,
          speed: 1.8,
          angle: Math.PI,
        },
      ],
      tasks: [],
      orders: [],
      pop: [],
      placements: [],
      stats: stats(),
      history: [],
      regulars: [],
      priorities: { prescription: 8, checkout: 7, consult: 6, delivery: 5, restock: 4, phone: 3 },
      crisis: 0,
      newsIndex: 0,
    };
  }
  emit(type, text, data = {}) {
    this.events.push({ type, text, ...data });
    if (this.events.length > 100) this.events.shift();
  }
  id(prefix) {
    return `${prefix}${this.s.nextId++}`;
  }
  random() {
    this.s.seed = (Math.imul(this.s.seed, 1664525) + 1013904223) >>> 0;
    return this.s.seed / 4294967296;
  }
  get obstacles() {
    return layoutObstacles(this.s);
  }
  get bounds() {
    return buildingBounds(this.s.level);
  }
  get building() {
    return EXPANSIONS[this.s.level - 1];
  }
  get crisisStage() {
    return CRISIS_STAGES[this.s.crisis];
  }
  get crowd() {
    return {
      inside: this.s.customers.filter(isIndoor).length,
      capacity: indoorCapacity(this.s.level),
      outside: this.s.customers.filter((c) => c.state === 'outside').length,
    };
  }
  admitWaiting() {
    let free = this.crowd.capacity - this.crowd.inside;
    const waiting = this.s.customers.filter((c) => c.state === 'outside');
    for (const c of waiting) {
      if (free <= 0) break;
      c.state = 'enter';
      c.timer = 0;
      delete c.outsideSlot;
      this.path(c, SPOTS.door);
      free--;
    }
    this.s.customers
      .filter((c) => c.state === 'outside')
      .forEach((c, index) => {
        if (c.outsideSlot !== index) {
          c.outsideSlot = index;
          this.path(c, outsideSpot(index));
        }
      });
  }
  get storageCapacity() {
    return (
      this.building.storage + this.s.placements.reduce((n, p) => n + FURNITURE[p.kind].storage, 0)
    );
  }
  get committedStorage() {
    return (
      Object.values(this.s.inventory).reduce((n, i) => n + i.warehouse, 0) +
      this.s.orders.filter((o) => o.status !== 'stored').reduce((n, o) => n + o.quantity, 0)
    );
  }
  path(entity, target) {
    entity.destination = { x: target.x, z: target.z };
    entity.path = findPath(entity, target, this.obstacles, this.bounds);
    return entity.path.length > 0 || Math.hypot(entity.x - target.x, entity.z - target.z) < 0.36;
  }
  open() {
    if (this.s.phase !== 'ready') return;
    this.s.phase = 'open';
    this.emit('open', '좋은 아침이에요. 오늘의 영업을 시작합니다.');
  }
  close() {
    if (this.s.phase !== 'open') return;
    this.s.phase = 'closing';
    this.emit('info', '마감 준비 · 남아 있는 손님을 응대합니다.');
  }
  nextDay() {
    if (this.s.phase !== 'summary') return;
    const s = this.s;
    s.day++;
    s.time = 540;
    s.phase = 'ready';
    s.stats = stats();
    s.spawnIn = 3;
    s.phoneIn = 70;
    s.crisis = stageForDay(s.day);
    s.newsIndex = Math.min(s.day - 1, NEWS.length - 1);
    this.emit('news', NEWS[s.newsIndex]);
  }
  demand(p) {
    const crisis = p.tags.includes('crisis') ? this.crisisStage.demand : 1;
    const limit =
      this.s.pop.includes('limit') &&
      this.s.crisis > 1 &&
      this.crisisStage.demand > 1 &&
      p.tags.includes('crisis')
        ? 0.8
        : 1;
    return crisis * limit * Math.pow(p.price / this.s.prices[p.id], 1.3);
  }
  quote(product, qty, supplier) {
    const p = PRODUCT[product],
      v = SUPPLIERS.find((x) => x.id === supplier);
    if (!p || !v) return null;
    const affected = p.tags.includes('crisis');
    const stage = this.crisisStage;
    const pressure = affected ? stage.cost : 1;
    const dailyLimit = Math.floor(v.limit * (affected ? stage.supply : 1));
    const used = this.s.orders
      .filter(
        (o) => o.product === product && o.supplier === supplier && o.orderedDay === this.s.day,
      )
      .reduce((n, o) => n + o.quantity, 0);
    return {
      cost: Math.round(p.cost * v.modifier * pressure) * qty,
      eta: v.delivery * stage.delivery,
      dailyLimit,
      limit: Math.max(0, dailyLimit - used),
    };
  }
  order(product, quantity, supplier) {
    const q = this.quote(product, quantity, supplier);
    if (!q || !Number.isSafeInteger(quantity) || quantity <= 0 || quantity > q.limit)
      return { ok: false, message: '공급 가능 수량 이내의 정수를 입력해주세요.' };
    if (this.committedStorage + quantity > this.storageCapacity)
      return {
        ok: false,
        message:
          '배송 예정 물량을 포함한 창고 한도를 초과해요. 재진열하거나 창고 선반을 추가해주세요.',
      };
    if (q.cost > this.s.cash) return { ok: false, message: '발주할 자금이 부족합니다.' };
    this.s.cash -= q.cost;
    this.s.orders.push({
      id: this.id('o'),
      product,
      quantity,
      supplier,
      cost: q.cost,
      eta: q.eta,
      status: 'transit',
      orderedDay: this.s.day,
    });
    this.emit('order', `${PRODUCT[product].name} ${quantity}개 발주 완료`);
    return { ok: true };
  }
  task(type, data = {}) {
    const t = {
      id: this.id('t'),
      type,
      priority: this.s.priorities[type] || 1,
      assigned: null,
      step: 0,
      elapsed: 0,
      steps: [],
      ...data,
    };
    this.s.tasks.push(t);
    return t;
  }
  restock(product) {
    if (!PRODUCT[product]) return { ok: false, message: '없는 상품입니다.' };
    const inv = this.s.inventory[product];
    if (!inv.warehouse) return { ok: false, message: '창고 재고가 없어요. 먼저 발주해주세요.' };
    if (inv.shelf >= PRODUCT[product].capacity)
      return { ok: false, message: '매대가 가득 찼어요.' };
    if (this.s.tasks.some((t) => t.type === 'restock' && t.product === product))
      return { ok: false, message: '이미 진열 업무가 대기 중이에요.' };
    this.task('restock', { product });
    this.emit('info', `${PRODUCT[product].name} 진열 업무 추가`);
    return { ok: true };
  }
  installPOP(id) {
    const p = POPS.find((x) => x.id === id);
    if (!p || this.s.pop.includes(id)) return { ok: false, message: '이미 설치되어 있어요.' };
    if (this.s.cash < p.price) return { ok: false, message: '자금이 부족해요.' };
    this.s.cash -= p.price;
    this.s.pop.push(id);
    this.emit('info', `${p.name} 설치 완료`);
    return { ok: true };
  }
  hire(role) {
    const r = ROLES[role];
    if (!r || this.s.staff.length >= this.building.staff)
      return {
        ok: false,
        message: `현재 매장에서는 최대 ${this.building.staff}명까지 함께 일해요.`,
      };
    if (this.s.cash < r.cost) return { ok: false, message: '채용 자금이 부족해요.' };
    const start = idleSpot(
      { x: 1, z: -2.4 },
      {
        people: [...this.s.staff, ...this.s.customers],
        obstacles: this.obstacles,
        bounds: this.bounds,
      },
    );
    if (!start) return { ok: false, message: '직원이 대기할 빈 공간을 먼저 확보해주세요.' };
    this.s.cash -= r.cost;
    this.s.staff.push({
      id: this.id('s'),
      name: ['지수', '도윤', '서연', '민재', '하늘', '유진', '정우'][this.s.staff.length - 1],
      role,
      x: start.x,
      z: start.z,
      path: [],
      action: '대기',
      task: null,
      speed: 1.7,
      angle: 0,
    });
    this.emit('info', `${r.name} 채용 완료 · 업무를 나누기 시작합니다.`);
    return { ok: true };
  }
  setPrice(id, value) {
    if (
      !PRODUCT[id] ||
      !Number.isFinite(value) ||
      value < PRODUCT[id].cost ||
      value > PRODUCT[id].price * 3
    )
      return { ok: false, message: '매입가 이상, 기본 판매가 3배 이하로 설정해주세요.' };
    this.s.prices[id] = Math.round(value);
    return { ok: true };
  }
  spawnCustomer(purpose, product) {
    const s = this.s;
    const crowd = this.crowd;
    if (s.customers.length >= MAX_CUSTOMERS || crowd.outside >= MAX_OUTSIDE) return null;
    const outside = crowd.outside > 0 || crowd.inside >= crowd.capacity;
    const occupiedSlots = new Set(
      s.customers.filter((c) => c.state === 'outside').map((c) => c.outsideSlot),
    );
    let slot = 0;
    while (occupiedSlots.has(slot)) slot++;
    const preferred = outside ? outsideSpot(slot) : SPOTS.entry;
    const start = arrivalSpot(preferred, [...s.customers, ...s.staff], this.bounds);
    if (!start) return null;
    let r = this.random();
    purpose =
      purpose ||
      (s.stats.visitors === 1
        ? 'prescription'
        : r < 0.25
          ? 'prescription'
          : r < 0.38
            ? 'consult'
            : 'shop');
    if (!product) {
      const sum = PRODUCTS.reduce((total, p) => total + this.demand(p), 0);
      let pick = this.random() * sum;
      product = PRODUCTS.at(-1).id;
      for (const p of PRODUCTS) {
        pick -= this.demand(p);
        if (pick <= 0) {
          product = p.id;
          break;
        }
      }
    }
    const appearance =
      s.regulars.length && this.random() < 0.12
        ? s.regulars[Math.floor(this.random() * s.regulars.length)]
        : Math.floor(this.random() * 1000);
    const c = {
      id: this.id('c'),
      profile: PROFILES[appearance % 8],
      purpose,
      product,
      state: outside ? 'outside' : 'enter',
      x: start.x,
      z: start.z,
      path: [],
      angle: Math.PI,
      patience: 125 + (appearance % 45),
      maxPatience: 170,
      wait: 0,
      timer: 0,
      held: false,
      appearance,
    };
    if (outside) {
      c.outsideSlot = slot;
    }
    if (purpose === 'prescription' && s.pop.includes('rx')) c.patience *= 1.2;
    if (s.pop.includes('checkout')) c.patience *= 1.15;
    c.patience += Math.min(3, s.placements.filter((p) => p.kind === 'bench').length) * 8;
    s.customers.push(c);
    s.stats.visitors++;
    this.path(c, outside ? outsideSpot(slot) : SPOTS.door);
    return c;
  }
  zoneSpot(product) {
    return shelfFront(this.s.layout.shelves.find((p) => p.zone === PRODUCT[product].zone));
  }
  tryBrowse(c) {
    const zone = PRODUCT[c.product].zone;
    if (
      this.s.customers.some(
        (other) =>
          other !== c &&
          ['browse', 'pick'].includes(other.state) &&
          PRODUCT[other.product].zone === zone,
      )
    )
      return false;
    const first = this.s.customers.find(
      (other) => other.state === 'shelfwait' && PRODUCT[other.product].zone === zone,
    );
    if (first && first !== c) return false;
    c.state = 'browse';
    c.timer = 0;
    this.path(c, this.zoneSpot(c.product));
    return true;
  }
  waitForShelf(c) {
    c.state = 'shelfwait';
    c.timer = 0;
    if (!this.tryBrowse(c)) this.path(c, shelfWaitingSpot(this, c));
  }
  queueSpot(rx, index) {
    return { x: (rx ? -2.7 : -0.5) + Math.floor(index / 5) * 0.65, z: 0.05 + (index % 5) * 0.6 };
  }
  refreshQueues() {
    for (const rx of [true, false]) {
      const line = this.s.customers.filter(
        (c) => ['queue', 'service'].includes(c.state) && (c.purpose === 'prescription') === rx,
      );
      line.sort((a, b) => (a.state === 'service' ? -1 : 0) - (b.state === 'service' ? -1 : 0));
      line.forEach((c, index) => {
        if (c.state === 'service') return;
        const target = this.queueSpot(rx, index),
          key = `${target.x}:${target.z}`;
        if (c.queueSlot !== key) {
          c.queueSlot = key;
          this.path(c, target);
        }
        c.queueIndex = index;
      });
    }
  }
  queue(c) {
    c.state = 'queue';
    c.timer = 0;
    this.refreshQueues();
    if (!this.s.tasks.some((t) => t.customer === c.id))
      this.task(
        c.purpose === 'prescription'
          ? 'prescription'
          : c.purpose === 'consult'
            ? 'consult'
            : 'checkout',
        { customer: c.id, product: c.product },
      );
  }
  abandon(c) {
    if (c.held) {
      const inv = this.s.inventory[c.product];
      inv.held--;
      if (inv.shelf < PRODUCT[c.product].capacity) inv.shelf++;
      else inv.warehouse++;
      c.held = false;
    }
    const tasks = this.s.tasks.filter((t) => t.customer === c.id);
    for (const t of tasks) {
      const staff = this.s.staff.find((st) => st.task === t.id);
      if (staff) {
        staff.task = null;
        staff.path = [];
        staff.action = '대기';
      }
    }
    this.s.tasks = this.s.tasks.filter((t) => t.customer !== c.id);
    this.s.stats.lost++;
    this.s.reputation = clamp(this.s.reputation - 1, 0, 100);
    c.state = 'exit';
    this.path(c, SPOTS.entry);
    this.emit('unhappy', '기다리던 손님이 돌아갔어요. 업무 우선순위를 확인해주세요.');
  }
  steps(t) {
    const step = (p, action, duration) => ({ ...p, action, duration });
    switch (t.type) {
      case 'checkout':
        return [step(SPOTS.checkout, '계산', 3), step(SPOTS.checkout, '전달', 1.3)];
      case 'consult':
        return [
          step(SPOTS.checkout, '상담', this.s.pop.includes('kids') ? 5 : 6),
          step(SPOTS.checkout, '계산', 2),
        ];
      case 'prescription': {
        const rx = PRESCRIPTIONS[Number(t.customer.slice(1)) % 10];
        t.rx = rx;
        return [
          step(SPOTS.rx, '접수', 2),
          step(SPOTS.phone, '입력', 2),
          step(SPOTS.cabinet, '약 찾기', 3),
          step(SPOTS.compound, '조제', rx.duration),
          step(SPOTS.compound, '포장', 3),
          step(SPOTS.rx, '전달', 2),
        ];
      }
      case 'restock':
        return [step(SPOTS.storage, '상자 들기', 2), step(this.zoneSpot(t.product), '진열', 4)];
      case 'delivery':
        return [step(SPOTS.delivery, '상자 들기', 2), step(SPOTS.storage, '입고 정리', 3)];
      case 'phone':
        return [step(SPOTS.phone, '전화 응대', 5)];
      default:
        return [];
    }
  }
  assign(staff) {
    const roles = ROLES[staff.role].types;
    const tasks = this.s.tasks.filter((t) => !t.assigned && roles.includes(t.type));
    tasks.sort((a, b) => b.priority - a.priority);
    const t = tasks.find((t) => {
      if (!this.s.auto && t.priority < 100) return false;
      if (t.customer) {
        const c = this.s.customers.find((c) => c.id === t.customer);
        return (
          c &&
          c.state === 'queue' &&
          !c.path.length &&
          c.queueIndex === 0 &&
          c.destination &&
          Math.hypot(c.x - c.destination.x, c.z - c.destination.z) < 0.36
        );
      }
      return true;
    });
    if (!t) return;
    t.assigned = staff.id;
    t.steps = this.steps(t);
    staff.task = t.id;
    delete staff.parking;
    staff.action = '이동';
    this.path(staff, t.steps[0]);
    const c = this.s.customers.find((c) => c.id === t.customer);
    if (c) c.state = 'service';
  }
  complete(t) {
    const s = this.s,
      c = s.customers.find((c) => c.id === t.customer);
    if (t.type === 'restock') {
      const inv = s.inventory[t.product],
        n = Math.min(PRODUCT[t.product].capacity - inv.shelf, inv.warehouse);
      inv.shelf += n;
      inv.warehouse -= n;
      this.emit('restock', `${PRODUCT[t.product].name} ${n}개 진열 완료`);
    } else if (t.type === 'delivery') {
      const order = s.orders.find((o) => o.id === t.order);
      if (order && order.status === 'arrived') {
        order.status = 'stored';
        s.inventory[order.product].warehouse += order.quantity;
        this.emit('delivery', `${PRODUCT[order.product].name} 창고 입고 완료`);
      }
    } else if (c) {
      let revenue, cost;
      if (t.type === 'prescription') {
        revenue = t.rx.reward;
        cost = t.rx.cost;
        s.stats.prescriptions++;
      } else {
        const p = PRODUCT[c.product],
          inv = s.inventory[c.product];
        if (!c.held && inv.shelf > 0) {
          inv.shelf--;
          inv.held++;
          c.held = true;
        }
        if (c.held) {
          inv.held--;
          inv.sold++;
          c.held = false;
          revenue = s.prices[p.id];
          cost = p.cost;
          s.stats.units++;
          if (inv.shelf === 0) this.emit('soldout', `${p.name} SOLD OUT`, { product: p.id });
        } else {
          revenue = 0;
          cost = 0;
        }
      }
      s.cash += revenue - (t.type === 'prescription' ? cost : 0);
      s.stats.revenue += revenue;
      s.stats.cogs += cost;
      s.stats.served++;
      s.stats.waitTotal += c.wait;
      s.reputation = clamp(s.reputation + (s.pop.includes('hygiene') ? 0.35 : 0.25), 0, 100);
      c.state = 'exit';
      c.happy = true;
      this.path(c, SPOTS.entry);
      this.emit('sale', `+ ₩${revenue.toLocaleString('ko-KR')}`, { revenue });
      if (c.patience > 80 && !s.regulars.includes(c.appearance)) s.regulars.push(c.appearance);
    } else if (t.type === 'phone') {
      this.emit('info', '전화 문의를 마쳤어요.');
    }
    s.tasks = s.tasks.filter((x) => x.id !== t.id);
  }
  update(dt) {
    const s = this.s;
    if (s.speed === 0 || s.phase === 'ready' || s.phase === 'summary') return;
    dt *= s.speed;
    s.elapsed += dt;
    if (s.phase === 'open') s.time = Math.min(1080, s.time + dt * 0.9);
    if (s.time >= 1080 && s.phase === 'open') this.close();
    for (const o of s.orders) {
      if (o.status !== 'transit') continue;
      o.eta -= dt;
      if (o.eta <= 0) {
        o.status = 'arrived';
        this.task('delivery', { order: o.id, product: o.product });
        this.emit('delivery', '택배가 도착했어요. 입고 상자를 정리해주세요.');
      }
    }
    if (s.phase === 'open') {
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        this.spawnCustomer();
        s.spawnIn = (15 + this.random() * 12) / this.crisisStage.traffic;
      }
      s.phoneIn -= dt;
      if (s.phoneIn <= 0) {
        if (!s.tasks.some((t) => t.type === 'phone')) {
          this.task('phone');
          this.emit('phone', '따르르릉— 전화가 왔어요.');
        }
        s.phoneIn = s.pop.includes('hours') ? 170 : 120;
      }
    }
    this.admitWaiting();
    const movement = {
      people: [...s.customers, ...s.staff],
      obstacles: this.obstacles,
      bounds: this.bounds,
    };
    for (const c of s.customers) {
      c.timer += dt;
      const arrived = moveCrowd(c, dt, 1.35, movement);
      if (c.state === 'outside') {
        c.wait += dt;
        c.patience -= dt;
        if (c.patience <= 0) this.abandon(c);
      } else if (c.state === 'enter' && arrived) {
        if (c.purpose === 'prescription' || c.purpose === 'consult') {
          this.queue(c);
          if (c.purpose === 'consult') s.stats.questions++;
        } else {
          this.waitForShelf(c);
        }
      } else if (c.state === 'shelfwait') {
        c.wait += dt;
        c.patience -= dt;
        if (c.patience <= 0) this.abandon(c);
        else this.tryBrowse(c);
      } else if (c.state === 'browse' && arrived && c.timer > (s.pop.includes('cold') ? 3 : 5)) {
        c.state = 'pick';
        c.timer = 0;
        c.angle = Math.PI;
      } else if (c.state === 'pick' && c.timer > 1.2) {
        const inv = s.inventory[c.product];
        if (inv.shelf > 0) {
          inv.shelf--;
          inv.held++;
          c.held = true;
          this.queue(c);
        } else if (c.product === 'mask' && s.pop.includes('mask') && this.random() < 0.7) {
          c.state = 'exit';
          this.path(c, SPOTS.entry);
        } else {
          c.purpose = 'consult';
          s.stats.questions++;
          this.queue(c);
        }
      } else if (c.state === 'queue') {
        c.wait += dt;
        c.patience -= dt;
        if (c.patience <= 0) this.abandon(c);
      } else if (c.state === 'exit' && arrived) c.state = 'gone';
    }
    s.customers = s.customers.filter((c) => c.state !== 'gone');
    this.refreshQueues();
    for (const staff of s.staff) {
      if (staff.task && !s.tasks.some((t) => t.id === staff.task)) {
        staff.task = null;
        staff.path = [];
      }
      if (!staff.task) this.assign(staff);
      const t = s.tasks.find((t) => t.id === staff.task);
      if (!t) {
        if (!staff.parking) {
          const spot = idleSpot(staff, movement);
          if (spot) {
            this.path(staff, spot);
            staff.parking = true;
          }
        }
        staff.action = moveCrowd(staff, dt, staff.speed, movement) ? '대기' : '자리 비우기';
        continue;
      }
      const arrived = moveCrowd(staff, dt, staff.speed, movement);
      if (!arrived) {
        staff.action = '이동';
        continue;
      }
      const step = t.steps[t.step];
      staff.action = step.action;
      staff.angle = ['계산', '전달', '접수', '상담'].includes(step.action) ? 0 : Math.PI;
      t.elapsed += dt;
      if (t.elapsed >= step.duration) {
        t.elapsed = 0;
        t.step++;
        if (t.step >= t.steps.length) {
          this.complete(t);
          staff.task = null;
          staff.action = '대기';
        } else this.path(staff, t.steps[t.step]);
      }
    }
    if (s.phase === 'closing' && s.customers.length === 0 && !s.tasks.some((t) => t.customer)) {
      s.tasks = s.tasks.filter((t) => t.type !== 'phone');
      for (const staff of s.staff)
        if (staff.task && !s.tasks.some((t) => t.id === staff.task)) {
          staff.task = null;
          staff.path = [];
          staff.action = '대기';
        }
      s.stats.expenses =
        this.building.rent +
        s.staff.filter((st) => st.id !== 'player').reduce((a, st) => a + ROLES[st.role].salary, 0);
      s.cash -= s.stats.expenses;
      s.history.push({
        ...s.stats,
        day: s.day,
        profit: s.stats.revenue - s.stats.cogs - s.stats.expenses,
        reputation: s.reputation,
      });
      s.phase = 'summary';
      this.emit('summary', '오늘도 수고했어요.');
    }
  }
  prioritize(id) {
    const t = this.s.tasks.find((t) => t.id === id);
    if (t) t.priority = 100;
  }
  expand() {
    const next = EXPANSIONS[this.s.level];
    if (!next) return { ok: false, message: '현재 준비된 마지막 확장 단계입니다.' };
    if (this.s.cash < next.cost) return { ok: false, message: '확장할 자금이 부족해요.' };
    this.s.cash -= next.cost;
    this.s.level = next.level;
    this.emit('expansion', `${next.area}평으로 확장했어요. 시설과 재고는 그대로 유지됩니다.`);
    return { ok: true };
  }
  previewPlacement({ kind = 'plant', id, zone, x, z, rotation = 0 }) {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(z) ||
      !Number.isInteger(rotation) ||
      rotation < 0 ||
      rotation > 3
    )
      return { ok: false, message: '올바른 위치와 회전을 선택해주세요.' };
    if (kind !== 'shelf' && !Object.hasOwn(FURNITURE, kind))
      return { ok: false, message: '알 수 없는 가구입니다.' };
    const placement = { kind, x: Math.round(x * 2) / 2, z: Math.round(z * 2) / 2, rotation };
    const candidate = {
      ...this.s,
      placements: this.s.placements.map((p) => ({ ...p })),
      layout: { shelves: this.s.layout.shelves.map((p) => ({ ...p })) },
    };
    if (kind === 'shelf') {
      const shelf = candidate.layout.shelves.find((p) => p.zone === zone);
      if (!shelf) return { ok: false, message: '매대를 찾을 수 없어요.' };
      Object.assign(shelf, { x: placement.x, z: placement.z, rotation });
    } else if (id) {
      const old = candidate.placements.find((p) => p.id === id);
      if (!old || old.kind !== kind) return { ok: false, message: '가구를 찾을 수 없어요.' };
      Object.assign(old, placement);
    } else {
      if (this.s.cash < FURNITURE[kind].cost)
        return { ok: false, message: '가구를 구입할 자금이 부족해요.' };
      candidate.placements.push({ ...placement, id: 'preview' });
    }
    const result = checkLayout(candidate);
    return { ...result, placement };
  }
  replanLayout() {
    for (const c of this.s.customers) {
      if (['browse', 'pick'].includes(c.state)) {
        c.state = 'browse';
        c.timer = 0;
        this.path(c, this.zoneSpot(c.product));
      } else if (c.state === 'shelfwait') this.path(c, shelfWaitingSpot(this, c));
      else if (c.destination) this.path(c, c.destination);
    }
    for (const t of this.s.tasks) {
      if (t.type === 'restock' && t.assigned)
        t.steps[1] = { ...t.steps[1], ...this.zoneSpot(t.product) };
    }
    for (const staff of this.s.staff) {
      const t = this.s.tasks.find((t) => t.id === staff.task);
      if (t) this.path(staff, t.steps[t.step]);
      else if (staff.destination) this.path(staff, staff.destination);
    }
  }
  place(x, z, kind = 'plant', rotation = 0) {
    const result = this.previewPlacement({ kind, x, z, rotation });
    if (!result.ok) return result;
    this.s.cash -= FURNITURE[kind].cost;
    this.s.placements.push({ ...result.placement, id: this.id('f') });
    this.replanLayout();
    return { ok: true };
  }
  editShelf(zone, { x, z, rotation }) {
    const result = this.previewPlacement({ kind: 'shelf', zone, x, z, rotation });
    if (!result.ok) return result;
    Object.assign(
      this.s.layout.shelves.find((p) => p.zone === zone),
      { x: result.placement.x, z: result.placement.z, rotation },
    );
    this.replanLayout();
    return { ok: true };
  }
  moveFurniture(id, { x, z, rotation }) {
    const old = this.s.placements.find((p) => p.id === id);
    if (!old) return { ok: false, message: '가구를 찾을 수 없어요.' };
    const result = this.previewPlacement({ id, kind: old.kind, x, z, rotation });
    if (!result.ok) return result;
    Object.assign(old, result.placement);
    this.replanLayout();
    return { ok: true };
  }
  sellFurniture(id) {
    const old = this.s.placements.find((p) => p.id === id);
    if (!old) return { ok: false, message: '가구를 찾을 수 없어요.' };
    const def = FURNITURE[old.kind];
    if (def.storage && this.committedStorage > this.storageCapacity - def.storage)
      return {
        ok: false,
        message:
          '배송 예정 재고까지 보관할 공간이 필요해요. 먼저 재진열하거나 다른 창고 선반을 설치해주세요.',
      };
    this.s.placements = this.s.placements.filter((p) => p.id !== id);
    this.s.cash += Math.floor(def.cost / 2);
    this.replanLayout();
    return { ok: true };
  }
  serialize() {
    return JSON.stringify({ version: 2, state: this.s });
  }
  restore(raw) {
    const migrated = migrateSave(JSON.parse(raw));
    const s = validateSave(migrated);
    this.s = structuredClone(s);
    this.events = [];
    const occupiedShelves = new Set();
    for (const c of this.s.customers) {
      if (!['browse', 'pick'].includes(c.state)) continue;
      const zone = PRODUCT[c.product].zone;
      if (occupiedShelves.has(zone)) {
        c.state = 'shelfwait';
        c.timer = 0;
        this.path(c, shelfWaitingSpot(this, c));
      } else occupiedShelves.add(zone);
    }
    if (migrated.migrationNotices?.length) {
      this.replanLayout();
      for (const text of new Set(migrated.migrationNotices))
        this.events.push({ type: 'info', text });
    }
  }
}
