# Sprint 14 테스트 체크리스트: V2 + 3D 스타일 전면 적용

**작성일**: 2026-01-28
**대상**: Phase 4B - Sprint 14 (STYLE-01, STYLE-02, STYLE-03)
**테스트 환경**: http://localhost:3000

---

## 테스트 대상 기능

| 그룹 | ID | 기능 | 우선순위 |
|------|-----|------|----------|
| STYLE-01 | STYLE-01-1 | DashboardOverview 메트릭 카드 3D Tilt | 높음 |
| STYLE-01 | STYLE-01-2 | 사이드바 활성 탭 Depth Layer + Glow | 높음 |
| STYLE-01 | STYLE-01-3 | 모달 3D Perspective 애니메이션 | 중간 |
| STYLE-01 | STYLE-01-4 | 엔드포인트 카드 호버 Tilt + Glare | 중간 |
| STYLE-01 | STYLE-01-5 | 테스트 결과 3D Flip 애니메이션 | 중간 |
| STYLE-01 | STYLE-01-6 | 페이지 전환 3D Depth 트랜지션 | 낮음 |
| STYLE-02 | STYLE-02-1~4 | SyncStatusPanel 동기화 상태 컴포넌트 | 높음 |
| STYLE-03 | STYLE-03-1 | ModelExplorer 레이아웃 수정 | 긴급 |
| STYLE-03 | STYLE-03-2 | 모델 트리뷰 CSS 수정 | 높음 |
| STYLE-03 | STYLE-03-3 | 필드 타입 뱃지 반응형 | 중간 |
| STYLE-03 | STYLE-03-4 | 모델 카드 V2 테마 적용 | 중간 |

---

## STYLE-01: 3D 효과 전면 적용

### STYLE-01-1: 메트릭 카드 3D Tilt

**확인 경로**: 대시보드 메인 (/) → 프로젝트 선택

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 대시보드 페이지 접속 | 4개 메트릭 카드(엔드포인트/모델/환경/테스트)가 표시됨 | [ ] |
| 2 | 메트릭 카드 위에 마우스 올리기 | 카드가 마우스 방향에 따라 미세하게 3D로 기울어짐 | [ ] |
| 3 | 마우스를 카드 좌측에서 우측으로 이동 | 카드가 왼쪽→오른쪽으로 기울기가 변화함 | [ ] |
| 4 | 카드에서 마우스 벗어나기 | 카드가 원래 평면 상태로 부드럽게 복귀 | [ ] |
| 5 | 카드 위에서 빛 반사(glare) 효과 확인 | 마우스 위치에 따라 은은한 빛 반사가 보임 | [ ] |
| 6 | 유리 효과(glass variant) 확인 | 카드 배경이 약간 투명하고 블러 효과가 있음 | [ ] |

### STYLE-01-2: 사이드바 활성 탭 Depth + Glow

**확인 경로**: 모든 페이지 좌측 사이드바

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 사이드바에서 현재 활성 탭 확인 | 활성 탭에 그라디언트 배경(from-blue-600 to-blue-500)이 적용됨 | [ ] |
| 2 | 활성 탭 뒤의 glow 효과 확인 | 활성 탭 뒤에 파란색 blur glow가 보임 | [ ] |
| 3 | 활성 탭 위에 마우스 올리기 | 탭이 약간 오른쪽으로 이동하며 살짝 확대됨 (scale 1.02) | [ ] |
| 4 | 다른 탭 클릭 | glow가 새 탭 위치로 부드럽게 이동 (spring 애니메이션) | [ ] |
| 5 | 비활성 탭 hover | 미묘한 그림자(shadow-sm)와 배경색 변화 확인 | [ ] |
| 6 | 좌측 흰색 인디케이터 바 이동 확인 | 탭 전환 시 좌측 바가 부드럽게 이동 | [ ] |

### STYLE-01-3: 모달 3D Perspective 애니메이션

**확인 경로**: Modal3D 컴포넌트 사용처

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | Modal3D 컴포넌트 파일 존재 확인 | src/components/ui/Modal3D.tsx 파일이 존재함 | [ ] |
| 2 | design-system.ts에 modal3DVariants 존재 확인 | modal3DVariants.overlay, .content가 정의되어 있음 | [ ] |
| 3 | TypeScript 빌드 통과 | Modal3D 관련 타입 에러 없음 | [ ] |

### STYLE-01-4: 엔드포인트 카드 호버 Tilt + Glare

**확인 경로**: 엔드포인트 탭 (/?tab=endpoints)

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 엔드포인트 목록 페이지 접속 | 엔드포인트 카드들이 표시됨 | [ ] |
| 2 | 카드 위에 마우스 올리기 (축소 상태) | 미세한 3D tilt 효과 + 은은한 glare | [ ] |
| 3 | 카드 클릭하여 확장 | 확장 시 tilt/glare 효과가 비활성화됨 | [ ] |
| 4 | 확장된 카드 위에 마우스 이동 | tilt 효과 없이 정상적으로 컨텐츠 사용 가능 | [ ] |
| 5 | 카드 축소 후 다시 hover | tilt/glare 효과가 다시 활성화됨 | [ ] |

### STYLE-01-5: 테스트 결과 3D Flip 애니메이션

**확인 경로**: 테스트 결과 탭 (/?tab=testResults)

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 테스트 결과 대시보드 접속 | 4개 통계 카드가 표시됨 | [ ] |
| 2 | 통계 카드 클릭 | 카드가 Y축으로 180도 회전하여 뒷면이 보임 | [ ] |
| 3 | 뒷면 확인 | 상세 정보(성공/실패 건수, 트렌드 등)가 표시됨 | [ ] |
| 4 | 뒷면 카드 다시 클릭 | 카드가 원래 앞면으로 돌아감 | [ ] |
| 5 | 회전 애니메이션 부드러움 확인 | spring 타입의 자연스러운 회전 | [ ] |

### STYLE-01-6: 페이지 전환 3D Depth 트랜지션

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | PageTransition3D 컴포넌트 존재 확인 | src/components/ui/PageTransition3D.tsx 파일이 존재함 | [ ] |
| 2 | TypeScript 빌드 통과 | PageTransition3D 관련 타입 에러 없음 | [ ] |

---

## STYLE-02: 자동 분석 엔진 UI 재배치

### STYLE-02-1~4: SyncStatusPanel 동기화 상태 컴포넌트

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | SyncStatusPanel 컴포넌트 존재 확인 | src/components/SyncStatusPanel.tsx 파일이 존재함 | [ ] |
| 2 | TypeScript 빌드 통과 | SyncStatusPanel 관련 타입 에러 없음 | [ ] |
| 3 | 컴팩트 모드 렌더링 확인 | compact={true} 시 축약된 UI 표시 | [ ] |
| 4 | 전체 모드 렌더링 확인 | compact={false} 시 상세 UI 표시 | [ ] |
| 5 | 연결 상태 표시 확인 | gitUrl 있으면 "Git 연결됨", 없으면 "Git 미연결" | [ ] |
| 6 | 동기화 상태 변화 확인 | idle → syncing → success 순서로 상태 전환 | [ ] |
| 7 | 토스트 알림 확인 | 동기화 완료/실패 시 알림 토스트 표시 | [ ] |

---

## STYLE-03: 데이터 모델 CSS 수정

### STYLE-03-1: ModelExplorer 레이아웃 수정

**확인 경로**: 데이터 모델 탭 (/?tab=models)

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 데이터 모델 페이지 접속 | 모델 리스트와 상세 뷰가 좌우로 정상 배치됨 | [ ] |
| 2 | 브라우저 높이 축소 | min-height로 최소 높이가 유지됨 | [ ] |
| 3 | 브라우저 높이 확대 | max-height까지 늘어남 | [ ] |
| 4 | 모델 리스트 스크롤 | 리스트 영역에서 독립적으로 스크롤 가능 | [ ] |

### STYLE-03-2: 모델 트리뷰 CSS

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 모델 선택하여 트리뷰 확인 | 트리뷰 컨테이너가 V2 테마(흰색 배경, rounded-3xl, shadow-sm) | [ ] |
| 2 | 중첩 필드 확인 | 연결선이 border-l-2 border-slate-200으로 명확하게 보임 | [ ] |
| 3 | 트리 필드 hover | 필드 hover 시 bg-blue-50/80 배경색 | [ ] |
| 4 | 중첩 필드 확장/축소 | 토글 아이콘이 text-slate-400 색상으로 표시 | [ ] |

### STYLE-03-3: 필드 타입 뱃지 반응형

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 타입 뱃지 확인 | 파란색 뱃지(bg-blue-50, text-blue-600, border-blue-100) | [ ] |
| 2 | 필수 필드 뱃지 확인 | 장미색 뱃지(bg-rose-50, text-rose-600, border-rose-100) | [ ] |
| 3 | 모바일 화면에서 확인 | 타입 뱃지 텍스트 크기가 작아짐 (text-[10px]) | [ ] |

### STYLE-03-4: 모델 카드 V2 테마

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | 모델 리스트 사이드바 확인 | 흰색 배경, border-slate-200 테두리 | [ ] |
| 2 | 모델 상세 헤더 확인 | rounded-3xl, border-slate-200, shadow-sm | [ ] |
| 3 | TypeScript 코드 영역 확인 | bg-slate-50 배경, shadow-inner | [ ] |

---

## 빌드 검증

| # | 테스트 절차 | 예상 결과 | 통과 |
|---|------------|-----------|------|
| 1 | TypeScript 빌드 (`npx tsc --noEmit`) | Sprint 14 관련 에러 0건 | [ ] |
| 2 | Next.js 개발 서버 (`npm run dev`) | 정상 시작 | [ ] |
| 3 | 브라우저에서 페이지 로드 | 에러 없이 정상 표시 | [ ] |
| 4 | 콘솔 에러 확인 | Sprint 14 관련 런타임 에러 없음 | [ ] |

---

## 생성/수정된 파일 목록

| 파일 | 유형 | 변경 내용 |
|------|------|----------|
| `src/components/dashboard/DashboardOverview.tsx` | 수정 | 메트릭 카드에 Tilt3DCard 적용 |
| `src/components/layout/V2Sidebar.tsx` | 수정 | NavButton에 Glow + Depth Layer |
| `src/lib/design-system.ts` | 수정 | modal3DVariants 추가 |
| `src/components/ui/Modal3D.tsx` | 신규 | 3D 모달 래퍼 컴포넌트 |
| `src/components/ApiList.tsx` | 수정 | EndpointCardItem 분리, useTilt3D 적용 |
| `src/components/TestDashboard.tsx` | 수정 | FlipCard 컴포넌트, 통계 카드 flip |
| `src/components/ui/PageTransition3D.tsx` | 신규 | 페이지 전환 3D 래퍼 |
| `src/components/SyncStatusPanel.tsx` | 신규 | 동기화 상태 패널 |
| `src/components/ModelExplorer.tsx` | 수정 | 레이아웃 및 V2 테마 |
| `src/components/ApiModelTree.tsx` | 수정 | 트리뷰 CSS 및 V2 테마 |

---

## 테스트 완료 체크리스트

- [ ] STYLE-01-1: 메트릭 카드 3D Tilt 테스트 완료
- [ ] STYLE-01-2: 사이드바 활성 탭 Depth + Glow 테스트 완료
- [ ] STYLE-01-3: 모달 3D Perspective 애니메이션 테스트 완료
- [ ] STYLE-01-4: 엔드포인트 카드 호버 Tilt + Glare 테스트 완료
- [ ] STYLE-01-5: 테스트 결과 3D Flip 애니메이션 테스트 완료
- [ ] STYLE-01-6: 페이지 전환 3D Depth 트랜지션 테스트 완료
- [ ] STYLE-02-1~4: SyncStatusPanel 동기화 상태 컴포넌트 테스트 완료
- [ ] STYLE-03-1: ModelExplorer 레이아웃 수정 테스트 완료
- [ ] STYLE-03-2: 모델 트리뷰 CSS 수정 테스트 완료
- [ ] STYLE-03-3: 필드 타입 뱃지 반응형 테스트 완료
- [ ] STYLE-03-4: 모델 카드 V2 테마 적용 테스트 완료
- [ ] 빌드 검증 완료

---

## 수동 테스트 환경 설정

### 서버 시작
```bash
cd /Volumes/jinseok-SSD-1tb/03_apihub
npm run dev
```

### 테스트 접속
- 기본 대시보드: http://localhost:3000
- 엔드포인트 탭: http://localhost:3000?tab=endpoints
- 데이터 모델 탭: http://localhost:3000?tab=models
- 테스트 결과 탭: http://localhost:3000?tab=testResults

### 브라우저 개발자 도구 확인
- Console 탭: 런타임 에러 확인
- Elements 탭: CSS 클래스 및 스타일 검증
- Performance 탭: 애니메이션 부드러움 확인

---

## 테스트 진행 방법

1. 위 환경 설정을 따라 개발 서버 시작
2. 각 섹션별로 단계적으로 테스트 수행
3. 각 항목 완료 시 `[ ]` 체크박스에 `[x]` 표기
4. 실패한 항목이 있으면 보고서에 스크린샷 및 에러 메시지 첨부
5. 모든 테스트 완료 후 "테스트 완료 체크리스트" 확인

---

**작성자**: API Hub 개발팀
**마지막 수정**: 2026-01-28
