# Data Schema v2

Product: id/name/category/cost/price/color/shape/tags/capacity. Inventory: shelf/warehouse/held/sold, 상품별 분리. 판매 전 집으면 shelf→held, 판매 시 held→sold, 이탈 시 held→shelf/warehouse.

Customer: id/profile/purpose/product/state/x/z/path/patience/maxPatience/wait/held/appearance. Staff: id/role/x/z/task/speed/salary. Task: id/type/customer/product/priority/assigned/steps/step/elapsed. Step: x/z/action/duration.
Customer.state=outside일 때 outsideSlot은 중복 없는 0–31 정수이며 held=false, 연결 업무 없음. 입장 순서는 customers 배열 순서로 보존한다. enter도 실내 예약 인원으로 포함한다. 이전 저장의 초과 실내 인원은 보존하고 자연스럽게 줄어들 때까지 새 입장을 제한한다.
Customer.state=shelfwait는 매대 이용 대기이며 held=false, 연결 업무 없음. destination은 대기 위치다. 같은 zone의 browse/pick 고객이 매대를 사용 중인 것으로 간주하고 차례가 오면 목적지를 매대 앞으로 바꾼다.

Order: id/product/quantity/cost/eta/status/supplier. 입고 상태는 transit→arrived→stored, 물리적 박스 정리 전 창고 재고로 추가하지 않는다.
Order.orderedDay: 1부터 현재 day까지의 정수. 상품/공급업체별 당일 주문 합계를 공급 한도에서 차감한다. 이전 저장의 누락 필드는 불러온 당일로 이전한다. 상태가 stored여도 해당 일자의 공급 물량을 소비한다.

Save: version/state. State contains day/time/cash/reputation/inventory/customers/staff/tasks/orders/placements/pop/prices/stats/history/crisis/seed/level/layout. 저장 검증 후 전체 교체한다.

Layout: shelves[{zone,x,z,rotation}]. Placement: id/kind/x/z/rotation. rotation은 0–3 사분면, kind는 plant/bench/storage. level은 1–3. 확장별 보관량·직원 한도·임대료는 building.js에서 파생한다. 보관량 예약에는 미입고 주문도 포함한다.

v1은 기본 매대 위치와 rotation=0을 추가한다. 동선을 막는 이전 화분은 가장 가까운 유효 위치로 옮기고, 자리가 없으면 전액 환불한다. 현금·재고·업무를 보존한다. 읽기 실패 시 자동 저장을 중단하고 원본을 보존한다. 이후 수동 저장 시 원본을 sold-out-save-v1-recovery 키에 보관한다. 저장 슬롯 이름은 기존 브라우저 데이터와 호환되도록 유지한다.
