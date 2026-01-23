# Phase 3 작업 계획

**작성일**: 2026-01-23
**목표**: 실시간 협업, API 문서 자동화, Mock 서버 강화

---

## 1. 개요

### 1.1 Phase 3 목표

Phase 2에서 구축한 기반 위에 **협업**, **문서화**, **개발 생산성** 기능을 추가합니다.

### 1.2 Sprint 구성

| Sprint | 주제 | 핵심 기능 |
|--------|------|-----------|
| Sprint 9 | 실시간 협업 | 주석/댓글, 멘션, 활동 피드 |
| Sprint 10 | API 문서 자동화 | OpenAPI 생성, 문서 뷰어, 코드 스니펫 |
| Sprint 11 | Mock 서버 강화 | 동적 응답, 시나리오 기반 Mock, 지연 시뮬레이션 |

---

## 2. Sprint 9: 실시간 협업

### 2.1 목표

API 엔드포인트, DTO 모델에 대한 팀 협업 기능 제공

### 2.2 작업 항목

#### CO-01: 주석/댓글 시스템

| ID | 설명 | 우선순위 |
|----|------|----------|
| CO-01-1 | Comment 데이터 모델 및 DB 스키마 | 높음 |
| CO-01-2 | 엔드포인트별 댓글 CRUD API | 높음 |
| CO-01-3 | 모델 필드별 인라인 주석 | 높음 |
| CO-01-4 | 댓글 스레드 (답글) 지원 | 중간 |
| CO-01-5 | 마크다운 렌더링 | 중간 |

#### CO-02: 멘션 및 알림

| ID | 설명 | 우선순위 |
|----|------|----------|
| CO-02-1 | @멘션 파싱 및 자동완성 | 높음 |
| CO-02-2 | 인앱 알림 시스템 | 높음 |
| CO-02-3 | 알림 센터 UI | 중간 |
| CO-02-4 | 읽음/안읽음 상태 관리 | 중간 |

#### CO-03: 활동 피드

| ID | 설명 | 우선순위 |
|----|------|----------|
| CO-03-1 | ActivityLog 데이터 모델 | 높음 |
| CO-03-2 | 활동 피드 타임라인 UI | 높음 |
| CO-03-3 | 필터링 (유형별, 사용자별) | 중간 |
| CO-03-4 | 프로젝트별 활동 요약 | 낮음 |

### 2.3 산출물

- `src/lib/db/schema/comments.ts` - 댓글 스키마
- `src/lib/db/schema/notifications.ts` - 알림 스키마
- `src/lib/db/schema/activity-logs.ts` - 활동 로그 스키마
- `src/app/actions/comments.ts` - 댓글 서버 액션
- `src/app/actions/notifications.ts` - 알림 서버 액션
- `src/components/comments/CommentThread.tsx` - 댓글 스레드 UI
- `src/components/comments/InlineAnnotation.tsx` - 인라인 주석
- `src/components/notifications/NotificationCenter.tsx` - 알림 센터
- `src/components/activity/ActivityFeed.tsx` - 활동 피드

---

## 3. Sprint 10: API 문서 자동화

### 3.1 목표

분석된 API 정보를 기반으로 OpenAPI 스펙 생성 및 문서화

### 3.2 작업 항목

#### DOC-01: OpenAPI 생성

| ID | 설명 | 우선순위 |
|----|------|----------|
| DOC-01-1 | Endpoint → OpenAPI Path 변환 | 높음 |
| DOC-01-2 | DTO → OpenAPI Schema 변환 | 높음 |
| DOC-01-3 | Request/Response 타입 매핑 | 높음 |
| DOC-01-4 | OpenAPI 3.0 JSON/YAML 내보내기 | 높음 |

#### DOC-02: 문서 뷰어

| ID | 설명 | 우선순위 |
|----|------|----------|
| DOC-02-1 | Swagger UI 스타일 문서 뷰어 | 높음 |
| DOC-02-2 | Try it out (실행 가능 예제) | 높음 |
| DOC-02-3 | 검색 및 필터링 | 중간 |
| DOC-02-4 | 다크/라이트 모드 | 낮음 |

#### DOC-03: 코드 스니펫

| ID | 설명 | 우선순위 |
|----|------|----------|
| DOC-03-1 | cURL 명령어 생성 | 높음 |
| DOC-03-2 | JavaScript/TypeScript fetch 코드 | 높음 |
| DOC-03-3 | Python requests 코드 | 중간 |
| DOC-03-4 | 복사 버튼 및 구문 강조 | 중간 |

### 3.3 산출물

- `src/lib/openapi-generator.ts` - OpenAPI 스펙 생성기
- `src/lib/code-snippet-generator.ts` - 코드 스니펫 생성기
- `src/components/docs/ApiDocViewer.tsx` - API 문서 뷰어
- `src/components/docs/TryItOut.tsx` - Try it out 패널
- `src/components/docs/CodeSnippet.tsx` - 코드 스니펫 컴포넌트
- `src/app/api/docs/openapi/route.ts` - OpenAPI JSON 엔드포인트

---

## 4. Sprint 11: Mock 서버 강화

### 4.1 목표

개발/테스트 환경을 위한 고급 Mock 서버 기능 제공

### 4.2 작업 항목

#### MOCK-01: 동적 응답 생성

| ID | 설명 | 우선순위 |
|----|------|----------|
| MOCK-01-1 | DTO 기반 동적 Mock 데이터 생성 | 높음 |
| MOCK-01-2 | Faker.js 통합 (현실적 데이터) | 높음 |
| MOCK-01-3 | 커스텀 응답 템플릿 | 중간 |
| MOCK-01-4 | 조건부 응답 규칙 | 중간 |

#### MOCK-02: 시나리오 기반 Mock

| ID | 설명 | 우선순위 |
|----|------|----------|
| MOCK-02-1 | Mock 시나리오 정의 UI | 높음 |
| MOCK-02-2 | 상태 기반 응답 (stateful mock) | 높음 |
| MOCK-02-3 | 시퀀스 응답 (call count 기반) | 중간 |
| MOCK-02-4 | 에러 시나리오 시뮬레이션 | 중간 |

#### MOCK-03: 네트워크 시뮬레이션

| ID | 설명 | 우선순위 |
|----|------|----------|
| MOCK-03-1 | 응답 지연 설정 | 높음 |
| MOCK-03-2 | 랜덤 지연 범위 | 중간 |
| MOCK-03-3 | 타임아웃 시뮬레이션 | 중간 |
| MOCK-03-4 | 네트워크 에러 시뮬레이션 | 낮음 |

### 4.3 산출물

- `src/lib/mock/data-generator.ts` - Mock 데이터 생성기
- `src/lib/mock/scenario-engine.ts` - 시나리오 엔진
- `src/lib/mock/network-simulator.ts` - 네트워크 시뮬레이터
- `src/components/mock/MockConfigPanel.tsx` - Mock 설정 패널
- `src/components/mock/ScenarioBuilder.tsx` - 시나리오 빌더 UI
- `src/app/api/mock/[...path]/route.ts` - 개선된 Mock 엔드포인트

---

## 5. 다음 단계

1. [x] Phase 3 작업 계획 수립
2. [ ] Sprint 9 시작 - 실시간 협업
3. [ ] Sprint 10 시작 - API 문서 자동화
4. [ ] Sprint 11 시작 - Mock 서버 강화

---

## 6. 변경 이력

| 일시 | 내용 | 담당 |
|------|------|------|
| 2026-01-23 | Phase 3 작업 계획 수립 | Claude |
