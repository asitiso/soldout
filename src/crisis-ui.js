import { CRISIS_STAGES, stageForDay } from './crisis.js';

export function crisisPanel(game) {
  const s = game.s,
    current = game.crisisStage,
    next = CRISIS_STAGES[stageForDay(s.day + 1)];
  return `<section class="crisis-board" aria-label="위기 현황">
 <div class="crisis-heading"><span class="tiny-caps">생존약국 · DAY ${s.day}</span><span class="crisis-badge">단계 ${s.crisis + 1} / 10</span></div>
 <h2>${current.name}</h2><p>${current.advice}</p>
 <div class="crisis-timeline">${CRISIS_STAGES.map((st, i) => `<span class="${i === s.crisis ? 'current' : i < s.crisis ? 'past' : ''}" title="${st.name}"></span>`).join('')}</div>
 <div class="crisis-metrics"><div><small>위생용품 기본 수요</small><b>×${current.demand.toFixed(1)}</b></div><div><small>위생용품 매입가</small><b>×${current.cost.toFixed(2)}</b></div><div><small>배송 소요 시간</small><b>×${current.delivery.toFixed(1)}</b></div><div><small>위생용품 공급 물량</small><b>${Math.round(current.supply * 100)}%</b></div></div>
 <p class="crisis-footnote">평시 대비 지수 · 실제 수요에는 판매가와 POP가 추가 반영됩니다. 배송 시간은 모든 상품에 적용됩니다.</p>
 <div class="crisis-forecast"><span>내일의 운영 예보</span><h3>${next.name}</h3><p>위생용품 수요 ×${next.demand.toFixed(1)} · 공급 ${Math.round(next.supply * 100)}% · 방문량 ×${next.traffic.toFixed(1)}</p></div>
 <div class="crisis-actions"><button class="small-button" data-panel="order">공급 물량 확인</button><button class="small-button secondary" data-panel="inventory">재고 점검</button><button class="small-button secondary" data-panel="staff">업무 분담</button></div>
 </section>`;
}
