import { EXPANSIONS, FURNITURE } from './building.js';
import { ZONES, POPS } from './content.js';
const money = (n) => '₩ ' + Math.round(n).toLocaleString('ko-KR');
export function buildingPanel(game) {
  const s = game.s,
    b = game.building,
    next = EXPANSIONS[s.level];
  return `<p class="modal-lead">재고는 그대로, 동선은 더 편하게. 배치 편집 중에는 시간이 자동으로 멈춥니다.</p>
 <div class="building-overview"><div><span class="tiny-caps">SAENGJON PHARMACY · LV.${s.level}</span><h3>${b.name} <b>${b.area}평</b></h3><p>창고 ${game.committedStorage} / ${game.storageCapacity}개 <span>·</span> 직원 ${s.staff.length} / ${b.staff}명 <span>·</span> 임대료 ${money(b.rent)} / 일</p></div><button class="small-button" data-action="edit-layout">배치 편집 시작</button></div>
 <div class="expansion-card"><div><span class="tiny-caps">ROOM TO GROW</span><h3>${next ? `옆 점포까지, ${next.area}평으로` : '확장된 공간을 내 방식대로'}</h3><p>${next ? `창고 ${next.storage}개 · 직원 ${next.staff}명 · 임대료 ${money(next.rent)}/일<br>현재 시설·재고·직원은 모두 유지됩니다.` : '준비된 세 단계의 확장을 마쳤어요. 매대를 옮겨 효율적인 동선을 만들어보세요.'}</p></div>${next ? `<button class="small-button" data-action="expand">${money(next.cost)} · 확장</button>` : '<span class="stage-complete">Lv. 3 · 확장 완료</span>'}</div>
 <div class="section-title subheading"><h3>매대 배치</h3><span class="muted">이동 · 회전 무료</span></div><div class="layout-shelves">${s.layout.shelves.map((p) => `<div class="layout-shelf"><span class="shelf-swatch" style="--shelf-color:${ZONES[p.zone].color}"></span><div><b>${ZONES[p.zone].label}</b><small>상품 5종 · 방향 ${p.rotation * 90}°</small></div><button class="small-button secondary" data-action="move-shelf" data-id="${p.zone}">이동</button><button class="square-button" data-action="rotate-shelf" data-id="${p.zone}" aria-label="${ZONES[p.zone].label} 회전">↻</button></div>`).join('')}</div>
 <h3 class="subheading">공간을 채우는 가구</h3><div class="furniture-catalog">${Object.values(
   FURNITURE,
 )
   .map(
     (f) =>
       `<article><div class="furniture-illustration ${f.id}"><i></i><i></i><i></i></div><h3>${f.name}</h3><p>${f.description}</p><button class="small-button" data-action="place" data-id="${f.id}">${money(f.cost)} · 놓기</button></article>`,
   )
   .join('')}</div>
 ${s.placements.length ? `<h3 class="subheading">설치한 가구 <small>판매 시 구입가의 50% 반환</small></h3><div class="placed-list">${s.placements.map((p) => `<div><b>${FURNITURE[p.kind].name}</b><span>방향 ${p.rotation * 90}°</span><button class="small-button secondary" data-action="move-furniture" data-id="${p.id}">이동</button><button class="square-button" data-action="rotate-furniture" data-id="${p.id}" aria-label="가구 회전">↻</button><button class="text-button" data-action="sell-furniture" data-id="${p.id}">판매 ${money(FURNITURE[p.kind].cost / 2)}</button></div>`).join('')}</div>` : ''}
 <h3 class="subheading">설명을 대신하는 POP</h3><div class="pop-grid">${POPS.map((p) => `<article class="pop-card"><div class="pop-preview">${p.text}</div><h3>${p.name}</h3><p>${p.desc}</p><button class="small-button ${s.pop.includes(p.id) ? 'secondary' : ''}" data-action="pop" data-id="${p.id}" ${s.pop.includes(p.id) ? 'disabled' : ''}>${s.pop.includes(p.id) ? '✓ 설치됨' : money(p.price) + ' · 설치'}</button></article>`).join('')}</div>
 <p class="build-note">매대와 구입한 가구를 편집할 수 있어요. 카운터·조제실·출입문은 현재 고정 시설입니다.</p>`;
}
export class LayoutEditor {
  constructor(ui) {
    this.ui = ui;
    this.game = ui.game;
    this.world = ui.world;
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'editor-toolbar';
    ui.root.appendChild(this.toolbar);
  }
  enter() {
    this.ui.closePanel();
    if (!this.world.editing) {
      this.previousSpeed = this.game.s.speed;
      this.game.s.speed = 0;
      this.world.editing = true;
    }
    this.render();
  }
  finish(save = true) {
    if (!this.world.editing) return;
    this.cancel();
    this.world.editing = false;
    this.game.s.speed = this.previousSpeed ?? 1;
    this.toolbar.innerHTML = '';
    if (save) this.ui.save(true);
    this.ui.update();
  }
  cancel() {
    this.world.setPlacement(null);
    this.render();
  }
  begin(placement) {
    this.enter();
    this.world.setPlacement(placement);
    this.ui.selected = null;
    this.world.selected = null;
    this.ui.updateContext();
    this.render();
  }
  render() {
    if (!this.world.editing) {
      this.toolbar.innerHTML = '';
      return;
    }
    const p = this.world.placing;
    this.toolbar.innerHTML = `<div class="editor-head"><span class="editor-live">Ⅱ 편집 중</span><b>${p ? (p.kind === 'shelf' ? ZONES[p.zone].label : FURNITURE[p.kind].name) : '가구를 선택해 배치를 바꿔보세요'}</b><span class="editor-grid">0.5m GRID</span></div><div class="editor-actions"><span id="placement-status">${p ? '놓을 바닥을 선택하세요. 초록색은 가능, 빨간색은 불가합니다.' : '매대를 클릭하거나 매장 화면에서 가구를 고르세요.'}</span>${p ? '<button data-action="rotate-placement">↻ 회전 <kbd>R</kbd></button><button data-action="cancel-placement">취소 <kbd>Esc</kbd></button>' : '<button data-panel="build">가구 고르기</button>'}<button class="editor-done" data-action="finish-edit">편집 완료</button></div>`;
  }
  commit(point) {
    const p = this.world.placing;
    if (!p) return;
    const transform = { x: point.x, z: point.z, rotation: p.rotation };
    const result =
      p.kind === 'shelf'
        ? this.game.editShelf(p.zone, transform)
        : p.id
          ? this.game.moveFurniture(p.id, transform)
          : this.game.place(point.x, point.z, p.kind, p.rotation);
    if (this.ui.result(result)) {
      this.cancel();
      this.ui.update();
    } else this.world.updatePreview();
  }
  handle(action, id) {
    if (action === 'edit-layout') {
      this.enter();
      return true;
    }
    if (action === 'finish-edit') {
      this.finish();
      return true;
    }
    if (action === 'cancel-placement') {
      this.cancel();
      return true;
    }
    if (action === 'rotate-placement') {
      this.world.rotatePlacement();
      return true;
    }
    if (action === 'place') {
      this.begin({ kind: id || 'plant', rotation: 0 });
      return true;
    }
    if (action === 'move-shelf') {
      const p = this.game.s.layout.shelves.find((p) => p.zone === Number(id));
      if (p) this.begin({ ...p, kind: 'shelf' });
      return true;
    }
    if (action === 'move-furniture') {
      const p = this.game.s.placements.find((p) => p.id === id);
      if (p) this.begin({ ...p });
      return true;
    }
    if (action === 'rotate-shelf') {
      const p = this.game.s.layout.shelves.find((p) => p.zone === Number(id));
      if (p) {
        this.enter();
        this.ui.result(this.game.editShelf(p.zone, { ...p, rotation: (p.rotation + 1) % 4 }));
      }
      return true;
    }
    if (action === 'rotate-furniture') {
      const p = this.game.s.placements.find((p) => p.id === id);
      if (p) {
        this.enter();
        this.ui.result(this.game.moveFurniture(id, { ...p, rotation: (p.rotation + 1) % 4 }));
      }
      return true;
    }
    if (action === 'sell-furniture') {
      if (this.ui.result(this.game.sellFurniture(id))) {
        this.ui.selected = null;
        this.ui.renderPanel();
      }
      return true;
    }
    if (action === 'expand') {
      if (this.ui.result(this.game.expand())) this.ui.renderPanel();
      return true;
    }
    return false;
  }
}
