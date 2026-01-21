# V2 테마 마이그레이션 계획

## 개요
팀 관리, 프로젝트 관리 및 기타 페이지들을 v2 테마(벤토 스타일)에 맞게 통합하는 작업

## 현재 상태 분석

### V2 테마 특징
- 밝은 배경색 (`bg-[#F5F7FA]`, `bg-[#F8FAFC]`)
- 상단 고정 헤더 (h-16, 로고, 검색, 사용자 메뉴)
- 좌측 슬림 사이드바 (w-24, 아이콘 기반 네비게이션)
- slate 색상 중심 디자인
- 벤토 그리드 레이아웃 (rounded-3xl 카드)
- Framer Motion 애니메이션

### 현재 문제점
1. 팀/프로젝트 페이지가 v1 테마 스타일 사용
2. 영어 라벨 혼용 (한국어로 통일 필요)
3. DashboardV2와 일관성 없는 레이아웃
4. 별도 페이지로 분리되어 통합 UX 부재

---

## 구현 항목

### Phase 1: 공통 레이아웃 컴포넌트 생성
- [ ] **1.1** `src/components/layout/V2Layout.tsx` 생성
  - 상단 헤더 (로고, 검색, 알림, 사용자 메뉴)
  - 좌측 슬림 사이드바 (네비게이션)
  - 메인 컨텐츠 영역
- [ ] **1.2** `src/components/layout/V2Header.tsx` 분리
- [ ] **1.3** `src/components/layout/V2Sidebar.tsx` 분리
- [ ] **1.4** 네비게이션 항목 정의 (엔드포인트, 모델, 테스트, 시나리오, 버전, 환경설정, 팀, 프로젝트)

### Phase 2: 팀 관리 페이지 V2 적용
- [ ] **2.1** `src/components/teams/TeamsV2.tsx` 생성
  - V2 스타일 카드 그리드
  - 한국어 라벨 통일
- [ ] **2.2** 팀 생성 모달 V2 스타일 적용
- [ ] **2.3** 프로젝트 연결 모달 V2 스타일 적용
- [ ] **2.4** 팀 멤버 관리 UI 추가 (향후 확장)
- [ ] **2.5** `/teams` 페이지에서 TeamsV2 컴포넌트 사용

### Phase 3: 프로젝트 관리 페이지 V2 적용
- [ ] **3.1** `src/components/projects/ProjectsV2.tsx` 생성
  - V2 스타일 카드 레이아웃
  - 한국어 라벨 통일
- [ ] **3.2** 프로젝트 생성 모달 V2 스타일 적용
- [ ] **3.3** 저장소 추가 모달 V2 스타일 적용
- [ ] **3.4** 팀 연결 모달 V2 스타일 적용
- [ ] **3.5** `/projects` 페이지에서 ProjectsV2 컴포넌트 사용

### Phase 4: DashboardV2 통합
- [ ] **4.1** DashboardV2 사이드바에 팀/프로젝트 네비게이션 추가
- [ ] **4.2** 탭 전환 시 팀/프로젝트 뷰 렌더링
- [ ] **4.3** 프로젝트 선택기(ProjectSelector) V2 스타일 적용
- [ ] **4.4** 세션 정보 props 전달 통일

### Phase 5: 추가 기능 개선
- [ ] **5.1** 전사 계층 구조(`/hierarchy`) V2 스타일 적용
- [ ] **5.2** 관리자 페이지(`/admin`) V2 스타일 적용
- [ ] **5.3** 빈 상태(Empty State) 컴포넌트 V2 스타일 통일
- [ ] **5.4** 로딩 스켈레톤 V2 스타일 통일
- [ ] **5.5** 토스트 알림 한국어화

### Phase 6: 테스트 및 정리
- [ ] **6.1** 모든 페이지 빌드 오류 확인
- [ ] **6.2** 반응형 레이아웃 검증 (모바일, 태블릿, 데스크톱)
- [ ] **6.3** 다크모드 대응 (선택사항)
- [ ] **6.4** 불필요한 v1 코드 정리

---

## 한국어 라벨 통일 목록

| 영어 | 한국어 |
|------|--------|
| Teams Management | 팀 관리 |
| New Team | 새 팀 만들기 |
| Create Team | 팀 생성 |
| Team Name | 팀 이름 |
| Description | 설명 |
| Projects | 프로젝트 |
| Add Project | 프로젝트 추가 |
| Repositories | 저장소 |
| Add Repository | 저장소 추가 |
| Link / Unlink | 연결 / 해제 |
| Assign / Unassign | 할당 / 해제 |
| Search | 검색 |
| Cancel | 취소 |
| Close | 닫기 |
| Delete | 삭제 |
| Save | 저장 |
| Grid View | 그리드 보기 |
| List View | 목록 보기 |

---

## 파일 구조 (예정)

```
src/
├── components/
│   ├── layout/
│   │   ├── V2Layout.tsx        # 공통 레이아웃
│   │   ├── V2Header.tsx        # 상단 헤더
│   │   └── V2Sidebar.tsx       # 좌측 사이드바
│   ├── teams/
│   │   └── TeamsV2.tsx         # 팀 관리 V2
│   ├── projects/
│   │   └── ProjectsV2.tsx      # 프로젝트 관리 V2
│   └── dashboard/
│       ├── DashboardUI.tsx     # 기존 (v1/v2 스위처)
│       └── DashboardV2.tsx     # V2 메인 (수정)
└── app/
    ├── teams/page.tsx          # V2 레이아웃 사용
    └── projects/page.tsx       # V2 레이아웃 사용
```

---

## 우선순위

1. **높음**: Phase 1 (공통 레이아웃) → Phase 4 (DashboardV2 통합)
2. **중간**: Phase 2 (팀 관리) → Phase 3 (프로젝트 관리)
3. **낮음**: Phase 5 (추가 기능) → Phase 6 (테스트/정리)

---

## 진행 상태

| 항목 | 상태 | 완료일 |
|------|------|--------|
| Phase 1.1 V2Layout 생성 | 완료 | 2026-01-21 |
| Phase 1.2 V2Header 생성 | 완료 | 2026-01-21 |
| Phase 1.3 V2Sidebar 생성 | 완료 | 2026-01-21 |
| Phase 1.4 네비게이션 정의 | 완료 | 2026-01-21 |
| Phase 2.1 TeamsV2 생성 | 완료 | 2026-01-21 |
| Phase 2.2 팀 생성 모달 V2 | 완료 | 2026-01-21 |
| Phase 2.3 프로젝트 연결 모달 V2 | 완료 | 2026-01-21 |
| Phase 2.5 /teams 페이지 적용 | 완료 | 2026-01-21 |
| Phase 3.1 ProjectsV2 생성 | 완료 | 2026-01-21 |
| Phase 3.2 프로젝트 생성 모달 V2 | 완료 | 2026-01-21 |
| Phase 3.3 저장소 추가 모달 V2 | 완료 | 2026-01-21 |
| Phase 3.4 팀 연결 모달 V2 | 완료 | 2026-01-21 |
| Phase 3.5 /projects 페이지 적용 | 완료 | 2026-01-21 |
| Phase 4.1 DashboardV2 사이드바 네비게이션 | 완료 | 2026-01-21 |
| Phase 4.2 ApiList props 연동 | 완료 | 2026-01-21 |
| Phase 5.1 /hierarchy V2 스타일 | 대기 | - |
| Phase 5.2 /admin V2 스타일 | 대기 | - |
| Phase 6.1 빌드 오류 확인 | 완료 | 2026-01-21 |

---

## 참고 사항

- 모든 텍스트는 한국어로 작성
- V2 테마 색상: slate 계열 + blue 포인트
- 카드 모서리: rounded-3xl (24px)
- 폰트 무게: font-black (900) 강조, font-bold (700) 일반
- 애니메이션: Framer Motion 사용
