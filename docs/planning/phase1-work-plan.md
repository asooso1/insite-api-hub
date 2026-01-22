# Phase 1 작업 계획서

**작성일**: 2026-01-22
**기반 문서**: [UI 현대화 기획 세션](./2026-01-22-ui-modernization-planning.md)
**범위**: API 변경 추적 자동화 + 테스트 환경 자동화

---

## 1. 요구사항 정의

### 1.1 API 변경 추적 자동화

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| CT-01 | Git 저장소 변경 감지 | 높음 | 저장소 재스캔 시 이전 버전과 비교하여 변경사항 자동 감지 |
| CT-02 | Diff 시각화 개선 | 높음 | 엔드포인트 추가/삭제/수정을 색상 코드로 구분하여 표시 |
| CT-03 | 변경 이력 타임라인 | 중간 | 프로젝트별 API 변경 이력을 시간순으로 조회 가능 |
| CT-04 | 변경 알림 (Dooray) | 낮음 | 변경 감지 시 설정된 웹훅으로 알림 전송 |

**범위 외 (Phase 2+)**:
- 실시간 Git webhook 연동
- 필드 레벨 diff (DTO 내부 변경)
- Spring 3.x / Jakarta 지원

### 1.2 테스트 환경 자동화

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| TA-01 | 테스트 케이스 자동 생성 | 높음 | DTO 스키마 기반 샘플 payload 자동 생성 |
| TA-02 | 일괄 테스트 실행 | 높음 | 선택한 테스트 케이스들 순차 실행 + 결과 기록 |
| TA-03 | 테스트 결과 대시보드 | 중간 | 성공/실패 통계 및 최근 실행 이력 표시 |
| TA-04 | 환경별 테스트 실행 | 중간 | DEV/STG/PRD 환경 선택하여 테스트 실행 |

**범위 외 (Phase 2+)**:
- 자동 assertion 생성
- 스케줄 기반 자동 실행
- CI/CD 파이프라인 연동

### 1.3 기반 작업

| ID | 요구사항 | 우선순위 | 수용 기준 |
|----|----------|----------|-----------|
| FD-01 | Zustand 상태관리 전환 | 높음 | 전역 상태(프로젝트, 세션, 설정)를 Zustand로 마이그레이션 |
| FD-02 | Linear.app 스타일 디자인 시스템 | 중간 | 글래스모피즘, 부드러운 전환 효과 적용 |
| FD-03 | 키보드 단축키 시스템 | 낮음 | Cmd/Ctrl + K 검색, 방향키 네비게이션 |

---

## 2. 리스크 분석 및 대응

### 2.1 기술적 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 대용량 저장소 클론 타임아웃 | 높음 | shallow clone (depth=1) 기본 적용, 진행 상태 표시 |
| 순환 참조 DTO 파싱 | 중간 | processingStack으로 감지 + "[순환 참조]" 마커 표시 |
| 동시 사용자 DB 연결 풀 | 중간 | 풀 사이즈 25로 설정 (20명 + 여유분) |
| 테스트 실행 중 대상 서버 과부하 | 중간 | Rate limiting (10 req/sec) 적용 |

### 2.2 범위 리스크

| 리스크 | 대응 방안 |
|--------|-----------|
| Git 인증 방식 확장 요청 | Phase 1은 HTTPS + Token만 지원, SSH는 Phase 2 |
| Spring 3.x 지원 요청 | 명시적으로 Phase 2로 연기, 문서화 |
| 실시간 변경 감지 요청 | 수동 재스캔 방식 유지, 자동화는 Phase 2 |

---

## 3. 작업 분해 구조 (WBS)

### Sprint 1: 기반 작업 (예상 3-4일)

```
FD-01: Zustand 상태관리 전환
├── FD-01-1: Zustand 설치 및 스토어 설계
├── FD-01-2: 프로젝트 상태 스토어 (useProjectStore)
├── FD-01-3: 세션/인증 상태 스토어 (useAuthStore)
├── FD-01-4: UI 상태 스토어 (useUIStore)
└── FD-01-5: 기존 useState 마이그레이션

FD-02: 디자인 시스템 기초
├── FD-02-1: 글래스모피즘 유틸리티 클래스
├── FD-02-2: 애니메이션 variants 정의
└── FD-02-3: 컴포넌트 기본 스타일 업데이트
```

### Sprint 2: API 변경 추적 (예상 4-5일)

```
CT-01: Git 변경 감지
├── CT-01-1: 버전 비교 로직 구현
├── CT-01-2: 변경 유형 분류 (ADD/DELETE/MODIFY)
└── CT-01-3: 변경 요약 데이터 구조

CT-02: Diff 시각화 개선
├── CT-02-1: Split view 컴포넌트 리디자인
├── CT-02-2: Unified view 추가
├── CT-02-3: 필터링 (변경 유형별)
└── CT-02-4: 애니메이션 적용

CT-03: 변경 이력 타임라인
├── CT-03-1: 타임라인 UI 컴포넌트
├── CT-03-2: 버전 간 점프 기능
└── CT-03-3: 변경 통계 표시
```

### Sprint 3: 테스트 자동화 (예상 4-5일)

```
TA-01: 테스트 케이스 자동 생성
├── TA-01-1: DTO 스키마 분석 강화
├── TA-01-2: 타입별 샘플값 생성 규칙
├── TA-01-3: 필수/선택 필드 처리
└── TA-01-4: 중첩 객체 처리

TA-02: 일괄 테스트 실행
├── TA-02-1: 테스트 큐 관리
├── TA-02-2: 병렬/순차 실행 옵션
├── TA-02-3: Rate limiting 구현
└── TA-02-4: 실행 중 취소 기능

TA-03: 테스트 결과 대시보드
├── TA-03-1: 통계 카드 컴포넌트
├── TA-03-2: 실행 이력 테이블
├── TA-03-3: 실패 케이스 하이라이트
└── TA-03-4: 결과 내보내기 (Excel)
```

### Sprint 4: 통합 및 UI 개선 (예상 2-3일)

```
UI 통합
├── UI-01: 대시보드 레이아웃 개선
├── UI-02: 네비게이션 플로우 최적화
├── UI-03: 로딩 상태 개선
├── UI-04: 에러 처리 UI
└── UI-05: 키보드 단축키 (기본)
```

---

## 4. 기술 설계

### 4.1 Zustand 스토어 구조

```typescript
// stores/useProjectStore.ts
interface ProjectStore {
  projects: Project[];
  currentProjectId: string | null;
  loading: boolean;
  setCurrentProject: (id: string) => void;
  fetchProjects: () => Promise<void>;
}

// stores/useAuthStore.ts
interface AuthStore {
  session: UserSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// stores/useUIStore.ts
interface UIStore {
  sidebarOpen: boolean;
  activeTab: string;
  searchQuery: string;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
}
```

### 4.2 변경 감지 데이터 구조

```typescript
interface ApiChange {
  type: 'ADD' | 'DELETE' | 'MODIFY';
  endpoint: {
    path: string;
    method: string;
  };
  changes?: {
    field: string;
    before: any;
    after: any;
  }[];
  detectedAt: Date;
  versionFrom: string;
  versionTo: string;
}
```

### 4.3 글래스모피즘 디자인 토큰

```css
/* Linear.app 스타일 */
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
}

.glass-card-dark {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## 5. 수용 기준 (Acceptance Criteria)

### 5.1 API 변경 추적

- [ ] 저장소 재스캔 시 2초 이내에 변경 감지 결과 표시 (200 엔드포인트 기준)
- [ ] 엔드포인트 추가/삭제/수정을 시각적으로 구분 (초록/빨강/노랑)
- [ ] 변경 이력 타임라인에서 특정 버전 클릭 시 해당 시점 스냅샷 표시
- [ ] 변경 요약 알림이 설정된 Dooray 웹훅으로 전송

### 5.2 테스트 자동화

- [ ] DTO 기반 테스트 케이스 생성 시 모든 필수 필드 포함
- [ ] 일괄 테스트 실행 시 개별 테스트 실패해도 나머지 계속 실행
- [ ] 테스트 결과 대시보드에서 성공률 및 최근 10회 이력 표시
- [ ] Rate limiting으로 대상 서버에 초당 10회 이상 요청 방지

### 5.3 기반 작업

- [ ] 20명 동시 접속 시 응답 시간 3초 이내 유지
- [ ] 페이지 전환 시 부드러운 애니메이션 (200ms)
- [ ] 글래스모피즘 스타일 카드 컴포넌트 일관 적용

---

## 6. 검증 계획

### 6.1 단위 테스트

| 대상 | 테스트 항목 |
|------|-------------|
| 변경 감지 로직 | 추가/삭제/수정 케이스별 정확도 |
| DTO 파싱 | 순환 참조, 중첩 객체 처리 |
| Rate limiter | 요청 제한 동작 확인 |

### 6.2 통합 테스트

| 시나리오 | 검증 항목 |
|----------|-----------|
| 저장소 재스캔 플로우 | 클론 → 파싱 → 비교 → 저장 → 표시 |
| 일괄 테스트 실행 | 큐잉 → 실행 → 결과 기록 → 대시보드 반영 |
| 동시 사용자 시뮬레이션 | 20명 동시 접속 시 응답성 |

---

## 7. 의존성 및 전제조건

### 7.1 기술 의존성

- [x] Next.js 16.x
- [x] React 19.x
- [x] Tailwind CSS 4.x
- [x] Framer Motion 12.x
- [ ] Zustand (신규 설치 필요)

### 7.2 환경 전제조건

- Docker 컨테이너에 git 바이너리 포함 확인
- PostgreSQL 연결 풀 설정 검토
- /tmp 디렉토리 쓰기 권한 확인

---

## 8. 변경 이력

| 일시 | 내용 | 담당 |
|------|------|------|
| 2026-01-22 | 초기 작업 계획 수립 | Claude (Planner) |

---

## 다음 단계

1. [ ] 작업 계획 사용자 승인
2. [ ] Zustand 설치 및 스토어 구조 구현
3. [ ] Sprint 1 시작
