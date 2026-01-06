# 🚀 API Hub: Spring 2.x API Management Platform

API Hub는 Spring 2.x 마이크로서비스 프로젝트의 소스 코드를 분석하여 API 명세를 자동으로 추출하고, DTO/VO 구조를 시각화하며, 프론트엔드 협업 도구(Excel, TS Type)를 제공하는 플랫폼입니다.

## 📋 사전 요구 사항 (Requirements)

프로젝트를 실행하기 위해 다음 도구들이 시스템에 설치되어 있어야 합니다.

- **Node.js**: v18.17.0 이상 (Next.js 15 지원)
- **Git**: 서버 사이드에서 저장소를 클론하기 위해 필요합니다. `git` 명령어가 터미널에서 실행 가능해야 합니다.
- **OS**: macOS, Linux (Unix 기반 환경 권장 - `/tmp` 디렉토리 사용)

## ⚙️ 설정 가이드 (Setup)

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정 (Optional)
현재 버전은 로컬 개발을 위해 `mock-db.json`을 사용하므로 별도의 환경 변수 없이 즉시 실행 가능합니다. 추후 Supabase 연동 시 다음 변수가 필요합니다.

```env
# .env.local 파일 생성 시
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 실행 방법 (Usage)

### 1. 개발 서버 실행
```bash
npm run dev
```
실행 후 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 2. API 가져오기 (Import)
- 대시보드 상단의 **"Quick Discovery"** 섹션에서 분석할 Spring 프로젝트의 **Git URL**과 **브랜치**(예: main)를 입력합니다.
- **"Import API"** 버튼을 클릭하면 서버에서 클론 및 분석이 시작됩니다.
- 완료 후 자동으로 페이지가 갱신되며 추출된 API 목록이 표시됩니다.

### 3. 주요 기능 활용
- **API 목록**: 추출된 API의 Method, Path, Summary를 확인하고 필터링할 수 있습니다.
- **DTO 시각화**: 오른쪽 사이드바에서 중첩된 DTO 구조를 트리 형태로 확인하세요.
- **TypeScript 추출**: 모델 정보 하단의 코드 블록에서 TS 인터페이스를 복사(`Copy` 버튼)할 수 있습니다.
- **Excel 다운로드**: API 목록 우측 상단의 **"Export Excel"** 버튼을 클릭하여 전체 명세를 엑셀로 저장하세요.
- **환경 관리**: 사이드바의 **"Environments"** 메뉴에서 DEV/STG/PRD 서버 정보를 설정하고 Dooray 알림 웹훅을 등록하세요.

## 📁 주요 파일 구조
- `src/lib/parser/spring-parser.ts`: Java 소스 정적 분석 엔진
- `src/app/actions/import-repo.ts`: Git 클론 및 분석 워크플로우
- `src/components/ApiModelTree.tsx`: 재귀적 DTO/VO 시각화 컴포넌트
- `src/lib/utils/`: 엑셀 내보내기, TS 생성기, Dooray 연동 유틸리티

---
© 2026 API Hub Team. Designed for Seamless Developer Experience.
