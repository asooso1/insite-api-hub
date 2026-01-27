# Phase 4 작업 계획: 프로덕션 안정화 & UI/UX 고도화

**작성일**: 2026-01-27
**목표**: 더미/플레이스홀더 코드 제거, V2 테마 + 3D 스타일 전면 적용, 신규 기능 개발
**기반**: V2 테마 (DashboardV2.tsx) + 3D 데모 스타일 (3DShowcase)

---

## 1. 개요

### 1.1 Phase 4 배경

Phase 1~3에서 11개 스프린트를 완료했으나, 코드 감사 결과 **29건의 더미/미완성 구현**이 발견됨:
- CRITICAL 6건 (보안, 데이터 미조회, 레거시)
- HIGH 6건 (스키마 불일치, 하드코딩, 런타임 에러)
- MEDIUM 9건 (불완전 기능, 미사용 코드)
- LOW 8건 (UI 플레이스홀더, 정리)

### 1.2 Phase 구성

| Phase | 주제 | Sprint | 핵심 목표 |
|-------|------|--------|-----------|
| **4A** | 프로덕션 안정화 | Sprint 12-13 | 보안 취약점 제거, 더미 코드 교체, 스키마 동기화 |
| **4B** | UI/UX 고도화 | Sprint 14-16 | V2+3D 스타일 전면 적용, 다크모드, 검색, 최근활동 |
| **4C** | 협업 강화 | Sprint 17-18 | 실시간 협업 기능 확장, 추가 아이디어 구현 |

### 1.3 디자인 원칙

- **V2 테마 기준**: `bg-white rounded-3xl border-slate-200 font-black` 패턴
- **3D 효과 전면 적용**: `useTilt3D`, `Tilt3DCard`, Parallax, Depth Layer
- **Linear.app 미학**: 글래스모피즘, spring 물리 애니메이션, 키보드 우선
- **한국어 UI**: 모든 텍스트 한국어 유지

---

## 2. Phase 4A: 프로덕션 안정화

### Sprint 12: 보안 및 핵심 수정

#### SEC-01: 비밀번호 보안 (CRITICAL)

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| SEC-01-1 | `bcryptjs`로 비밀번호 해싱 교체 (`auth.ts:16-19`) | 긴급 | ✅ 완료 |
| SEC-01-2 | `signIn` 비교 로직 bcrypt.compare 적용 (`auth.ts:47`) | 긴급 | ✅ 완료 |
| SEC-01-3 | 기존 사용자 비밀번호 마이그레이션 스크립트 작성 | 긴급 | ✅ 완료 |

#### SEC-02: 자격증명 보호 (CRITICAL)

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| SEC-02-1 | `.env` 파일 `.gitignore`에 추가, 커밋에서 제거 | 긴급 | ✅ 완료 |
| SEC-02-2 | `.deploy_ssh_config` `.gitignore`에 추가 | 긴급 | ✅ 완료 |
| SEC-02-3 | `.env.example` 템플릿 생성 (실제 값 없이) | 긴급 | ✅ 완료 |
| SEC-02-4 | `docker-compose.yml` 환경변수 참조로 변경 | 높음 | ✅ 완료 |
| SEC-02-5 | `WebhookSettings.tsx` NEXT_PUBLIC 시크릿 노출 수정 | 높음 | ✅ 완료 |

#### FIX-01: 데이터 서비스 수정 (CRITICAL)

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| FIX-01-1 | `data-service.ts` testCases DB 조회 구현 | 긴급 | ✅ 완료 |
| FIX-01-2 | `mock-db.ts` 의존성 제거 → `api-types.ts`로 import 변경 | 높음 | ✅ 완료 |
| FIX-01-3 | `mock-db.ts` 파일 및 `mock-db.json` 삭제 | 높음 | ✅ 완료 |

#### FIX-02: DB 스키마 동기화 (HIGH)

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| FIX-02-1 | `init.sql`에 `user_sessions` 테이블 추가 | 긴급 | ✅ 완료 |
| FIX-02-2 | `init.sql`에 `activity_logs` 테이블 추가 | 높음 | ✅ 완료 |
| FIX-02-3 | `init.sql`에 `notifications` 테이블 추가 | 높음 | ✅ 완료 |
| FIX-02-4 | `projects` 테이블에 `git_token` 컬럼 추가 | 높음 | ✅ 완료 |
| FIX-02-5 | `db-migration.ts` 중복 파일 삭제 | 중간 | ✅ 완료 |

**Sprint 12 산출물:**
- 보안이 강화된 인증 시스템
- 동기화된 DB 스키마
- 레거시 코드 제거

---

### Sprint 13: 더미 코드 교체 및 정리

#### DUMMY-01: 하드코딩 URL 수정 (HIGH)

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| DUMMY-01-1 | 5개 action 파일에서 `localhost:3000` → `process.env.APP_BASE_URL` | 높음 | ✅ 완료 |
| DUMMY-01-2 | 환경 URL seed `example.com` → 빈 값 또는 설정 안내 | 중간 | ✅ 완료 |
| DUMMY-01-3 | `payload-generator.ts` 샘플값을 faker.js 연동으로 교체 | 중간 | ✅ 완료 |

#### DUMMY-02: 미구현 기능 완성 (HIGH)

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| DUMMY-02-1 | `webhook.ts` 로그 저장 코드 주석 해제 및 구현 | 높음 | ✅ 완료 |
| DUMMY-02-2 | `V2Sidebar.tsx` 사용자 정보 세션 연동 (`User Name` → 실제 이름) | 높음 | ✅ 완료 |
| DUMMY-02-3 | `RepoImporter.tsx` 진행률 바를 실제 서버 이벤트로 교체 | 중간 | ✅ 완료 |
| DUMMY-02-4 | `DashboardOverview.tsx` 더미 통계를 실제 DB 데이터로 교체 | 중간 | ✅ 완료 |
| DUMMY-02-5 | `admin/page.tsx` 온라인 상태를 실제 세션 데이터로 연동 | 중간 | ✅ 완료 |
| DUMMY-02-6 | `admin/page.tsx` MoreVertical 버튼 컨텍스트 메뉴 구현 | 낮음 | ✅ 완료 |

#### CLEANUP-01: 코드 정리 (MEDIUM/LOW)

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| CLEANUP-01-1 | 미사용 의존성 제거 (`@supabase/supabase-js`, `next-auth`) | 중간 | ✅ 완료 |
| CLEANUP-01-2 | `.env` 주석 처리된 Supabase 참조 제거 | 낮음 | ✅ 완료 |
| CLEANUP-01-3 | `docker-compose.yml` version 필드 제거 (deprecated) | 낮음 | ✅ 완료 |
| CLEANUP-01-4 | V2Sidebar 아바타 seed를 사용자 이름 기반으로 변경 | 낮음 | ✅ 완료 |
| CLEANUP-01-5 | `init.sql` 기본 프로젝트 제거 또는 조건부 생성 | 낮음 | ✅ 완료 |

**Sprint 13 산출물:**
- 모든 하드코딩 URL 환경변수화
- 웹훅 로그 실제 저장
- 더미 데이터 교체 완료
- 미사용 코드 정리

---

## 3. Phase 4B: UI/UX 고도화

### Sprint 14: V2 + 3D 스타일 전면 적용

#### STYLE-01: 3D 효과 전면 적용

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| STYLE-01-1 | DashboardOverview 메트릭 카드에 `Tilt3DCard` 적용 | 높음 | ⏳ 대기 |
| STYLE-01-2 | 사이드바 활성 탭에 Depth Layer + Glow 효과 | 높음 | ⏳ 대기 |
| STYLE-01-3 | 모달 오픈 시 3D Perspective 진입 애니메이션 | 중간 | ⏳ 대기 |
| STYLE-01-4 | 엔드포인트 카드에 호버 Tilt + Glare 효과 | 중간 | ⏳ 대기 |
| STYLE-01-5 | 테스트 결과 카드에 성공/실패 시 3D Flip 애니메이션 | 중간 | ⏳ 대기 |
| STYLE-01-6 | 페이지 전환 시 3D Depth 트랜지션 | 낮음 | ⏳ 대기 |

#### STYLE-02: 자동 분석 엔진 UI 재배치

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| STYLE-02-1 | RepoImporter를 하단 Banner → 사이드바 하단 또는 헤더 액션으로 이동 | 높음 | ⏳ 대기 |
| STYLE-02-2 | 동기화 상태 인디케이터 (마지막 동기화 시간, 진행 상태) | 높음 | ⏳ 대기 |
| STYLE-02-3 | 동기화 결과 알림 토스트 | 중간 | ⏳ 대기 |
| STYLE-02-4 | Git 저장소 연결 상태 카드 (Connected/Disconnected) | 중간 | ⏳ 대기 |

#### STYLE-03: 데이터 모델 CSS 수정

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| STYLE-03-1 | ModelExplorer 레이아웃 깨짐 디버깅 및 수정 | 긴급 | ⏳ 대기 |
| STYLE-03-2 | 모델 트리뷰 들여쓰기 및 연결선 CSS 수정 | 높음 | ⏳ 대기 |
| STYLE-03-3 | 필드 타입 뱃지 반응형 처리 | 중간 | ⏳ 대기 |
| STYLE-03-4 | 모델 카드 V2 테마 일관성 적용 (rounded-3xl, shadow-sm) | 중간 | ⏳ 대기 |

**Sprint 14 산출물:**
- 3D 효과가 적용된 전체 UI
- 자동 분석 엔진 위치 변경
- 데이터 모델 CSS 수정 완료

---

### Sprint 15: 다크모드 & 검색

#### DARK-01: 다크모드 구현

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| DARK-01-1 | Tailwind CSS v4 다크모드 테마 변수 정의 (`globals.css`) | 높음 | ⏳ 대기 |
| DARK-01-2 | 다크모드 토글 컴포넌트 (헤더에 배치) | 높음 | ⏳ 대기 |
| DARK-01-3 | `useUIStore`에 theme 상태 추가 (light/dark/system) | 높음 | ⏳ 대기 |
| DARK-01-4 | 대시보드 레이아웃 다크모드 스타일 적용 | 높음 | ⏳ 대기 |
| DARK-01-5 | 사이드바 다크모드 스타일 (이미 부분 구현) 완성 | 중간 | ⏳ 대기 |
| DARK-01-6 | 모든 V2 카드/버튼/입력 컴포넌트 다크모드 적용 | 중간 | ⏳ 대기 |
| DARK-01-7 | 코드 에디터/JSON 뷰어 다크모드 (react-syntax-highlighter) | 중간 | ⏳ 대기 |
| DARK-01-8 | 3D 효과 다크모드 변형 (Glare 색상, Glow 색상) | 낮음 | ⏳ 대기 |
| DARK-01-9 | 시스템 설정 자동 감지 (`prefers-color-scheme`) | 낮음 | ⏳ 대기 |

#### SEARCH-01: 글로벌 검색 구현

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| SEARCH-01-1 | 헤더 검색 바를 실제 글로벌 검색으로 연결 | 높음 | ⏳ 대기 |
| SEARCH-01-2 | 검색 결과 드롭다운 UI (엔드포인트, 모델, 프로젝트 그룹화) | 높음 | ⏳ 대기 |
| SEARCH-01-3 | Cmd+K 커맨드 팔레트와 검색 통합 | 높음 | ⏳ 대기 |
| SEARCH-01-4 | 서버 액션 기반 검색 API (`searchAll`) | 높음 | ⏳ 대기 |
| SEARCH-01-5 | 최근 검색 히스토리 (로컬스토리지) | 중간 | ⏳ 대기 |
| SEARCH-01-6 | 검색 결과 하이라이팅 | 중간 | ⏳ 대기 |
| SEARCH-01-7 | 검색 필터 (엔드포인트만, 모델만, HTTP 메서드별) | 낮음 | ⏳ 대기 |

**Sprint 15 산출물:**
- 완전한 다크모드 지원
- 글로벌 검색 시스템
- 테마 전환 UI

---

### Sprint 16: 엔드포인트 최근활동 & 마이크로인터랙션

#### ACTIVITY-01: 엔드포인트 최근활동 기능

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| ACTIVITY-01-1 | 엔드포인트별 최근 활동 조회 서버 액션 | 높음 | ⏳ 대기 |
| ACTIVITY-01-2 | 엔드포인트 상세 패널에 활동 타임라인 추가 | 높음 | ⏳ 대기 |
| ACTIVITY-01-3 | 활동 유형별 아이콘/색상 (변경, 테스트, 댓글, Mock 설정) | 중간 | ⏳ 대기 |
| ACTIVITY-01-4 | DashboardOverview 최근활동을 실제 DB 데이터로 연결 | 중간 | ⏳ 대기 |
| ACTIVITY-01-5 | 엔드포인트 카드에 "최근 변경" 뱃지 표시 | 중간 | ⏳ 대기 |
| ACTIVITY-01-6 | 활동 알림 구독 (엔드포인트별 Watch 기능) | 낮음 | ⏳ 대기 |

#### MICRO-01: 마이크로인터랙션 추가

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| MICRO-01-1 | 버튼 클릭 시 ripple/scale 효과 전역 적용 | 중간 | ⏳ 대기 |
| MICRO-01-2 | 토스트 알림 3D 슬라이드 인/아웃 애니메이션 | 중간 | ⏳ 대기 |
| MICRO-01-3 | 탭 전환 시 콘텐츠 morphing 트랜지션 | 중간 | ⏳ 대기 |
| MICRO-01-4 | 스크롤 기반 헤더 축소 (sticky header shrink) | 중간 | ⏳ 대기 |
| MICRO-01-5 | 데이터 로딩 시 shimmer skeleton + pulse 조합 | 낮음 | ⏳ 대기 |
| MICRO-01-6 | 숫자 변경 시 counting 애니메이션 (통계 카드) | 낮음 | ⏳ 대기 |

**Sprint 16 산출물:**
- 엔드포인트별 활동 이력
- 실제 DB 기반 최근 활동
- 프리미엄 마이크로인터랙션

---

## 4. Phase 4C: 협업 강화

### Sprint 17: 협업 기능 확장

#### COLLAB-01: 실시간 협업 강화

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| COLLAB-01-1 | API 엔드포인트 소유자 지정 (Owner Assignment) | 높음 | ⏳ 대기 |
| COLLAB-01-2 | API 상태 관리 (Draft → Review → Approved → Deprecated) | 높음 | ⏳ 대기 |
| COLLAB-01-3 | 변경 사항 리뷰 요청 (Review Request) 워크플로우 | 높음 | ⏳ 대기 |
| COLLAB-01-4 | 인라인 코멘트 개선 (스레드 + 리졸브) | 중간 | ⏳ 대기 |
| COLLAB-01-5 | 팀별 API 대시보드 뷰 (팀이 관리하는 엔드포인트만) | 중간 | ⏳ 대기 |

#### COLLAB-02: 알림 시스템 고도화

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| COLLAB-02-1 | 이메일 알림 연동 (Dooray 외 추가 채널) | 중간 | ⏳ 대기 |
| COLLAB-02-2 | 알림 설정 (유형별 ON/OFF, 구독 관리) | 중간 | ⏳ 대기 |
| COLLAB-02-3 | Breaking Change 자동 알림 (Owner에게) | 높음 | ⏳ 대기 |
| COLLAB-02-4 | 일일 다이제스트 알림 (변경 요약) | 낮음 | ⏳ 대기 |

**Sprint 17 산출물:**
- API 소유자 관리
- 상태 워크플로우
- 리뷰 요청 시스템
- 알림 고도화

---

### Sprint 18: 추가 협업 아이디어

#### IDEA-01: API 변경 영향도 분석

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| IDEA-01-1 | API 의존성 그래프 시각화 (어떤 프론트엔드가 어떤 API 사용) | 중간 | ⏳ 대기 |
| IDEA-01-2 | Breaking Change 시 영향받는 클라이언트 자동 식별 | 높음 | ⏳ 대기 |
| IDEA-01-3 | API 사용량 메트릭 (Mock 서버 호출 통계) | 중간 | ⏳ 대기 |

#### IDEA-02: 개발자 경험 (DX) 향상

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| IDEA-02-1 | API Changelog 자동 생성 (버전 간 변경 사항 마크다운) | 높음 | ⏳ 대기 |
| IDEA-02-2 | Postman/Insomnia Collection 내보내기 | 중간 | ⏳ 대기 |
| IDEA-02-3 | Slack/Discord 웹훅 연동 | 중간 | ⏳ 대기 |
| IDEA-02-4 | API 스타일 가이드 규칙 검사 (네이밍 컨벤션 등) | 낮음 | ⏳ 대기 |

#### IDEA-03: 프론트엔드-백엔드 협업 도구

| ID | 설명 | 우선순위 | 상태 |
|----|------|----------|------|
| IDEA-03-1 | Mock 서버 프리셋 공유 (팀원 간 시나리오 공유) | 중간 | ⏳ 대기 |
| IDEA-03-2 | API 계약 (Contract) 검증 자동화 | 높음 | ⏳ 대기 |
| IDEA-03-3 | TypeScript SDK 자동 생성 (API 타입 + fetch 함수) | 높음 | ⏳ 대기 |
| IDEA-03-4 | API 버전 호환성 매트릭스 표시 | 낮음 | ⏳ 대기 |

**Sprint 18 산출물:**
- API 영향도 분석 시스템
- DX 도구 (Changelog, Collection 내보내기)
- 프론트엔드-백엔드 협업 도구

---

## 5. 전체 일정 요약

```
Phase 4A: 프로덕션 안정화
├── Sprint 12: 보안 및 핵심 수정 ........... ✅ 완료
│   ├── SEC-01: 비밀번호 보안 (3 tasks)
│   ├── SEC-02: 자격증명 보호 (5 tasks)
│   ├── FIX-01: 데이터 서비스 수정 (3 tasks)
│   └── FIX-02: DB 스키마 동기화 (5 tasks)
│
└── Sprint 13: 더미 코드 교체 .............. ✅ 완료
    ├── DUMMY-01: 하드코딩 URL 수정 (3 tasks)
    ├── DUMMY-02: 미구현 기능 완성 (6 tasks)
    └── CLEANUP-01: 코드 정리 (5 tasks)

Phase 4B: UI/UX 고도화
├── Sprint 14: V2 + 3D 스타일 ............. ⏳ 대기
│   ├── STYLE-01: 3D 효과 전면 적용 (6 tasks)
│   ├── STYLE-02: 분석 엔진 UI 재배치 (4 tasks)
│   └── STYLE-03: 데이터 모델 CSS 수정 (4 tasks)
│
├── Sprint 15: 다크모드 & 검색 ............. ⏳ 대기
│   ├── DARK-01: 다크모드 구현 (9 tasks)
│   └── SEARCH-01: 글로벌 검색 (7 tasks)
│
└── Sprint 16: 최근활동 & 인터랙션 ......... ⏳ 대기
    ├── ACTIVITY-01: 엔드포인트 최근활동 (6 tasks)
    └── MICRO-01: 마이크로인터랙션 (6 tasks)

Phase 4C: 협업 강화
├── Sprint 17: 협업 기능 확장 .............. ⏳ 대기
│   ├── COLLAB-01: 실시간 협업 강화 (5 tasks)
│   └── COLLAB-02: 알림 시스템 고도화 (4 tasks)
│
└── Sprint 18: 추가 아이디어 ............... ⏳ 대기
    ├── IDEA-01: API 변경 영향도 (3 tasks)
    ├── IDEA-02: DX 향상 (4 tasks)
    └── IDEA-03: FE-BE 협업 도구 (4 tasks)
```

---

## 6. 감사 결과 추적표

Phase 4A에서 해결해야 할 전체 감사 항목:

| # | 심각도 | 파일 | 문제 | Sprint | 작업 ID | 상태 |
|---|--------|------|------|--------|---------|------|
| 1 | CRITICAL | `auth.ts:16-19` | 평문 비밀번호 저장 | 12 | SEC-01-1 | ✅ |
| 2 | CRITICAL | `.env` | DB 자격증명 커밋 | 12 | SEC-02-1 | ✅ |
| 3 | CRITICAL | `.deploy_ssh_config` | SSH 설정 커밋 | 12 | SEC-02-2 | ✅ |
| 4 | CRITICAL | `docker-compose.yml` | 하드코딩 DB 비밀번호 | 12 | SEC-02-4 | ✅ |
| 5 | CRITICAL | `data-service.ts:76` | testCases 빈 배열 | 12 | FIX-01-1 | ✅ |
| 6 | CRITICAL | `mock-db.ts` | 레거시 JSON DB | 12 | FIX-01-2 | ✅ |
| 7 | HIGH | `init.sql` | user_sessions 누락 | 12 | FIX-02-1 | ✅ |
| 8 | HIGH | `webhook.ts:241` | git_token 미존재 | 12 | FIX-02-4 | ✅ |
| 9 | HIGH | `webhook.ts:392` | 웹훅 로그 미저장 | 13 | DUMMY-02-1 | ✅ |
| 10 | HIGH | 5개 action 파일 | localhost:3000 하드코딩 | 13 | DUMMY-01-1 | ✅ |
| 11 | HIGH | `WebhookSettings.tsx` | 시크릿 노출 위험 | 12 | SEC-02-5 | ✅ |
| 12 | HIGH | `V2Sidebar.tsx:262` | 하드코딩 사용자 정보 | 13 | DUMMY-02-2 | ✅ |
| 13 | MEDIUM | 환경 URLs | example.com 플레이스홀더 | 13 | DUMMY-01-2 | ✅ |
| 14 | MEDIUM | `db-migration.ts` | 중복 마이그레이션 | 12 | FIX-02-5 | ✅ |
| 15 | MEDIUM | `activity.ts` | activity_logs 테이블 누락 | 12 | FIX-02-2 | ✅ |
| 16 | MEDIUM | `notifications.ts` | notifications 테이블 누락 | 12 | FIX-02-3 | ✅ |
| 17 | MEDIUM | `package.json` | 미사용 의존성 | 13 | CLEANUP-01-1 | ✅ |
| 18 | MEDIUM | `payload-generator.ts` | 하드코딩 샘플값 | 13 | DUMMY-01-3 | ✅ |
| 19 | MEDIUM | `RepoImporter.tsx` | 가짜 진행률 바 | 13 | DUMMY-02-3 | ✅ |
| 20 | MEDIUM | `init.sql` | 기본 프로젝트 자동생성 | 13 | CLEANUP-01-5 | ✅ |
| 21 | MEDIUM | `DashboardOverview.tsx` | 더미 통계 | 13 | DUMMY-02-4 | ✅ |
| 22 | LOW | `admin/page.tsx:308` | 온라인 상태 고정 | 13 | DUMMY-02-5 | ✅ |
| 23 | LOW | `admin/page.tsx:313` | 빈 MoreVertical 버튼 | 13 | DUMMY-02-6 | ✅ |
| 24 | LOW | `V2Sidebar.tsx:250` | 아바타 seed 고정 | 13 | CLEANUP-01-4 | ✅ |
| 25 | LOW | 4개 유틸 파일 | mock-db.ts import | 12 | FIX-01-2 | ✅ |
| 26 | LOW | 리다이렉트 페이지 | 스텁 페이지 | - | 해당 없음 | ✅ |
| 27 | LOW | `webhook.ts:403` | 오래된 TODO 주석 | 13 | DUMMY-02-1 | ✅ |
| 28 | LOW | `docker-compose.yml` | deprecated version | 13 | CLEANUP-01-3 | ✅ |
| 29 | LOW | `.env:9-11` | Supabase 참조 잔존 | 13 | CLEANUP-01-2 | ✅ |

---

## 7. 변경 이력

| 일시 | 내용 | 담당 |
|------|------|------|
| 2026-01-27 | Phase 4 작업 계획 수립 (29건 감사 결과 기반) | Claude |
| 2026-01-27 | Phase 4A/4B/4C 스프린트 구성 완료 | Claude |
