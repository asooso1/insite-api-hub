# Phase 2 작업 계획서

**작성일**: 2026-01-23
**기반 문서**: [Phase 1 작업 계획](./phase1-work-plan.md)
**범위**: UI Visual Overhaul + Git Webhooks + Field-level DTO Diff + Auto Assertions

---

## 1. 요구사항 정의

### 1.1 UI Visual Overhaul (3D Effects & Enhanced Animations)

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| UI-3D-01 | 3D Card Tilt Effect | 높음 | 마우스 위치에 따른 3D 기울기 효과 (perspective + rotateX/Y) |
| UI-3D-02 | Parallax Depth Layers | 높음 | 스크롤에 따른 다층 깊이감 효과 |
| UI-3D-03 | Card Flip Animation | 중간 | 앞/뒤면 전환 애니메이션 (테스트 결과 상세) |
| UI-3D-04 | Depth Shadows | 높음 | 다층 그림자로 입체감 표현 |
| UI-3D-05 | Floating Elements | 중간 | 미세한 떠다니는 효과 (Hero 섹션) |

### 1.2 Design System Expansion

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| DS-01 | 3D Transform Utilities | 높음 | Framer Motion 3D variants 추가 |
| DS-02 | Interactive Cards | 높음 | Tilt3DCard 컴포넌트 생성 |
| DS-03 | Micro-interactions | 중간 | 버튼 ripple, 입력 focus 효과 강화 |
| DS-04 | Color Gradients | 중간 | 다이나믹 그라디언트 배경 |

### 1.3 Git Webhook Integration

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| GW-01 | GitHub Webhook Endpoint | 높음 | POST /api/webhooks/github 수신 |
| GW-02 | Push Event 처리 | 높음 | push 이벤트 시 자동 재스캔 트리거 |
| GW-03 | Signature 검증 | 높음 | HMAC-SHA256 서명 검증 |
| GW-04 | Auto Version Snapshot | 중간 | 커밋마다 버전 스냅샷 자동 생성 |
| GW-05 | Change Notification | 중간 | API 변경 시 Dooray 알림 |

### 1.4 Field-level DTO Diff

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| DF-01 | Deep DTO Comparison | 높음 | 중첩 객체 필드별 비교 |
| DF-02 | Type Change Detection | 높음 | 타입 변경 감지 (String→Number) |
| DF-03 | Breaking Change Alert | 높음 | 호환성 깨지는 변경 하이라이트 |
| DF-04 | Visual Diff Tree | 중간 | 확장 가능한 트리 뷰 diff |
| DF-05 | Change Severity | 중간 | BREAKING/MINOR/PATCH 분류 |

### 1.5 Auto Assertion Generation

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| AS-01 | JSON Schema 생성 | 높음 | DTO → JSON Schema 변환 |
| AS-02 | Response Validation | 높음 | 응답 구조 자동 검증 |
| AS-03 | Type Assertions | 중간 | 필드 타입 검증 (email, date, etc.) |
| AS-04 | SLA Assertions | 중간 | 응답시간 임계값 검증 |
| AS-05 | Contract Testing | 낮음 | DTO 계약 기반 테스트 |

---

## 2. 작업 분해 구조 (WBS)

### Sprint 5: 3D Visual Effects (예상 2-3일)

```
UI-3D-01: 3D Card Tilt Effect
├── UI-3D-01-1: useTilt3D 훅 생성
├── UI-3D-01-2: Tilt3DCard 컴포넌트
├── UI-3D-01-3: Dashboard 카드에 적용
└── UI-3D-01-4: Settings 조절 (감도, 최대 각도)

UI-3D-02: Enhanced Depth System
├── UI-3D-02-1: 다층 그림자 유틸리티
├── UI-3D-02-2: Parallax 스크롤 훅
└── UI-3D-02-3: Floating animation variants

DS-01: Design System 확장
├── DS-01-1: 3D Transform variants 추가
├── DS-01-2: Gradient 유틸리티
└── DS-01-3: Ripple 효과 컴포넌트
```

### Sprint 6: Git Webhook Integration (예상 2-3일)

```
GW-01: Webhook Endpoint
├── GW-01-1: /api/webhooks/github 라우트
├── GW-01-2: HMAC-SHA256 서명 검증
├── GW-01-3: Webhook secret 설정 UI
└── GW-01-4: 이벤트 로깅

GW-02: Auto Sync
├── GW-02-1: Push event 파싱
├── GW-02-2: 저장소 재스캔 트리거
├── GW-02-3: 버전 스냅샷 자동 생성
└── GW-02-4: 변경 알림 전송
```

### Sprint 7: Field-level DTO Diff (예상 3-4일)

```
DF-01: Deep Comparison
├── DF-01-1: 재귀적 필드 비교 로직
├── DF-01-2: FieldDiff 타입 정의
├── DF-01-3: 중첩 객체 처리
└── DF-01-4: 배열 타입 비교

DF-02: Change Classification
├── DF-02-1: Breaking change 규칙 정의
├── DF-02-2: Severity 계산 로직
└── DF-02-3: 호환성 분석

DF-03: Visual Diff Tree
├── DF-03-1: DtoFieldDiffTree 컴포넌트
├── DF-03-2: 확장/축소 인터랙션
├── DF-03-3: 색상 코딩 (add/remove/modify)
└── DF-03-4: 타입 변경 표시
```

### Sprint 8: Auto Assertions (예상 2-3일)

```
AS-01: Schema Generation
├── AS-01-1: DTO → JSON Schema 변환기
├── AS-01-2: 필드 타입 매핑
└── AS-01-3: Required/Optional 처리

AS-02: Response Validation
├── AS-02-1: Ajv 스키마 검증 통합
├── AS-02-2: 검증 오류 포맷팅
└── AS-02-3: Assertion 결과 UI

AS-03: Smart Assertions
├── AS-03-1: 필드명 기반 검증 규칙
├── AS-03-2: SLA 검증 로직
└── AS-03-3: Assertion 설정 UI
```

---

## 3. 기술 설계

### 3.1 3D Card Tilt Effect

```typescript
// hooks/useTilt3D.ts
interface Tilt3DOptions {
  maxTilt?: number;        // 기본 15도
  perspective?: number;    // 기본 1000px
  scale?: number;          // hover 시 scale, 기본 1.02
  speed?: number;          // 전환 속도 ms, 기본 300
  glare?: boolean;         // 광택 효과
}

function useTilt3D(options: Tilt3DOptions): {
  ref: RefObject<HTMLDivElement>;
  style: MotionStyle;
  handlers: { onMouseMove, onMouseLeave };
}
```

### 3.2 GitHub Webhook Payload

```typescript
// app/api/webhooks/github/route.ts
interface GitHubPushEvent {
  ref: string;              // "refs/heads/main"
  before: string;           // 이전 커밋 SHA
  after: string;            // 새 커밋 SHA
  repository: {
    full_name: string;      // "owner/repo"
    clone_url: string;
  };
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
}
```

### 3.3 Field-level Diff Types

```typescript
interface FieldDiff {
  path: string[];           // ["user", "address", "city"]
  type: 'ADD' | 'DELETE' | 'MODIFY' | 'TYPE_CHANGE';
  severity: 'BREAKING' | 'MINOR' | 'PATCH';
  before?: {
    type: string;
    required: boolean;
    value?: any;
  };
  after?: {
    type: string;
    required: boolean;
    value?: any;
  };
}

interface DtoDiff {
  dtoName: string;
  fields: FieldDiff[];
  summary: {
    breaking: number;
    minor: number;
    patch: number;
  };
}
```

### 3.4 Auto Assertion Schema

```typescript
interface AssertionRule {
  id: string;
  type: 'status' | 'schema' | 'field' | 'timing';
  config: StatusAssertion | SchemaAssertion | FieldAssertion | TimingAssertion;
}

interface SchemaAssertion {
  jsonSchema: JSONSchema7;
  strict: boolean;          // 추가 필드 허용 여부
}

interface FieldAssertion {
  path: string;             // "data.user.email"
  rule: 'required' | 'type' | 'pattern' | 'range';
  expected: any;
}

interface TimingAssertion {
  maxResponseTime: number;  // ms
  p95Threshold?: number;
}
```

---

## 4. 산출물 목록

### Sprint 5 산출물
- `src/hooks/useTilt3D.ts` - 3D 기울기 효과 훅
- `src/components/ui/Tilt3DCard.tsx` - 3D 카드 컴포넌트
- `src/components/ui/ParallaxSection.tsx` - 패럴랙스 섹션
- `src/lib/design-system.ts` - 3D variants 추가

### Sprint 6 산출물
- `src/app/api/webhooks/github/route.ts` - GitHub webhook 엔드포인트
- `src/lib/webhook-verification.ts` - HMAC 서명 검증
- `src/app/actions/webhook.ts` - Webhook 처리 액션
- `src/components/settings/WebhookSettings.tsx` - Webhook 설정 UI

### Sprint 7 산출물
- `src/lib/dto-diff.ts` - 필드별 DTO 비교 로직
- `src/lib/breaking-changes.ts` - Breaking change 규칙
- `src/components/DtoFieldDiffTree.tsx` - 트리 형태 diff UI
- `src/components/ApiDiffViewer.tsx` - 기존 컴포넌트 확장

### Sprint 8 산출물
- `src/lib/schema-generator.ts` - DTO → JSON Schema 변환
- `src/lib/assertion-validator.ts` - 응답 검증 로직
- `src/components/AssertionBuilder.tsx` - Assertion 설정 UI
- `src/components/TestDashboard.tsx` - Assertion 결과 표시 확장

---

## 5. 변경 이력

| 일시 | 내용 | 담당 |
|------|------|------|
| 2026-01-23 | Phase 2 작업 계획 수립 | Claude (Ralph) |
| 2026-01-23 | Sprint 5-8 구현 완료 | Claude |
| 2026-01-23 | Phase 2 완료 | Claude |

---

## 다음 단계

1. [x] Phase 2 작업 계획 수립
2. [x] Sprint 5 완료 - 3D Visual Effects
3. [x] Sprint 6 완료 - Git Webhook Integration
4. [x] Sprint 7 완료 - Field-level DTO Diff
5. [x] Sprint 8 완료 - Auto Assertions
6. [x] **Phase 2 완료** ✅
