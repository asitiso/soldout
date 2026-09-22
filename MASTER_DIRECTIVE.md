# SOLD OUT

## Pharmacy Management Crisis Tycoon

### MASTER DEVELOPMENT DIRECTIVE v1.0

---

# 0. 프로젝트의 절대 목표

`SOLD OUT`은 작은 1인 약국에서 시작하여 약국을 운영하고 성장시키는 3D 경영 시뮬레이션 게임이다.

게임 초반에는 평범한 동네약국 운영으로 시작한다.

플레이어는 혼자서 다음 업무를 처리한다.

* 처방전 접수
* 조제
* 복약 안내
* 일반의약품 상담
* 일반상품 판매
* 계산
* 상품 진열
* 재고 관리
* 발주
* 입고
* 전화 응대
* 매장 관리

시간이 지나면서 감염병 확산이라는 대형 이벤트가 발생한다.

마스크, 손소독제, 체온계, 감기 관련 상품 등의 수요가 급격하게 증가하고 공급망이 흔들리면서 평범했던 약국은 극심한 혼잡 상태에 들어간다.

플레이어는

`작은 1인 약국 → 성장하는 동네약국 → 직원이 있는 중형 약국 → 지역 대형 약국`

으로 발전한다.

그러나 이 게임의 목표는 단순히 큰 약국을 만드는 것이 아니다.

핵심 경험은 다음과 같다.

**평범했던 작은 약국이 세상의 변화 때문에 점점 바빠지고, 플레이어가 직접 운영 방식을 개선하면서 혼란을 통제하는 경험.**

---

# 1. 가장 중요한 개발 원칙

## 1.1 프로토타입용 임시 구조를 만들지 않는다

이 프로젝트에서 가장 중요한 규칙이다.

초기 구현이라고 해서 다음과 같은 형태로 만들지 않는다.

* 회색 박스만 배치
* 캡슐 NPC
* 숫자만 변하는 재고
* 버튼만 있는 상점
* 텍스트 로그만 출력되는 조제
* 빈 방 같은 약국
* 기능 확인용 임시 UI
* 실제 모델이 없는 상품
* 화면 밖에서 처리되는 고객 행동

첫 플레이 가능한 버전부터 최종 게임의 구조를 사용한다.

다만 콘텐츠의 **양**만 줄인다.

원칙:

> 시스템을 축소하지 않는다.
> 콘텐츠의 양을 축소한다.

예를 들어 최초 빌드의 상품이 15개뿐이어도 Product System 자체는 수백 개 상품을 처리할 수 있어야 한다.

최초 약국이 8평이어도 Building System은 대형 약국까지 확장 가능해야 한다.

최초 화면에 손님이 5명이어도 Customer System은 수십 명의 동시 NPC를 처리할 수 있어야 한다.

---

# 2. 첫 실행부터 게임처럼 보여야 한다

첫 플레이 가능한 빌드부터 다음 요소를 실제 화면에 구현한다.

* 완성된 작은 약국 내부
* 외부 거리 일부
* 유리 출입문
* 자동문 또는 출입문 애니메이션
* 카운터
* POS
* 컴퓨터
* 프린터
* 조제실
* 약장
* 조제대
* 일반약 매대
* 상품 모델
* 상품 박스
* 입고 박스
* 창고 공간
* 벽시계
* TV
* POP
* 의자
* 화분
* 간판
* 약사 캐릭터
* 고객 캐릭터
* NPC 말풍선
* NPC 감정 표현
* 게임 HUD
* 시간 변화
* 조명 변화
* 상품 감소 표현
* 조제 애니메이션
* 계산 애니메이션
* 입고/진열 애니메이션

게임 화면은 콘셉트 아트와 실제 플레이 사이에 큰 차이가 없어야 한다.

---

# 3. Visual Target

그래픽 방향:

**Stylized 3D Cartoon + Low Poly Diorama**

환경은 로우폴리 기반이지만 지나치게 단순해서는 안 된다.

캐릭터는 3~4등신 카툰 스타일을 사용한다.

전체적으로 작은 미니어처 약국을 내려다보는 느낌을 만든다.

Visual Keywords:

* cozy
* colorful
* clean
* readable
* miniature
* diorama
* soft lighting
* rounded shapes
* stylized proportions
* expressive characters
* busy environment
* readable silhouettes

현실적인 PBR 그래픽을 목표로 하지 않는다.

대신 작은 소품과 캐릭터 행동을 풍부하게 사용한다.

---

# 4. 화면 구성

기본 카메라는 45도 전후의 쿼터뷰/아이소메트릭 카메라다.

플레이어가 약국 전체 상황을 한눈에 이해할 수 있어야 한다.

지원:

* Zoom In
* Zoom Out
* Camera Pan
* 90도 단위 Camera Rotation
* Event Focus
* Object Focus

카메라가 벽 뒤로 이동하면 해당 벽은 자동으로 투명화 또는 숨김 처리한다.

줌아웃 상태에서도 다음 정보는 식별 가능해야 한다.

* 고객
* 직원
* 대기줄
* 빈 매대
* 혼잡 구역
* 조제 대기
* 계산 대기
* 감정 상태
* 중요한 이벤트

---

# 5. 게임 시작 연출

새 게임 시작.

Black Screen.

전화벨.

`따르르릉—`

Fade In.

작은 상가 외부를 보여준다.

카메라가 천천히 약국 안으로 이동한다.

작은 약국.

약사 한 명.

화면 표시:

# DAY 1

## 2020년 1월

시작 상태:

자금: ₩5,000,000

직원: 0

약사: 플레이어 1명

평판: 50

약국 레벨: 1

작은 규모의 초기 재고가 이미 진열되어 있다.

게임은 여기서 즉시 시작한다.

---

# 6. 초기 약국

초기 규모:

약 6~8평 상당.

구성:

* 출입문
* 카운터 1
* POS 1
* 조제실
* 조제대 1
* 약장
* 일반약 매대 2~3
* 소형 마스크 진열대
* 소형 창고 공간
* 대기 의자 2~3
* TV 1
* 벽시계
* POP 설치 슬롯
* 화분/생활 소품

약국은 작지만 비어 보이면 안 된다.

"작지만 실제로 운영 중인 약국"처럼 보여야 한다.

---

# 7. Core Gameplay Loop

핵심 루프:

`OPEN`

↓

손님 입장

↓

Needs 생성

↓

상담 / 상품 탐색 / 처방 접수

↓

약사 업무 발생

↓

조제 / 상담 / 계산 / 진열

↓

판매

↓

재고 감소

↓

발주 필요

↓

입고

↓

진열

↓

매출 발생

↓

평판 변화

↓

`CLOSE`

↓

하루 정산

↓

다음 날

---

# 8. 가장 중요한 자원: TIME

돈보다 중요한 자원은 약사의 시간이다.

초기에는 플레이어 혼자 운영한다.

동시에 다음 일이 발생할 수 있다.

* 처방전 3건
* 계산 대기 2명
* 상담 고객 1명
* 전화
* 입고
* 빈 진열대
* 마스크 문의

플레이어는 업무 우선순위를 결정해야 한다.

이것이 직원 고용의 가치를 만든다.

---

# 9. Pharmacist System

약사는 실제 World Character다.

단순한 관리자 UI가 아니다.

상태 예시:

Idle

Walk

ReceivePrescription

UseComputer

SearchMedicine

PickMedicine

Compound

PackageMedicine

PrintLabel

GiveMedicine

CounselCustomer

Checkout

AnswerPhone

CarryBox

RestockShelf

PlacePOP

Clean

약사는 업무 대상까지 실제로 이동해야 한다.

---

# 10. Customer System

모든 고객은 다음 데이터 구조를 가진다.

CustomerProfile:

* ID
* AgeGroup
* AppearanceSet
* VisitPurpose
* Budget
* Patience
* PriceSensitivity
* AdvicePreference
* ProductPreferences
* HealthNeedTags
* CrisisBehavior
* Loyalty
* Satisfaction

---

# 11. 고객 유형

최소 구조:

PrescriptionCustomer

OTCCustomer

SpecificProductCustomer

AdviceCustomer

CrisisCustomer

RegularCustomer

ParentWithChild

ElderlyCustomer

WorkerCustomer

BulkBuyer

유형은 고정 캐릭터 클래스가 아니라 Profile + Need 조합으로 구성한다.

---

# 12. Customer AI State Machine

Customer AI:

Enter

↓

DetermineGoal

↓

Navigate

↓

Search

↓

Found?

YES → PickProduct

NO → AskStaff

↓

Queue

↓

Checkout

↓

EvaluateExperience

↓

Exit

특수 경로:

Prescription

Enter

↓

PrescriptionCounter

↓

Submit

↓

Wait

↓

ReceiveMedicine

↓

Exit

---

# 13. Patience System

고객마다 Patience 값을 가진다.

대기 시간이 증가하면:

Happy

↓

Neutral

↓

Impatient

↓

Angry

↓

Leave

표정과 Body Animation이 함께 변해야 한다.

UI 숫자를 보지 않아도 고객 상태를 이해할 수 있어야 한다.

---

# 14. NPC Visual Feedback

NPC 머리 위에 필요한 경우 작은 World UI를 표시한다.

예:

💊 처방

❓ 질문

😷 마스크

💳 계산

🙂 만족

😐 대기

😡 불만

중요한 질문은 Speech Bubble을 사용한다.

예:

"마스크 있나요?"

"어린이용 있나요?"

"감기약 어디 있어요?"

"얼마나 기다려야 하나요?"

Speech Bubble을 너무 많이 동시에 표시하여 화면을 가리지 않도록 Priority System을 구현한다.

---

# 15. NPC Appearance Generator

NPC가 반복적으로 보이지 않도록 Modular Character System을 구축한다.

Parts:

* Body
* Face
* Hair
* Top
* Bottom
* Shoes
* Bag
* Hat
* Glasses
* Mask
* Accessory

색상 Variation 지원.

같은 조합의 NPC가 연속해서 생성되지 않도록 한다.

---

# 16. Product System

상품은 Data Driven 방식으로 구현한다.

ProductDefinition:

* ProductID
* DisplayName
* Category
* PurchasePrice
* BaseSellPrice
* CurrentSellPrice
* PackageSize
* ShelfFootprint
* StockAmount
* DemandTags
* SeasonTags
* EventTags
* SupplierIDs
* WorldModel
* ShelfModel
* BoxModel
* Icon
* Popularity
* PriceElasticity

코드에 개별 상품 로직을 하드코딩하지 않는다.

---

# 17. 초기 상품 카테고리

초기부터 최소 다음 카테고리를 지원한다.

* 감기약
* 해열진통제
* 소화제
* 알레르기
* 파스
* 상처관리
* 비타민
* 마스크
* 손소독제
* 체온계
* 위생용품

최초 콘텐츠 수는 제한해도 된다.

시스템은 확장 가능해야 한다.

---

# 18. Physical Inventory

재고는 숫자로만 존재해서는 안 된다.

세 단계로 나눈다.

WarehouseStock

ShelfStock

CustomerHeldStock

상품이 판매되면 진열대에서 실제 모델이 사라진다.

재고가 줄어들수록 매대가 비어 보인다.

품절되면 완전히 빈 진열대가 나타난다.

---

# 19. Shelf System

Shelf는 Slot 기반으로 만든다.

Shelf

→ Section

→ Slot

각 Slot에는 ProductDefinition을 할당한다.

Slot은 다음 정보를 가진다.

ProductID

Capacity

CurrentAmount

FacingCount

DisplayStyle

손님이 상품을 가져가면 World Model을 제거한다.

직원이 진열하면 다시 생성한다.

---

# 20. Supplier System

공급업체는 독립 Entity다.

SupplierDefinition:

* SupplierID
* Name
* ProductCatalog
* BasePriceModifier
* Reliability
* DeliverySpeed
* MinimumOrder
* CrisisSensitivity
* Relationship

발주 UI에서 공급업체별 조건을 비교할 수 있다.

---

# 21. 발주

발주 화면에서 표시:

상품명

현재 매장재고

창고재고

최근 판매량

매입가

판매가

공급 가능 수량

배송 예정일

주문 수량

총 주문금액

위기 상황에서는 공급량과 가격이 변한다.

---

# 22. Delivery

배송이 단순히 Inventory 숫자로 들어오면 안 된다.

배송 차량 또는 배송 이벤트 발생.

박스가 실제 약국으로 들어온다.

📦

박스는 창고 공간을 차지한다.

약사 또는 직원이 박스를 이동하고 정리한다.

공간이 부족하면 박스가 통로를 방해할 수 있다.

---

# 23. Prescription System

PrescriptionDefinition:

* PrescriptionID
* MedicationList
* Complexity
* BaseProcessingTime
* CounselingTime
* Reward
* PatientType

처방전 접수 후 실제 업무 Task가 생성된다.

---

# 24. 조제 Gameplay

약사는:

접수

→ 컴퓨터

→ 약장

→ 약 선택

→ 조제대

→ 포장

→ 라벨

→ 검수

→ 전달

순서로 실제 행동한다.

후반에 시설과 직원을 업그레이드하면 과정이 빨라진다.

---

# 25. Queue System

각 ServicePoint는 Queue를 가진다.

PrescriptionQueue

CheckoutQueue

ConsultationQueue

CrisisQueue

줄은 실제 NPC 위치로 표현한다.

Queue가 길어질수록 공간을 차지한다.

매장 Layout이 Queue 효율에 영향을 준다.

---

# 26. Store Building System

약국은 하나의 고정 Scene이 아니다.

Grid 기반 Building System을 구축한다.

기본 Grid:

0.5m × 0.5m 상당.

지원 Object:

Wall

Door

Window

Counter

Shelf

MedicineCabinet

StorageShelf

Chair

TV

Decoration

POP

QueueBarrier

Lighting

InteractiveObject

---

# 27. Expansion

약국 확장은 새로운 Scene 로딩이 아니다.

기존 공간 자체를 확장한다.

예:

LV1 8평

↓

옆 점포 계약

↓

벽 철거

↓

16평

↓

추가 확장

↓

25평

↓

40평+

기존에 배치한 시설과 재고는 유지된다.

---

# 28. Placement System

매장 꾸미기 모드 지원.

Object 선택

↓

Ghost Preview

↓

Valid Placement Check

↓

Rotate

↓

Place

Pathfinding을 막는 배치는 경고한다.

핵심 업무 공간이 완전히 차단되는 배치는 금지한다.

---

# 29. POP SYSTEM

POP는 SOLD OUT의 핵심 시스템이다.

단순 장식이 아니다.

POPDefinition:

* ID
* MessageType
* Range
* Effect
* EffectStrength
* VisualTemplate
* PlacementType

예:

"마스크 품절"

→ MaskQuestionFrequency 감소

"1인 3개 한정"

→ QuantityQuestion 감소

"감기약 이쪽"

→ SearchTime 감소

"처방전 먼저 접수해주세요"

→ QueueError 감소

즉 POP는 직원 설명 업무를 자동화하는 장비다.

---

# 30. Demand Simulation

각 상품의 수요:

BaseDemand

×

SeasonModifier

×

WeatherModifier

×

NewsModifier

×

EventModifier

×

PriceModifier

×

LocalPopulationModifier

×

ReputationModifier

×

AvailabilityModifier

로 계산한다.

정확한 수식은 밸런스 데이터로 조정 가능하게 만든다.

---

# 31. News System

NewsEvent:

* ID
* Headline
* Description
* StartDate
* Duration
* DemandEffects
* SupplyEffects
* CustomerBehaviorEffects
* WorldEffects
* FollowupEvents

뉴스는 TV와 UI를 통해 전달한다.

뉴스가 단순 텍스트 이벤트가 아니라 실제 시뮬레이션을 변경해야 한다.

---

# 32. Crisis System

감염병은 Event Chain으로 구성한다.

Phase 0

Normal

Phase 1

Rumor

Phase 2

Concern

Phase 3

Demand Surge

Phase 4

Shortage

Phase 5

Panic

Phase 6

Regulation

Phase 7

Supply Recovery

Phase 8

Oversupply

Phase 9

Normalization

각 단계가 수요, 공급, NPC 행동, 뉴스, 가격, Queue를 변화시킨다.

---

# 33. 첫 마스크 문의 연출

초반 어느 날.

고객 한 명이 입장한다.

😷

약사에게 접근.

Speech Bubble:

"마스크 있나요?"

별도의 거대한 튜토리얼 팝업을 띄우지 않는다.

플레이어가 자연스럽게 변화의 시작을 느끼게 한다.

---

# 34. 첫 SOLD OUT 연출

마스크 마지막 상품 판매.

진열대가 비어버린다.

카메라가 짧게 해당 진열대로 이동한다.

짧은 Audio Sting.

진열대 위:

# SOLD OUT

약 1초 강조.

그 후 일반 게임으로 복귀.

이 연출은 게임 제목과 시스템을 연결하는 중요한 순간이다.

---

# 35. Crisis Crowd

위기 단계에서는 개점 전부터 고객이 외부에 생성될 수 있다.

밖에 실제 Queue가 형성된다.

08:50

10명

08:55

18명

08:59

27명

09:00

문이 열린다.

NPC들이 순차적으로 입장한다.

한꺼번에 서로 겹치지 않도록 Crowd Navigation을 구현한다.

---

# 36. Staff System

직원 유형:

Pharmacist

Assistant

Cashier

Stocker

Manager

직원 Stat:

Speed

Accuracy

CustomerService

Stocking

Checkout

Stamina

Salary

Experience

---

# 37. Task System

모든 업무를 공통 Task 구조로 통합한다.

Task:

* Type
* Priority
* Target
* RequiredRole
* Duration
* Deadline
* Interruptible
* Reward
* Penalty

예:

PrescriptionTask

CheckoutTask

RestockTask

ConsultTask

PhoneTask

DeliveryTask

CleaningTask

POPTask

직원 AI는 Task Queue에서 업무를 가져간다.

---

# 38. Task Priority

플레이어는 역할별 우선순위를 설정할 수 있다.

예:

약사:

Prescription 10

Consultation 8

Checkout 4

Stocking 1

직원:

Checkout 10

Stocking 8

Delivery 6

Cleaning 2

이 시스템으로 대규모 약국도 직접 NPC 하나하나 클릭하지 않고 운영 가능하게 한다.

---

# 39. Economy

관리:

Cash

Revenue

COGS

Salary

Rent

Utility

InventoryValue

Waste

Profit

Loan

초기에는 경제 UI를 지나치게 복잡하게 노출하지 않는다.

깊은 통계는 별도 화면에서 제공한다.

---

# 40. Reputation

Reputation은 고객 유입과 단골 형성에 영향을 준다.

증가:

빠른 서비스

적절한 상담

합리적 가격

재고 안정성

친절

감소:

긴 대기

품절

과도한 가격

상담 실패

불친절

---

# 41. Regular Customer

좋은 경험을 한 고객은 일정 확률로 단골이 된다.

단골 NPC는 외형과 기본 Profile을 유지한다.

다시 방문했을 때 알아볼 수 있어야 한다.

작은 약국에서 "동네약국" 느낌을 만드는 핵심 요소다.

---

# 42. Day Cycle

1게임일:

약 10~15분 목표.

단, 게임 속도:

Pause

1x

2x

3x

지원.

시간대별 방문 패턴을 지원한다.

---

# 43. 하루 종료

영업 종료 후 Summary 화면.

표시:

오늘 매출

순이익

처방전 수

일반상품 판매

방문 고객

평균 대기시간

고객 만족도

품절 상품

폐기/손실

신규 단골

평판 변화

---

# 44. Daily Humor

결과 화면에:

### 오늘 가장 많이 들은 말

예:

"마스크 있어요?" ×47

"얼마나 기다려요?" ×18

같은 통계를 표시한다.

게임의 긴장을 가볍게 풀어주는 장치다.

---

# 45. Campaign Structure

ACT 1 — SMALL PHARMACY

1인 약국 운영.

ACT 2 — WARNING SIGNS

이상한 뉴스와 수요 변화.

ACT 3 — SOLD OUT

마스크 대란과 공급 부족.

ACT 4 — CHAOS MANAGEMENT

고객 폭증, 직원 관리, 새로운 판매 규칙.

ACT 5 — RECOVERY

공급 증가.

ACT 6 — OVERSUPPLY

과잉 재고.

ACT 7 — NEW NORMAL

약국 정상화 및 장기 경영.

---

# 46. 코로나 이후 구조

게임 전체를 특정 질병 하나에 종속시키지 않는다.

Event Framework를 통해 이후 추가 가능:

독감

꽃가루

폭염

장마

한파

명절

개학

지역축제

주변 병원 개원

주변 병원 폐업

경쟁약국 등장

제품 품귀

신제품 유행

건강기능식품 유행

이벤트 콘텐츠는 데이터 추가만으로 확장 가능해야 한다.

---

# 47. World Simulation

WorldManager

├ Calendar

├ Time

├ Weather

├ Economy

├ Event

├ News

├ Demand

└ LocalArea

약국 밖의 상황이 약국 안의 고객 행동을 변화시킨다.

---

# 48. UI STRUCTURE

Main HUD:

좌측 상단:

SOLD OUT

날짜

시간

날씨

우측 상단:

Cash

Reputation

Pharmacy Level

Customer Count

우측:

Current Tasks / Goals

하단:

발주

재고

조제

직원

매장꾸미기

통계

뉴스

설정

UI가 게임 화면을 과도하게 가리지 않도록 한다.

---

# 49. Context UI

캐릭터나 물체를 클릭하면 Context Panel 표시.

Shelf 클릭:

상품

진열수량

창고수량

가격

최근 판매량

재진열 요청

Customer 클릭:

목적

현재 상태

기다린 시간

만족도

Staff 클릭:

현재 업무

우선순위

피로도

Skill

---

# 50. Audio Design

Ambient:

약국 실내음

거리 소리

에어컨

작은 음악

Interaction:

자동문

발걸음

상품 집기

박스

키보드

프린터

POS

전화

약봉투

Customer Crowd:

낮은 웅성거림을 인원수에 따라 Dynamic하게 증가시킨다.

---

# 51. Music

Normal Day:

편안한 Lo-Fi/Light Acoustic 느낌.

Busy:

Tempo Layer 추가.

Crisis:

Percussion 및 긴장 Layer 추가.

음악 자체가 완전히 바뀌기보다 Layer가 추가되어 자연스럽게 혼잡도가 느껴지게 한다.

---

# 52. Lighting

Morning

Day

Evening

Closing

시간에 따라 외부 조명과 창문 색온도가 변화한다.

실내는 따뜻하고 밝게 유지한다.

캐릭터와 상품 식별성이 최우선이다.

---

# 53. Animation Requirements

Character 기본 Animation Set:

Idle

Walk

FastWalk

Carry

PickUp

PutDown

Talk

Point

SearchShelf

Checkout

Type

Phone

Compound

Package

HandOver

Happy

Confused

Impatient

Angry

Sit

Stand

Door Interaction

모든 업무가 애니메이션 없이 즉시 처리되지 않도록 한다.

---

# 54. Performance

최종 목표:

동시 NPC 50+

수백 개 Shelf Product Mesh

다수의 World UI

Task AI

Pathfinding

를 안정적으로 처리한다.

필요한 경우:

Object Pooling

NPC LOD

Animation LOD

World UI Distance Culling

Product Mesh Instancing

를 사용한다.

초기부터 성능 구조를 고려한다.

---

# 55. Navigation

NavMesh 또는 이에 준하는 Navigation System 사용.

Dynamic Obstacle 지원.

매대 배치 변경 후 Navigation을 갱신한다.

Queue Position은 별도 Queue Node System을 사용한다.

---

# 56. SAVE SYSTEM

저장 대상:

Date

Time

Cash

Reputation

BuildingLayout

Furniture

ShelfAssignments

Inventory

Orders

Staff

CustomerRegulars

CampaignState

Events

News

Statistics

POP

Prices

Save Versioning을 처음부터 지원한다.

---

# 57. DATA ARCHITECTURE

코드와 콘텐츠를 분리한다.

Definitions:

ProductDefinition

SupplierDefinition

CustomerProfile

StaffDefinition

FurnitureDefinition

POPDefinition

NewsDefinition

EventDefinition

PrescriptionDefinition

MissionDefinition

UpgradeDefinition

데이터 추가 때문에 핵심 코드를 수정하는 일을 최소화한다.

---

# 58. SYSTEM ARCHITECTURE

전체 구조:

Game

├ Core

│ ├ GameManager

│ ├ SaveManager

│ ├ TimeManager

│ └ EventBus

│

├ World

│ ├ Calendar

│ ├ Weather

│ ├ News

│ └ Crisis

│

├ Pharmacy

│ ├ Building

│ ├ Placement

│ ├ Shelf

│ ├ Storage

│ ├ Counter

│ └ Expansion

│

├ Character

│ ├ Pharmacist

│ ├ Staff

│ ├ Customer

│ └ Appearance

│

├ AI

│ ├ CustomerAI

│ ├ StaffAI

│ ├ Navigation

│ ├ Queue

│ └ TaskSystem

│

├ Commerce

│ ├ Product

│ ├ Inventory

│ ├ Supplier

│ ├ Order

│ ├ Pricing

│ └ Economy

│

├ PharmacyWork

│ ├ Prescription

│ ├ Dispensing

│ ├ Consultation

│ └ Checkout

│

├ Simulation

│ ├ Demand

│ ├ Reputation

│ ├ Events

│ └ Statistics

│

├ Presentation

│ ├ Camera

│ ├ UI

│ ├ WorldUI

│ ├ Animation

│ ├ Audio

│ └ VFX

│

└ Content

├ Products

├ Customers

├ Suppliers

├ Events

└ Missions

---

# 59. Event Driven Architecture

시스템 간 직접 의존성을 최소화한다.

예:

ProductSold

ShelfEmpty

CustomerEntered

CustomerLeft

PrescriptionReceived

PrescriptionCompleted

OrderPlaced

DeliveryArrived

DayStarted

DayEnded

NewsPublished

CrisisPhaseChanged

ReputationChanged

등을 EventBus로 전달한다.

---

# 60. 최초 콘텐츠 세트

첫 플레이 가능한 버전에 최소:

상품 15개

고객 Appearance 20개 이상 조합

고객 Archetype 8개

처방전 유형 10개

Supplier 3개

POP 8개

News Event 15개

Furniture 15종

약국 Expansion 3단계

직원 역할 3종

을 준비한다.

단, 시스템은 최종 규모를 기준으로 설계한다.

---

# 61. 최초부터 구현해야 하는 VISUAL POLISH

다음을 "나중 작업"으로 미루지 않는다.

Soft Shadow

Ambient Occlusion

캐릭터 표정

상품 모델 Variation

매대 Empty State

Box Visual

Speech Bubble

Emotion Icon

Door Animation

Cash Feedback

Floating Number

Shelf Highlight

Selection Outline

Placement Ghost

Queue Visualization

TV Animation

Clock Animation

Day/Night Lighting

---

# 62. VFX

VFX는 절제해서 사용한다.

판매:

작은 Coin/Revenue Feedback

Level Up:

Star Burst

SOLD OUT:

짧은 강조 Effect

Reputation Up:

Heart/Smile

Angry Customer:

작은 Stress Effect

게임 분위기를 해칠 정도의 과도한 모바일게임 이펙트는 사용하지 않는다.

---

# 63. Tutorial

거대한 설명창을 연속해서 띄우지 않는다.

첫날 플레이를 통해 자연스럽게 학습한다.

첫 손님:

계산

↓

첫 처방:

조제

↓

매대 부족:

진열

↓

재고 부족:

발주

↓

입고:

창고

순서로 기능을 소개한다.

---

# 64. First 10 Minutes Experience

첫 10분 안에 반드시 경험:

1. 약국 문 열기
2. 첫 손님 입장
3. 상품 판매
4. 첫 처방전
5. 약사가 직접 조제
6. 매대 상품 감소
7. 재진열
8. 발주
9. 배송
10. 하루 마감

플레이어가 10분 후 다음을 이해해야 한다.

"혼자 약국 운영하는 게 생각보다 바쁘다."

---

# 65. 첫 30분 Experience

30분 이내에 작은 이상 신호를 보여준다.

TV:

"해외에서 원인불명 호흡기 질환 환자 증가"

손님:

"마스크 있나요?"

마스크 판매량이 조금 증가한다.

아직 위기는 아니다.

플레이어가 앞으로 벌어질 일을 예상하게 만든다.

---

# 66. 중요한 재미 곡선

게임의 화면 변화 자체가 성장이다.

초반:

조용한 약국.

중반:

손님 증가.

위기:

약국 밖까지 줄.

성장:

직원들이 움직임.

대형 약국:

수십 명이 동시에 움직임.

후반:

운영이 자동화되고 플레이어는 공급망과 전략을 관리.

따라서 약국이 점점 살아 움직이는 모습을 보여주는 것이 가장 중요한 Progression Feedback이다.

---

# 67. 절대 하지 말아야 할 것

다음 방식으로 프로젝트를 축소하지 않는다.

"우선 버튼만 구현"

"우선 Cube로 테스트"

"우선 Inventory UI만 제작"

"그래픽은 나중에"

"NPC는 일단 Capsule"

"조제는 Progress Bar"

"손님은 화면 밖에서 계산"

"매대는 단순 숫자"

이 프로젝트에서는 시스템과 화면 표현을 함께 개발한다.

---

# 68. 단, 과도한 디테일도 피한다

반대로 재미에 거의 영향을 주지 않는 실제 약국 업무를 지나치게 세밀하게 구현하지 않는다.

판단 기준:

**이 기능이 플레이어의 판단을 만들거나 화면에서 재미있는 상황을 만드는가?**

아니라면 단순화한다.

예를 들어 약 조제의 모든 현실적 세부 절차를 재현하기보다

`약장 찾기 → 조제 → 포장 → 전달`

이라는 읽기 쉬운 게임 행동으로 압축한다.

현실성보다 운영 재미와 가독성을 우선한다.

---

# 69. 개발 순서

시스템 하나를 완성하고 다음 시스템으로 넘어가는 방식보다 Vertical Slice 방식으로 개발한다.

## Vertical Slice 1

완성된 작은 약국

약사

손님

상품

진열

계산

처방

조제

시간

HUD

사운드

애니메이션

하루 종료

모두 연결.

## Vertical Slice 2

발주

배송

창고

재진열

가격

공급업체.

## Vertical Slice 3

POP

상담

Queue

Patience

Reputation.

## Vertical Slice 4

뉴스

수요 변화

마스크 문의

품절.

## Vertical Slice 5

감염병 Crisis.

## Vertical Slice 6

직원

Task Priority

자동화.

## Vertical Slice 7

Building Expansion.

## Vertical Slice 8

대형 약국.

각 Slice에서도 시각적 완성도를 유지한다.

---

# 70. 첫 번째 Milestone

첫 Milestone 완료 조건:

작은 약국을 실제로 하루 운영할 수 있어야 한다.

플레이어가:

문을 연다.

↓

손님이 실제 문으로 들어온다.

↓

매대를 탐색한다.

↓

상품을 실제로 집는다.

↓

카운터에 줄을 선다.

↓

약사가 계산한다.

↓

돈이 증가한다.

↓

상품 모델이 매대에서 감소한다.

↓

다른 고객이 처방전을 낸다.

↓

약사가 약장으로 이동한다.

↓

조제한다.

↓

약을 전달한다.

↓

재고가 부족해진다.

↓

발주한다.

↓

박스가 도착한다.

↓

상품을 진열한다.

↓

저녁이 된다.

↓

문을 닫는다.

↓

Daily Summary가 나온다.

이 전체 과정이 끊김 없이 연결되어야 한다.

---

# 71. QUALITY BAR

Milestone을 완료했다고 판단하는 기준은

"기능이 작동한다."

가 아니다.

다음 질문으로 판단한다.

### 화면만 봐도 작은 약국을 혼자 운영하고 있다는 느낌이 드는가?

YES가 되어야 Milestone 완료다.

---

# 72. 대표 화면 목표

초기:

작은 약국.

약사 1명.

고객 2~5명.

따뜻하고 여유로운 분위기.

후기:

대형 약국.

직원 여러 명.

고객 30~50명.

밖까지 Queue.

빈 마스크 매대.

입고 박스.

전화.

조제 대기.

계산 대기.

TV 뉴스.

Speech Bubble.

Emotion Icons.

이 모든 것이 한 화면에서 동시에 읽혀야 한다.

---

# 73. 최종 목표 장면

08:55.

약국 안에서 직원들이 마스크를 진열한다.

밖에 30명 이상이 기다린다.

TV:

"마스크 공급 부족 지속"

창고:

KF94 ×327

오늘 예상수요:

1,240

전화가 울린다.

공급업체:

"KF94 2,000장 확보했습니다."

현재 자금:

₩2,910,000

08:59.

약국 직원들이 준비한다.

09:00.

문이 열린다.

`띵동—`

고객들이 들어온다.

약사들이 움직인다.

계산대에 줄이 생긴다.

전화가 다시 울린다.

말풍선:

"마스크 있어요?"

"몇 개까지 살 수 있어요?"

"어린이용 있어요?"

마스크 재고가 빠르게 감소한다.

마지막 상품 판매.

카메라가 빈 진열대를 잡는다.

# SOLD OUT

이 장면이 실제 Gameplay에서 자연스럽게 발생할 수 있도록 모든 시스템을 설계한다.

---

# 74. 구현 전 선행 작업

코드를 작성하기 전에 현재 프로젝트가 존재한다면 전체 구조를 먼저 분석한다.

그 후 다음 문서를 프로젝트 내부에 생성한다.

`MASTER_PLAN.md`

`ARCHITECTURE.md`

`VISUAL_TARGET.md`

`DATA_SCHEMA.md`

`GAMEPLAY_LOOP.md`

`MILESTONES.md`

`ART_REQUIREMENTS.md`

`CONTENT_PLAN.md`

문서만 작성하고 작업을 종료하지 않는다.

문서 작성 직후 실제 구현을 시작한다.

---

# 75. 구현 중 원칙

매 단계마다:

Analyze

→ Plan

→ Implement

→ Run

→ Inspect

→ Fix

→ Polish

→ Test

순환한다.

코드를 작성했다는 이유로 완료 처리하지 않는다.

실제 게임을 실행하여 화면과 행동을 확인한다.

---

# 76. Visual Verification

각 Vertical Slice 완료 후 반드시 실제 게임 화면을 실행하여 검증한다.

확인:

약국이 너무 비어 보이지 않는가?

카메라 구도가 좋은가?

NPC가 작아서 안 보이지 않는가?

상품이 구분되는가?

Queue가 읽히는가?

말풍선이 겹치지 않는가?

UI가 약국을 가리지 않는가?

조명이 지나치게 어둡지 않은가?

애니메이션이 행동을 명확히 전달하는가?

콘셉트 이미지 수준의 밀도와 분위기에 가까워지고 있는가?

문제가 있으면 즉시 수정한다.

---

# 77. Placeholder Replacement Rule

Placeholder가 필요한 경우 임시로 사용할 수 있다.

하지만 해당 Vertical Slice가 완료되기 전에 사용자에게 보이는 주요 Placeholder는 반드시 실제 Asset으로 교체한다.

특히 다음은 Placeholder 상태로 Milestone을 통과할 수 없다.

약사

고객

카운터

매대

상품

조제실

박스

POP

주요 HUD

---

# 78. 개발 보고 방식

작업 후 단순히

"구현했습니다."

라고 보고하지 않는다.

매 작업마다 다음을 보고한다.

**이번에 실제로 플레이 가능한 변화**

**화면에서 달라진 부분**

**추가된 시스템**

**테스트한 내용**

**발견하여 수정한 문제**

**현재 실제 게임에서 가능한 행동**

**다음으로 연결되는 작업**

가능하면 실제 실행 화면을 함께 확인한다.

---

# 79. 자율적인 개선

명령서에 명시되지 않았더라도 게임을 실제로 플레이했을 때 명백하게 필요한 작은 개선은 스스로 추가한다.

단, 새로운 대형 시스템을 무분별하게 추가하지 않는다.

판단 기준:

1. 플레이가 확실히 편해지는가?
2. 화면에서 상황을 이해하기 쉬워지는가?
3. 반복 작업을 줄이는가?
4. 게임의 핵심 재미를 강화하는가?
5. 유지보수 복잡도보다 효과가 충분히 큰가?

단순히 기능 수를 늘리기 위한 기능은 추가하지 않는다.

---

# 80. 최종 개발 철학

SOLD OUT은 Excel 화면 위에서 숫자를 관리하는 게임이 아니다.

플레이어가 약국을 바라보면서

"저 손님 오래 기다리고 있네."

"감기약 매대가 비었네."

"계산대가 밀리고 있네."

"직원이 박스를 아직 못 풀었네."

"마스크 줄이 또 길어졌네."

라고 **화면을 보고 판단하는 게임**이어야 한다.

숫자는 판단을 보조한다.

상황 자체는 3D World에서 보여준다.

따라서 모든 시스템은 가능한 한

**DATA → WORLD BEHAVIOR → VISUAL FEEDBACK → PLAYER DECISION**

순서로 연결한다.

---

# FINAL DIRECTIVE

지금부터 이 프로젝트를 단순한 프로토타입으로 취급하지 말고 실제 출시 가능한 게임의 기반으로 구축한다.

그러나 모든 콘텐츠를 한꺼번에 만드는 것도 금지한다.

전체 아키텍처는 최종 규모를 기준으로 설계하고, Vertical Slice 방식으로 하나의 완전한 플레이 경험씩 확장한다.

첫 번째 목표는 거대한 게임이 아니다.

### "작은 약국 하나가 완전히 살아 움직이는 것."

약사 한 명이 움직이고,

손님이 문을 열고 들어오고,

상품을 찾고,

질문하고,

처방전을 내고,

기다리고,

약사가 조제하고,

계산하고,

상품이 실제로 줄어들고,

택배 박스가 도착하고,

진열대를 다시 채우고,

시계가 흐르고,

저녁이 되어 문을 닫는 것.

이 작은 하루가 충분히 재미있고 아름답게 보이도록 먼저 완성한다.

그리고 동일한 시스템 위에 손님, 직원, 공급망, 뉴스, 감염병, 마스크 대란, 약국 확장을 단계적으로 얹는다.

최종적으로는 처음의 조용한 1인 약국이 수십 명의 고객과 여러 직원이 동시에 움직이는 혼잡한 대형 약국으로 자연스럽게 성장해야 한다.

게임을 실행했을 때 콘셉트 이미지와 실제 플레이 화면 사이에 큰 괴리가 생기지 않도록 **그래픽, 캐릭터 행동, UI, 환경 밀도, 애니메이션, 사운드를 시스템 구현과 동시에 완성한다.**

이 문서를 프로젝트의 최상위 개발 기준으로 사용하고 구현을 시작하라.
