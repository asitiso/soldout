import { PRODUCTS, PRODUCT, SUPPLIERS, POPS, ROLES, NEWS, ZONES } from './content.js';
import { buildingPanel, LayoutEditor } from './building-ui.js';
import { FURNITURE } from './building.js';
import { crisisPanel } from './crisis-ui.js';
import { audioPanel } from './audio-ui.js';
export const money = (n) => '₩ ' + Math.round(n).toLocaleString('ko-KR');
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const paths = {
  box: 'M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10M7 5l10 5',
  pill: 'M8 4a5 5 0 0 1 7 0l5 5a5 5 0 0 1-7 7l-5-5a5 5 0 0 1 0-7zm1 8 7-7',
  people:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M15 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  shop: 'M3 10v11h18V10M2 10l2-7h16l2 7M2 10c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0M9 21v-7h6v7',
  chart: 'M4 3v18h17M8 16v-4M13 16V8M18 16V5',
  news: 'M4 3h16v18H4zM8 7h8M8 11h3M8 15h8M8 18h8M14 10h3v3h-3z',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12l4 4L19 6',
  phone: 'M5 3l4 4-2 3c2 4 3 5 7 7l3-2 4 4-3 3C8 21 3 16 2 6z',
  save: 'M4 3h13l4 4v14H3V3h1M7 3v6h10V3M7 21v-8h10v8',
  leaf: 'M20 3C5 1 1 10 6 17c7 6 16-1 14-14zM4 21l11-13',
  close: 'M6 6l12 12M18 6 6 18',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  chevron: 'm9 5 7 7-7 7',
  rotate: 'M4 10a8 8 0 1 1 1 8M4 3v7h7',
};
export const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.box}"/></svg>`;
const taskNames = {
  checkout: '계산하기',
  prescription: '처방 조제',
  consult: '손님 상담',
  restock: '상품 진열',
  delivery: '입고 정리',
  phone: '전화 응대',
};
const taskIcons = {
  checkout: 'shop',
  prescription: 'pill',
  consult: 'people',
  restock: 'box',
  delivery: 'box',
  phone: 'phone',
};
export class UI {
  constructor(game, world, audio, save, load) {
    this.game = game;
    this.world = world;
    this.audio = audio;
    this.save = save;
    this.load = load;
    this.panel = null;
    this.filter = 'all';
    this.selected = null;
    this.lastTasks = '';
    this.summaryShown = 0;
    this.root = document.querySelector('#ui');
    this.modal = document.querySelector('#modal-root');
    this.labels = document.querySelector('#world-labels');
    this.renderShell();
    this.editor = new LayoutEditor(this);
    this.bind();
    this.update();
  }
  renderShell() {
    this.root.innerHTML = `<header class="topbar"><div class="brand"><span class="brand-cross">✚</span><div class="wordmark">SOLD OUT<span>A LITTLE PHARMACY, A BIG DAY.</span></div></div><div class="day-card"><div class="day-top"><b id="day-label">DAY 01</b><span id="date-label">2020. 01. 06</span></div><div class="day-bottom">${icon('sun', 18)}<span>맑음 · 3°C</span><i></i><strong id="time-label">09:00</strong><span id="phase-label" class="status-pill">개점 준비</span></div></div><div class="economy"><div><span>운영 자금</span><strong id="cash-label">₩ 5,000,000</strong></div><div class="reputation">${icon('star', 20)}<div><span>동네 평판</span><strong id="rep-label">50 <small>/ 100</small></strong></div></div><div class="level-badge">Lv. <b>01</b><span>동네약국</span></div></div></header>
 <div class="location"><span class="tiny-caps">YOUR NEIGHBORHOOD PHARMACY</span><h1>생존약국 <span id="store-status">준비 중</span></h1><p>작은 약국에서 시작되는, 조금 특별한 하루.</p></div>
 <div class="scene-caption"><span class="live-dot"></span><span id="scene-caption">문을 열면, 오늘의 이야기가 시작됩니다.</span></div>
 <aside class="sidebar"><section class="day-goal"><div class="section-eyebrow">CHAPTER 01 <span>✦</span></div><h2>우리 동네 첫 영업</h2><p>서두르지 않아도 괜찮아요.<br>한 사람씩, 정성을 다해서.</p><div class="goal-row"><span id="goal-check">○</span> 첫 손님 5명 응대하기 <b id="goal-progress">0 / 5</b></div><div class="progress-track"><div id="goal-bar"></div></div></section>
 <section class="tasks-card"><div class="section-title"><h2>지금 할 일 <span id="task-count">0</span></h2><button class="text-button" id="auto-toggle" title="자동 업무 배정 켜기/끄기">자동 배정 ON</button></div><p class="section-hint">선택한 업무를 먼저 처리해요.</p><div id="task-list"></div><div class="staff-status"><span class="avatar">✚</span><div><b id="staff-name">나 · 약사</b><span id="staff-action">개점 준비 중</span></div><span class="online-dot"></span></div></section>
 <section class="today-card"><div class="section-title"><h2>오늘의 약국</h2><span class="tiny-caps">LIVE</span></div><div class="metric-grid"><div><span>매출</span><b id="revenue-label">₩ 0</b></div><div><span>응대한 손님</span><b id="served-label">0 <small>명</small></b></div><div><span>대기 중</span><b id="waiting-label">0 <small>명</small></b></div><div><span>조제 완료</span><b id="rx-label">0 <small>건</small></b></div></div></section>
 <button class="open-button" id="open-button">${icon('shop')}<span>약국 문 열기</span>${icon('arrow')}</button></aside>
 <div class="news-ticker"><span class="news-tag">${icon('news', 15)} 동네 소식</span><span id="news-label"></span><button data-panel="news" aria-label="뉴스 보기">${icon('chevron', 15)}</button></div>
 <div class="view-controls"><button id="rotate-left" title="왼쪽 회전 (Q)">↶</button><button id="home-view" title="시점 초기화">${icon('shop', 17)}</button><button id="rotate-right" title="오른쪽 회전 (E)">↷</button><span></span><button id="zoom-out" title="축소">−</button><button id="zoom-in" title="확대">＋</button></div>
 <footer class="bottom-bar"><nav class="dock" aria-label="약국 관리">${[
   ['order', 'box', '발주'],
   ['inventory', 'shop', '재고'],
   ['dispensing', 'pill', '조제'],
   ['staff', 'people', '직원'],
   ['build', 'leaf', '매장'],
   ['stats', 'chart', '통계'],
   ['news', 'news', '뉴스'],
   ['settings', 'settings', '설정'],
 ]
   .map(
     ([id, i, label]) =>
       `<button data-panel="${id}" aria-label="${label}" title="${label}">${icon(i, 22)}<span>${label}</span>${id === 'order' ? '<i></i>' : ''}</button>`,
   )
   .join('')}</nav><div class="time-controls"><span>게임 속도</span><div>${[
   [0, 'Ⅱ'],
   [1, '1×'],
   [2, '2×'],
   [3, '3×'],
 ]
   .map(
     ([v, t]) =>
       `<button data-speed="${v}" class="${v === 1 ? 'active' : ''}" title="${v === 0 ? '일시정지' : v + '배속'}">${t}</button>`,
   )
   .join(
     '',
   )}</div></div></footer><div class="keyboard-hint">휠 <b>확대 / 축소</b><i>·</i>우클릭 드래그 <b>화면 이동</b><i>·</i>Space <b>일시정지</b><span id="save-hint">로컬 자동 저장</span></div><div id="context-panel"></div><div id="soldout-flash"></div>`;
  }
  bind() {
    this.root.addEventListener('click', (e) => {
      const panel = e.target.closest('[data-panel]');
      if (panel) this.showPanel(panel.dataset.panel);
      const speed = e.target.closest('[data-speed]');
      if (speed && !this.world.editing) this.game.s.speed = Number(speed.dataset.speed);
      const task = e.target.closest('[data-task]');
      if (task) {
        this.game.prioritize(task.dataset.task);
        this.toast('선택한 업무를 우선 처리합니다.');
      }
      const action = e.target.closest('[data-action]');
      if (action) this.action(action.dataset.action, action.dataset.id);
    });
    document.querySelector('#open-button').onclick = () => {
      if (this.world.editing) {
        this.toast('배치 편집을 완료한 뒤 영업을 시작해주세요.', 'warning');
        return;
      }
      this.audio.unlock();
      if (this.game.s.phase === 'ready') this.game.open();
      else if (this.game.s.phase === 'open') {
        this.showPanel('closing');
      } else if (this.game.s.phase === 'summary') this.showPanel('summary');
    };
    document.querySelector('#auto-toggle').onclick = () => {
      this.game.s.auto = !this.game.s.auto;
      this.lastTasks = '';
    };
    document.querySelector('#rotate-left').onclick = () => this.world.rotate(-1);
    document.querySelector('#rotate-right').onclick = () => this.world.rotate(1);
    document.querySelector('#home-view').onclick = () => this.world.home();
    document.querySelector('#zoom-out').onclick = () => this.world.zoom(-0.15);
    document.querySelector('#zoom-in').onclick = () => this.world.zoom(0.15);
    this.modal.addEventListener('click', (e) => {
      const panelLink = e.target.closest('[data-panel]');
      if (panelLink) {
        this.showPanel(panelLink.dataset.panel);
        return;
      }
      if (e.target.classList.contains('modal-backdrop') || e.target.closest('[data-close]'))
        this.closePanel();
      const tab = e.target.closest('[data-filter]');
      if (tab) {
        this.filter = tab.dataset.filter;
        this.renderPanel();
      }
      const action = e.target.closest('[data-action]');
      if (action) this.action(action.dataset.action, action.dataset.id);
    });
    this.modal.addEventListener('change', (e) => {
      if (e.target.id === 'supplier') this.renderPanel();
      if (e.target.matches('[data-qty]')) this.updateQuote(e.target.dataset.qty);
    });
    this.modal.addEventListener('input', (e) => {
      if (!e.target.matches('[data-volume]')) return;
      const channel = e.target.dataset.volume;
      this.audio.setVolume(channel, Number(e.target.value) / 100);
      document.querySelector(`#audio-value-${channel}`).textContent = `${e.target.value}%`;
    });
  }
  result(result) {
    this.toast(result.ok ? '완료했어요.' : result.message, result.ok ? 'good' : 'warning');
    return result.ok;
  }
  action(action, id) {
    const g = this.game;
    if (this.editor.handle(action, id)) {
      this.update();
      return;
    }
    if (action === 'restock') {
      this.result(g.restock(id));
    } else if (action === 'order') {
      const quantity = Number(document.querySelector(`[data-qty="${id}"]`).value),
        supplier = document.querySelector('#supplier').value;
      if (this.result(g.order(id, quantity, supplier))) this.renderPanel();
    } else if (action === 'hire') {
      if (this.result(g.hire(id))) this.renderPanel();
    } else if (action === 'pop') {
      if (this.result(g.installPOP(id))) this.renderPanel();
    } else if (action === 'price') {
      const input = document.querySelector(`[data-price="${id}"]`);
      if (this.result(g.setPrice(id, Number(input.value)))) this.renderPanel();
    } else if (action === 'save') this.save();
    else if (action === 'load') {
      this.editor.finish(false);
      this.load();
      this.renderPanel();
    } else if (action === 'sound') {
      this.audio.unlock();
      this.audio.enabled = !this.audio.enabled;
      this.renderPanel();
    } else if (action === 'sound-test') {
      this.audio.unlock().then((ok) => {
        if (!ok) this.toast(this.audio.status, 'warning');
        else if (!this.audio.play('test'))
          this.toast('전체 음소거를 해제하고 전체·효과음 음량을 올려주세요.', 'warning');
      });
    } else if (action === 'nextday') {
      g.nextDay();
      this.closePanel();
      this.save(true);
    } else if (action === 'close-day') {
      g.close();
      this.closePanel();
    } else if (action === 'restock-all') {
      let count = 0;
      for (const p of PRODUCTS) if (g.restock(p.id).ok) count++;
      this.toast(
        count ? `${count}종의 진열 업무를 추가했어요.` : '진열이 필요하거나 가능한 상품이 없어요.',
      );
    } else if (action === 'priority') {
      g.s.priorities[id] = g.s.priorities[id] === 10 ? 1 : g.s.priorities[id] + 1;
      for (const t of g.s.tasks) if (!t.assigned && t.type === id) t.priority = g.s.priorities[id];
      this.renderPanel();
    }
    this.update();
  }
  updateQuote(id) {
    const q = this.game.quote(
      id,
      Number(document.querySelector(`[data-qty="${id}"]`)?.value),
      document.querySelector('#supplier')?.value,
    );
    const target = document.querySelector(`[data-quote="${id}"]`);
    if (target && q) target.textContent = Number.isFinite(q.cost) ? money(q.cost) : '수량 확인';
  }
  update() {
    const s = this.game.s;
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== String(text)) el.textContent = text;
    };
    set('day-label', `DAY ${String(s.day).padStart(2, '0')}`);
    const date = new Date(Date.UTC(2020, 0, 5 + s.day));
    set(
      'date-label',
      `${date.getUTCFullYear()}. ${String(date.getUTCMonth() + 1).padStart(2, '0')}. ${String(date.getUTCDate()).padStart(2, '0')}`,
    );
    set(
      'time-label',
      `${String(Math.floor(s.time / 60)).padStart(2, '0')}:${String(Math.floor(s.time % 60)).padStart(2, '0')}`,
    );
    set('cash-label', money(s.cash));
    document.querySelector('.level-badge b').textContent = String(s.level).padStart(2, '0');
    document.querySelector('.level-badge span').textContent = `${this.game.building.area}평 약국`;
    document.querySelector('#rep-label').innerHTML =
      `${Math.floor(s.reputation)} <small>/ 100</small>`;
    set(
      'phase-label',
      { ready: '개점 준비', open: '영업 중', closing: '마감 중', summary: '영업 종료' }[s.phase],
    );
    set('store-status', s.phase === 'open' ? 'OPEN' : 'CLOSED');
    set('goal-progress', `${Math.min(s.stats.served, 5)} / 5`);
    set('goal-check', s.stats.served >= 5 ? '✓' : '○');
    document.querySelector('#goal-bar').style.width = `${Math.min(s.stats.served / 5, 1) * 100}%`;
    set('revenue-label', money(s.stats.revenue));
    set('served-label', `${s.stats.served} 명`);
    set(
      'waiting-label',
      `${s.customers.filter((c) => ['queue', 'shelfwait'].includes(c.state)).length} 명${this.game.crowd.outside ? ` · 밖 ${this.game.crowd.outside}` : ''}`,
    );
    set('rx-label', `${s.stats.prescriptions} 건`);
    set('task-count', s.tasks.length);
    set('auto-toggle', `자동 배정 ${s.auto ? 'ON' : 'OFF'}`);
    set('staff-action', s.phase === 'ready' ? '개점 준비 중' : s.staff[0].action);
    const audioStatus = document.querySelector('#audio-status'),
      audioMeter = document.querySelector('#audio-meter');
    if (audioStatus) audioStatus.textContent = this.audio.status;
    if (audioMeter) audioMeter.value = this.audio.level;
    set('news-label', `${this.game.crisisStage.name} · ${NEWS[s.newsIndex]}`);
    set(
      'scene-caption',
      s.phase === 'ready'
        ? '문을 열면, 오늘의 이야기가 시작됩니다.'
        : `${s.staff.length}명의 직원 · 실내 ${this.game.crowd.inside}/${this.game.crowd.capacity}명 · 외부 ${this.game.crowd.outside}명 · ${s.phase === 'open' ? '오늘도 정성을 담아' : '하루를 마무리하는 중'}`,
    );
    const open = document.querySelector('#open-button');
    open.querySelector('span').textContent = {
      ready: '약국 문 열기',
      open: '오늘 영업 마감',
      closing: '손님 응대 중…',
      summary: '오늘의 정산 보기',
    }[s.phase];
    open.disabled = s.phase === 'closing';
    open.classList.toggle('is-open', s.phase === 'open');
    document
      .querySelectorAll('[data-speed]')
      .forEach((b) => b.classList.toggle('active', Number(b.dataset.speed) === s.speed));
    const tasks = [...s.tasks].sort((a, b) => b.priority - a.priority).slice(0, 4);
    const signature = JSON.stringify(tasks.map((t) => [t.id, t.assigned, t.step, t.priority]));
    if (signature !== this.lastTasks) {
      this.lastTasks = signature;
      document.querySelector('#task-list').innerHTML = tasks.length
        ? tasks
            .map(
              (t) =>
                `<button class="task-item ${t.assigned ? 'working' : ''}" data-task="${t.id}"><span class="task-icon ${t.type}">${icon(taskIcons[t.type], 18)}</span><span class="task-copy"><b>${taskNames[t.type]}</b><small>${t.assigned ? '직원이 처리 중' : t.product ? PRODUCT[t.product].name : '응답을 기다려요'}</small></span><span class="task-state">${t.assigned ? '진행' : t.priority >= 100 ? '우선' : '대기'}</span></button>`,
            )
            .join('')
        : `<div class="empty-tasks">${icon('check', 27)}<b>${s.phase === 'ready' ? '영업 준비가 되었어요' : '모든 일이 순조로워요'}</b><span>${s.phase === 'ready' ? '약국 문을 열고 첫 손님을 맞이하세요.' : '손님이 오면 할 일이 여기에 나타나요.'}</span></div>`;
    }
    if (s.phase === 'summary' && this.summaryShown !== s.day) {
      this.summaryShown = s.day;
      this.showPanel('summary');
      this.save(true);
    }
    this.updateContext();
  }
  worldLabels() {
    const s = this.game.s;
    const entries = [];
    const firstOutside = s.customers.find((c) => c.state === 'outside');
    if (firstOutside) {
      const p = this.world.project(firstOutside.x, 2, firstOutside.z);
      if (p.visible)
        entries.push({
          x: p.x,
          y: p.y,
          html: `<span class="bubble">입장 대기 ${this.game.crowd.outside}명 · 차례대로 안내해요</span>`,
        });
    }
    for (const c of s.customers
      .filter((c) => ['queue', 'service', 'browse'].includes(c.state))
      .slice(0, firstOutside ? 2 : 5)) {
      const point = this.world.project(c.x, 1.9, c.z);
      if (!point.visible) continue;
      const text =
        c.state === 'service'
          ? '응대 중'
          : c.state === 'browse'
            ? '어디 있을까?'
            : c.purpose === 'prescription'
              ? '처방전 부탁해요'
              : c.purpose === 'consult'
                ? c.product === 'mask'
                  ? '마스크 있나요?'
                  : '잠깐 여쭤볼게요'
                : '계산해주세요';
      entries.push({
        x: point.x,
        y: point.y,
        html: `<span class="bubble ${c.patience < 35 ? 'angry' : ''}">${c.patience < 35 ? '… ' : c.purpose === 'prescription' ? '✚ ' : ''}${text}</span>`,
      });
    }
    for (const staff of s.staff) {
      if (staff.action === '대기' || staff.action === '이동') continue;
      const p = this.world.project(staff.x, 1.95, staff.z);
      if (p.visible)
        entries.push({
          x: p.x,
          y: p.y,
          html: `<span class="work-bubble"><i></i>${esc(staff.action)}</span>`,
        });
    }
    const placed = [];
    this.labels.innerHTML = entries
      .map((e) => {
        let y = e.y;
        for (const p of placed)
          if (Math.abs(p.x - e.x) < 130 && Math.abs(p.y - y) < 34) y = p.y - 36;
        placed.push({ x: e.x, y });
        return `<div class="world-label" style="left:${e.x}px;top:${y}px">${e.html}</div>`;
      })
      .join('');
  }
  select(selection) {
    if (selection?.type === 'place') {
      this.editor.commit(selection);
      return;
    }
    this.selected = selection;
    this.updateContext();
  }
  updateContext() {
    const el = document.querySelector('#context-panel'),
      s = this.game.s,
      selected = this.selected;
    if (!selected) {
      el.innerHTML = '';
      return;
    }
    if (selected.type === 'furniture') {
      const p = s.placements.find((p) => p.id === selected.id);
      if (!p) {
        this.selected = null;
        el.innerHTML = '';
        return;
      }
      const f = FURNITURE[p.kind];
      el.innerHTML = `<div class="context-card"><span class="tiny-caps">STORE FURNITURE</span><h3>${f.name}</h3><p>${f.description}</p><div class="context-edit"><button data-action="move-furniture" data-id="${p.id}">이동</button><button data-action="rotate-furniture" data-id="${p.id}">↻ 회전</button><button data-action="sell-furniture" data-id="${p.id}">판매 ${money(f.cost / 2)}</button></div></div>`;
    } else if (selected.type === 'shelf') {
      const list = PRODUCTS.filter((p) => p.zone === selected.zone);
      el.innerHTML = `<div class="context-card"><div class="section-title"><h3>${ZONES[selected.zone].label}</h3><button class="text-button" data-panel="inventory">전체 재고 →</button></div>${list.map((p) => `<div class="context-row"><span class="product-dot" style="background:${p.color}"></span><span>${p.name}</span><b>${s.inventory[p.id].shelf}<small> / ${p.capacity}</small></b><button data-action="restock" data-id="${p.id}" title="${p.name} 재진열">＋</button></div>`).join('')}</div>`;
      el.querySelector('.context-card').insertAdjacentHTML(
        'beforeend',
        `<div class="context-edit"><button data-action="move-shelf" data-id="${selected.zone}">위치 변경</button><button data-action="rotate-shelf" data-id="${selected.zone}">↻ 90° 회전</button></div>`,
      );
    } else {
      const e = [...s.staff, ...s.customers].find((e) => e.id === selected.id);
      if (!e) {
        this.selected = null;
        el.innerHTML = '';
        return;
      }
      el.innerHTML = `<div class="context-card"><span class="tiny-caps">${e.role ? 'OUR TEAM' : 'CUSTOMER'}</span><h3>${esc(e.name || e.profile)}</h3><p>${e.role ? `${ROLES[e.role].name} · ${e.action}` : `${e.purpose === 'prescription' ? '처방전' : PRODUCT[e.product].name} · ${e.state === 'shelfwait' ? '매대 이용 대기' : e.state === 'outside' ? '외부 입장 대기' : e.state === 'queue' ? '대기 중' : e.state === 'exit' ? '돌아가는 중' : '이용 중'}`}</p>${e.role ? '' : `<div class="patience"><i style="width:${Math.max(0, Math.min(100, (e.patience / 170) * 100))}%"></i></div><small>기다린 시간 ${Math.floor(e.wait)}초</small>`}</div>`;
    }
  }
  toast(message, type = 'good') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${type === 'warning' ? '!' : '✓'}</span>${esc(message)}`;
    document.querySelector('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 4300);
  }
  saleEffect(revenue) {
    if (!revenue) return;
    const point = this.world.project(-0.7, 1.8, -0.6);
    const effect = document.createElement('div');
    effect.className = 'cash-effect';
    effect.style.left = point.x + 'px';
    effect.style.top = point.y + 'px';
    effect.textContent = '+ ' + money(revenue);
    document.querySelector('#app').appendChild(effect);
    setTimeout(() => effect.remove(), 1800);
  }
  showPanel(name) {
    this.panel = name;
    this.filter = 'all';
    this.previousFocus = document.activeElement;
    this.renderPanel();
    this.modal.querySelector('[data-close]')?.focus();
  }
  closePanel() {
    this.panel = null;
    this.modal.innerHTML = '';
    this.previousFocus?.focus?.();
  }
  renderPanel() {
    if (!this.panel) return;
    const s = this.game.s,
      panel = this.panel;
    const supplier = document.querySelector('#supplier')?.value || 'standard';
    const titles = {
      order: ['SUPPLY & DELIVERY', '필요한 만큼, 미리 채우기'],
      inventory: ['INVENTORY', '한눈에 보는 우리 약국 재고'],
      dispensing: ['PRESCRIPTIONS', '정성을 담아 조제하는 중'],
      staff: ['OUR TEAM', '함께하면, 조금 더 여유롭게'],
      build: ['MAKE IT YOURS', '우리 약국을 더 편안하게'],
      stats: ['DAILY INSIGHTS', '숫자로 돌아보는 오늘'],
      news: ['NEIGHBORHOOD NEWS', '약국 밖의 이야기'],
      settings: ['SETTINGS', '내게 맞는 운영 환경'],
      summary: ['A DAY WELL SPENT', '오늘도, 수고했어요.'],
      closing: ['CLOSING TIME', '오늘 영업을 마칠까요?'],
    };
    const [kicker, title] = titles[panel];
    let body = '';
    if (panel === 'order')
      body = `<p class="modal-lead">입고된 상자는 정리한 뒤 창고 재고가 됩니다. 창고 예약 ${this.game.committedStorage} / ${this.game.storageCapacity}개 (배송 예정 포함)</p><div class="supplier-select"><label for="supplier">공급업체</label><select id="supplier">${SUPPLIERS.map((v) => `<option value="${v.id}" ${v.id === supplier ? 'selected' : ''}>${v.name} — ${v.desc}</option>`).join('')}</select><span>현재 자금 <b>${money(s.cash)}</b></span></div><div class="table-scroll"><table><thead><tr><th>상품</th><th>매대 / 창고</th><th>매입 단가</th><th>공급 / 배송</th><th>수량</th><th>발주 금액</th><th></th></tr></thead><tbody>${PRODUCTS.map(
        (p) => {
          const q = this.game.quote(p.id, 1, supplier),
            inv = s.inventory[p.id];
          return `<tr><td><span class="product-chip" style="--product:${p.color}"></span><b>${p.name}</b><small>${p.category}</small></td><td>${inv.shelf} / ${inv.warehouse}</td><td>${money(q.cost)}</td><td>오늘 ${q.limit} / ${q.dailyLimit}개<small>게임 ${Math.ceil(q.eta)}초 후</small></td><td><input aria-label="${p.name} 발주 수량" type="number" min="${q.limit ? 1 : 0}" max="${q.limit}" step="1" value="${Math.min(12, q.limit)}" ${q.limit ? '' : 'disabled'} data-qty="${p.id}"></td><td data-quote="${p.id}">${money(q.cost * Math.min(12, q.limit))}</td><td><button class="small-button" data-action="order" data-id="${p.id}" ${q.limit ? '' : 'disabled'}>${q.limit ? '발주' : '오늘 소진'}</button></td></tr>`;
        },
      ).join('')}</tbody></table></div><h3 class="subheading">배송 현황</h3>${
        s.orders
          .filter((o) => o.status !== 'stored')
          .map(
            (o) =>
              `<div class="delivery-row">${icon('box')}<b>${PRODUCT[o.product].name} × ${o.quantity}</b><span>${o.status === 'transit' ? `배송 중 · 약 ${Math.max(0, Math.ceil(o.eta))}초` : '도착 · 상자 정리 대기'}</span></div>`,
          )
          .join('') || '<p class="muted">현재 배송 중인 발주가 없어요.</p>'
      }`;
    if (panel === 'inventory')
      body = `<div class="panel-toolbar"><p>매대에서 집은 상품은 결제 전까지 ‘손님 보유’로 표시됩니다.</p><button class="small-button" data-action="restock-all">부족한 매대 모두 채우기</button></div><div class="table-scroll"><table><thead><tr><th>상품</th><th>진열</th><th>창고</th><th>손님 보유</th><th>판매</th><th>판매가</th><th></th></tr></thead><tbody>${PRODUCTS.map(
        (p) => {
          const i = s.inventory[p.id];
          return `<tr><td><span class="product-chip" style="--product:${p.color}"></span><b>${p.name}</b><small>${p.category}</small></td><td><span class="${i.shelf < 3 ? 'low-stock' : ''}">${i.shelf} / ${p.capacity}</span></td><td>${i.warehouse}</td><td>${i.held}</td><td>${i.sold}</td><td><div class="price-input"><input type="number" aria-label="${p.name} 판매가" min="${p.cost}" max="${p.price * 3}" value="${s.prices[p.id]}" data-price="${p.id}"><button data-action="price" data-id="${p.id}" title="가격 적용">✓</button></div></td><td><button class="small-button secondary" data-action="restock" data-id="${p.id}">재진열</button></td></tr>`;
        },
      ).join('')}</tbody></table></div>`;
    if (panel === 'dispensing')
      body = `<p class="modal-lead">접수 → 컴퓨터 입력 → 약 찾기 → 조제 → 포장 → 전달. 약사가 직접 이동하며 처리합니다.</p><div class="rx-flow">${['접수', '입력', '약 찾기', '조제', '포장', '전달'].map((a, i) => `<div><span>0${i + 1}</span><b>${a}</b></div>`).join('')}</div>${
        s.tasks
          .filter((t) => t.type === 'prescription')
          .map(
            (t) =>
              `<div class="delivery-row">${icon('pill')}<b>처방전 ${esc(t.customer)}</b><span>${t.assigned ? t.steps[t.step]?.action : '접수 대기'}</span></div>`,
          )
          .join('') ||
        '<div class="large-empty">✚<h3>대기 중인 처방전이 없어요.</h3><p>처방 고객이 오면 약사가 순서대로 응대합니다.</p></div>'
      }<div class="notice">오늘 조제 완료 <b>${s.stats.prescriptions}건</b> · 조제 업무는 약사만 담당할 수 있어요.</div>`;
    if (panel === 'staff')
      body = `<p class="modal-lead">직원을 고용하면 업무를 나눠 맡습니다. 급여는 매일 마감할 때 지급됩니다.</p><div class="staff-list">${s.staff.map((st) => `<div class="staff-profile"><span class="large-avatar">${st.role === 'pharmacist' ? '✚' : '☺'}</span><div><h3>${st.name}</h3><p>${ROLES[st.role].name} · ${st.action}</p></div><b>${st.id === 'player' ? '대표 약사' : money(ROLES[st.role].salary) + ' / 일'}</b></div>`).join('')}</div><div class="hire-grid">${Object.entries(
        ROLES,
      )
        .map(
          ([id, r]) =>
            `<article><span class="tiny-caps">NEW TEAMMATE</span><h3>${r.name}</h3><p>${id === 'pharmacist' ? '처방 · 상담 · 계산' : id === 'cashier' ? '계산 · 입고 · 진열' : '입고 · 진열 전담'}</p><b>${money(r.salary)} <small>/ 일</small></b><button class="small-button" data-action="hire" data-id="${id}" ${s.staff.length >= this.game.building.staff ? 'disabled' : ''}>채용 ${money(r.cost)}</button></article>`,
        )
        .join(
          '',
        )}</div><h3 class="subheading">업무 우선순위</h3><p class="muted">숫자가 높을수록 먼저 처리합니다. 클릭하면 1–10 순환합니다.</p><div class="priority-grid">${Object.keys(
        s.priorities,
      )
        .map(
          (type) =>
            `<button data-action="priority" data-id="${type}">${taskNames[type]}<b>${s.priorities[type]}</b></button>`,
        )
        .join('')}</div>`;
    if (panel === 'build') body = buildingPanel(this.game);
    if (panel === 'stats' || panel === 'summary') {
      const summary = panel === 'summary',
        st = summary ? s.history.at(-1) || s.stats : s.stats,
        profit = st.revenue - st.cogs - st.expenses;
      body = `${summary ? `<p class="modal-lead">DAY ${s.day} · 조용한 동네에, 당신 덕분에 조금 더 건강한 하루가 쌓였어요.</p>` : ''}<div class="summary-hero"><div><span>${summary ? '오늘의 총매출' : '현재 매출'}</span><strong>${money(st.revenue)}</strong></div><div><span>${summary ? '영업 순이익' : '영업 이익 · 고정비 정산 전'}</span><strong class="${profit < 0 ? 'negative' : ''}">${money(profit)}</strong></div></div><div class="summary-grid">${[
        ['응대한 손님', `${st.served}명`],
        ['조제 완료', `${st.prescriptions}건`],
        ['판매한 상품', `${st.units}개`],
        ['평균 대기', `${st.served ? Math.round(st.waitTotal / st.served) : 0}초`],
        ['놓친 손님', `${st.lost}명`],
        ['매출 원가', money(st.cogs)],
        ['임대료 · 인건비', money(st.expenses)],
        ['동네 평판', Math.floor(s.reputation) + ' / 100'],
      ]
        .map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`)
        .join(
          '',
        )}</div><div class="day-quote"><span>오늘 가장 많이 들은 말</span><p>“${st.questions ? '잠깐 여쭤볼게요.' : '감사합니다. 또 올게요!'}”</p><small>하루의 작은 순간들이, 우리 동네 약국을 만듭니다.</small></div>${summary ? '<button class="primary-button" data-action="nextday">다음 날 준비하기 ' + icon('arrow') + '</button>' : `<div class="notice">지출한 발주 대금은 자금에서 즉시 빠집니다. 순이익에는 판매된 상품의 매입원가만 반영합니다.</div>`}`;
    }
    if (panel === 'news')
      body = `${crisisPanel(this.game)}<div class="news-feature"><span class="tiny-caps">LOCAL NEWS · DAY ${s.day}</span><h2>${NEWS[s.newsIndex]}</h2></div><h3 class="subheading">지난 소식</h3>${NEWS.slice(
        0,
        s.newsIndex + 1,
      )
        .reverse()
        .map(
          (n, i) =>
            `<div class="news-row"><span>DAY ${s.newsIndex + 1 - i}</span><p>${n}</p></div>`,
        )
        .join('')}`;
    if (panel === 'settings')
      body = `<div class="settings-row"><div><h3>현재 게임 저장</h3><p>이 브라우저에 저장합니다. 30초마다 자동 저장됩니다.</p></div><button class="small-button" data-action="save">${icon('save', 16)} 저장하기</button></div><div class="settings-row"><div><h3>저장한 게임 불러오기</h3><p>마지막 저장 시점으로 돌아갑니다.</p></div><button class="small-button secondary" data-action="load">불러오기</button></div>${audioPanel(this.audio)}<h3 class="subheading">편하게 둘러보기</h3><div class="shortcut-grid"><span>확대 / 축소</span><kbd>마우스 휠</kbd><span>화면 이동</span><kbd>우클릭 드래그</kbd><span>90° 회전</span><kbd>Q / E</kbd><span>일시정지</span><kbd>Space</kbd><span>창 닫기 / 배치 취소</span><kbd>Esc</kbd></div><p class="build-note">SOLD OUT · 생존약국 0.7 · 로컬 3D 경영 게임<br>이 게임은 가상의 상품과 단순화한 약국 업무를 사용합니다.</p>`;
    if (panel === 'closing')
      body =
        '<p class="modal-lead">새 손님의 입장을 멈추고, 약국에 남은 손님까지 응대한 뒤 정산합니다.</p><button class="primary-button" data-action="close-day">영업 마감 시작</button>';
    this.modal.innerHTML = `<div class="modal-backdrop"><section class="modal ${['summary', 'settings', 'closing'].includes(panel) ? 'compact' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><span class="tiny-caps">${kicker}</span><h2 id="modal-title">${title}</h2></div><button class="close-button" data-close aria-label="닫기">${icon('close')}</button></header><div class="modal-body">${body}</div><footer class="modal-footer"><span><i class="live-dot"></i>${s.phase === 'open' ? '영업은 계속되고 있어요. 필요하면 Space로 일시정지하세요.' : '작은 약국, 큰 하루. SOLD OUT'}</span><span>생존약국 · DAY ${s.day}</span></footer></section></div>`;
  }
}
