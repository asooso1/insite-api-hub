# Sprint 17 - 일일 다이제스트 알림 테스트 체크리스트

## 테스트 개요
일일 다이제스트 알림 시스템의 기능을 검증합니다.

---

## 1. 데이터베이스 스키마

### 1.1 digest_settings 테이블 생성 확인
- [ ] PostgreSQL에서 `digest_settings` 테이블 존재 확인
  ```sql
  SELECT * FROM digest_settings LIMIT 1;
  ```
- [ ] 모든 컬럼이 올바르게 생성되었는지 확인:
  - `id`, `user_id`, `enabled`, `frequency`, `send_time`
  - `include_comments`, `include_api_changes`, `include_test_results`, `include_review_requests`
  - `created_at`, `updated_at`
- [ ] 인덱스 생성 확인: `idx_digest_settings_user_id`, `idx_digest_settings_enabled`

**예상 결과**: 테이블과 모든 컬럼, 인덱스가 정상적으로 존재

---

## 2. 다이제스트 설정 UI

### 2.1 다이제스트 설정 페이지 접근
- [ ] URL: `http://localhost:3005/settings` 접속
- [ ] "일일 다이제스트" 탭 또는 섹션 표시 확인
- [ ] 다이제스트 설정 UI가 정상적으로 렌더링됨

**예상 결과**: 다이제스트 설정 UI가 정상적으로 표시

### 2.2 다이제스트 활성화/비활성화 토글
- [ ] "다이제스트 활성화됨" 카드에서 토글 버튼 클릭
- [ ] 상태가 "비활성화됨"으로 변경됨
- [ ] 다시 토글하여 "활성화됨"으로 변경
- [ ] 네트워크 탭에서 API 호출 확인

**예상 결과**: 토글이 정상 작동하고 설정이 DB에 저장됨

### 2.3 발송 빈도 선택
- [ ] "매일", "매주", "사용 안 함" 버튼 클릭
- [ ] 각 버튼 클릭 시 UI가 즉시 업데이트됨
- [ ] "사용 안 함" 선택 시 발송 시간 및 포함 내용 섹션이 숨겨짐
- [ ] "매일" 또는 "매주" 선택 시 해당 섹션들이 다시 표시됨

**예상 결과**: 빈도 선택이 정상 작동하고 UI가 동적으로 변경됨

### 2.4 발송 시간 선택
- [ ] 시간 선택 input 필드 클릭
- [ ] 원하는 시간(예: 09:00) 선택
- [ ] 변경된 시간이 즉시 반영됨
- [ ] "매일 09:00" 또는 "매주 09:00" 배지가 표시됨

**예상 결과**: 시간 선택이 정상 작동하고 설정이 저장됨

### 2.5 포함할 내용 선택
- [ ] "새 댓글" 토글 클릭 → ON/OFF 전환 확인
- [ ] "API 변경사항" 토글 클릭 → ON/OFF 전환 확인
- [ ] "테스트 실패" 토글 클릭 → ON/OFF 전환 확인
- [ ] "리뷰 요청" 토글 클릭 → ON/OFF 전환 확인
- [ ] 각 토글 상태에 따라 "포함" 배지 표시/숨김 확인

**예상 결과**: 모든 포함 옵션 토글이 정상 작동함

### 2.6 설정 저장 확인
- [ ] 브라우저를 새로고침
- [ ] 이전에 설정한 값들이 그대로 유지됨
- [ ] DB에서 실제 저장된 값 확인:
  ```sql
  SELECT * FROM digest_settings WHERE user_id = 'current-user-id';
  ```

**예상 결과**: 설정이 DB에 저장되고 페이지 새로고침 후에도 유지됨

---

## 3. 다이제스트 생성 로직 (Server Actions)

### 3.1 generateDailyDigest 함수 테스트
- [ ] 테스트용 사용자 데이터 준비:
  - 사용자 생성
  - 프로젝트 및 엔드포인트 생성
  - 구독(endpoint_watchers) 추가
  - 테스트 댓글, API 변경, 테스트 실패 데이터 생성
- [ ] 서버 콘솔에서 함수 직접 호출 또는 API 테스트
- [ ] 반환된 `DigestData` 객체 확인:
  - `newComments` 배열에 최근 24시간 댓글 포함
  - `apiChanges` 배열에 API 변경 내역 포함
  - `testFailures` 배열에 테스트 실패 내역 포함
  - `reviewRequests` 배열에 리뷰 요청 내역 포함
  - `statusChanges` 배열에 상태 변경 내역 포함

**예상 결과**: 지난 24시간의 모든 관련 데이터가 올바르게 수집됨

### 3.2 getDigestSettings 함수 테스트
- [ ] 기존 사용자의 설정 조회
- [ ] 새로운 사용자(설정 없음)의 설정 조회 → 기본값 반환 확인
- [ ] 반환된 기본값 확인:
  - `enabled: true`
  - `frequency: 'daily'`
  - `send_time: '09:00'`
  - 모든 `include_*` 옵션이 `true`

**예상 결과**: 설정 조회가 정상 작동하고 기본값이 올바름

### 3.3 updateDigestSettings 함수 테스트
- [ ] 새로운 사용자 설정 생성(INSERT)
- [ ] 기존 사용자 설정 업데이트(UPDATE)
- [ ] 부분 업데이트 테스트 (예: `enabled`만 변경)
- [ ] DB에서 업데이트된 값 확인

**예상 결과**: 설정 생성 및 업데이트가 정상 작동함

---

## 4. Cron API 엔드포인트

### 4.1 보안 검증
- [ ] `GET /api/cron/daily-digest` (secret 없이) 호출
- [ ] 401 Unauthorized 응답 확인
- [ ] 잘못된 secret으로 호출
- [ ] 401 Unauthorized 응답 확인

**예상 결과**: secret 없이는 접근 불가

### 4.2 정상 호출
- [ ] `.env`에 `CRON_SECRET` 설정
  ```
  CRON_SECRET=your_cron_secret_here
  ```
- [ ] `GET /api/cron/daily-digest?secret=your_cron_secret_here` 호출
- [ ] 응답 확인:
  ```json
  {
    "success": true,
    "sent": 2,
    "failed": 0,
    "timestamp": "2026-02-03T12:00:00.000Z"
  }
  ```
- [ ] 서버 콘솔에서 로그 확인:
  - `[Cron] Starting daily digest job`
  - `[Digest] Found N users with daily digest enabled`
  - `[Digest] Sent digest to user ... (X items)`

**예상 결과**: 다이제스트가 활성화된 모든 사용자에게 알림 생성

### 4.3 알림 생성 확인
- [ ] DB에서 생성된 알림 확인:
  ```sql
  SELECT * FROM notifications WHERE type = 'DIGEST' ORDER BY created_at DESC LIMIT 10;
  ```
- [ ] `metadata` 필드에 `DigestData` 객체가 JSON 형태로 저장됨
- [ ] `message` 필드에 "지난 24시간 동안 X개의 업데이트가 있습니다." 메시지 포함

**예상 결과**: DIGEST 타입 알림이 DB에 정상적으로 생성됨

---

## 5. 외부 스케줄러 연동 (선택 사항)

### 5.1 GitHub Actions 크론 설정
- [ ] `.github/workflows/daily-digest.yml` 파일 생성
  ```yaml
  name: Daily Digest
  on:
    schedule:
      - cron: '0 0 * * *'  # 매일 UTC 00:00 (한국 시간 09:00)
  jobs:
    send-digest:
      runs-on: ubuntu-latest
      steps:
        - name: Send Daily Digest
          run: |
            curl -X GET "https://your-app.vercel.app/api/cron/daily-digest?secret=${{ secrets.CRON_SECRET }}"
  ```
- [ ] GitHub Secrets에 `CRON_SECRET` 추가
- [ ] 크론 작업이 예정된 시간에 실행되는지 확인

**예상 결과**: 매일 자동으로 다이제스트 발송

### 5.2 Vercel Cron 설정 (대안)
- [ ] `vercel.json` 파일 생성
  ```json
  {
    "crons": [{
      "path": "/api/cron/daily-digest?secret=$CRON_SECRET",
      "schedule": "0 0 * * *"
    }]
  }
  ```
- [ ] Vercel 대시보드에서 Environment Variable `CRON_SECRET` 설정
- [ ] 배포 후 크론 작업 실행 확인

**예상 결과**: Vercel에서 자동으로 다이제스트 발송

---

## 6. 통합 테스트

### 6.1 전체 플로우 테스트
1. [ ] 새 사용자 생성 및 로그인
2. [ ] 설정 페이지에서 다이제스트 활성화
3. [ ] 빈도: 매일, 시간: 09:00, 모든 내용 포함 설정
4. [ ] API 엔드포인트 구독 또는 소유자 등록
5. [ ] 테스트 데이터 생성:
   - 새 댓글 작성
   - API 변경 로그 추가
   - 테스트 실패 기록
   - 리뷰 요청 생성
6. [ ] Cron API 수동 호출
7. [ ] 알림 목록에서 다이제스트 알림 확인
8. [ ] 알림 클릭 시 상세 정보 표시 확인

**예상 결과**: 전체 플로우가 정상적으로 작동함

### 6.2 엣지 케이스
- [ ] 업데이트가 없는 경우 → 다이제스트 알림 생성 안 됨
- [ ] 다이제스트 비활성화 사용자 → 알림 생성 안 됨
- [ ] 모든 포함 옵션을 OFF로 설정 → 빈 다이제스트 또는 알림 없음
- [ ] 24시간 이전 데이터 → 다이제스트에 포함되지 않음

**예상 결과**: 모든 엣지 케이스가 올바르게 처리됨

---

## 7. 성능 및 확장성

### 7.1 대량 사용자 시뮬레이션
- [ ] 100명 이상의 테스트 사용자 생성
- [ ] 모두 다이제스트 활성화 설정
- [ ] Cron API 호출 시 실행 시간 측정
- [ ] 서버 메모리 및 CPU 사용률 확인

**예상 결과**: 대량 사용자에서도 성능 저하 없이 작동

### 7.2 DB 쿼리 최적화
- [ ] 실행되는 SQL 쿼리 로그 확인
- [ ] N+1 쿼리 문제 없는지 확인
- [ ] 인덱스가 적절히 사용되는지 확인 (EXPLAIN ANALYZE)

**예상 결과**: 쿼리가 최적화되어 있고 인덱스가 활용됨

---

## 8. 문서화

### 8.1 README 업데이트
- [ ] 다이제스트 기능 설명 추가
- [ ] 환경 변수(`CRON_SECRET`) 설정 방법 추가
- [ ] 크론 작업 설정 가이드 추가

**예상 결과**: README에 다이제스트 기능이 문서화됨

### 8.2 API 문서
- [ ] `/api/cron/daily-digest` 엔드포인트 문서화
- [ ] 요청/응답 예시 추가
- [ ] 보안 주의사항 명시

**예상 결과**: API 문서가 업데이트됨

---

## 테스트 완료 기준

- [ ] 모든 체크리스트 항목 통과
- [ ] 콘솔에 에러 로그 없음
- [ ] DB 스키마 정상 생성
- [ ] UI가 모든 브라우저에서 정상 작동
- [ ] Cron API가 보안되고 정상 작동
- [ ] 문서화 완료

---

## 발견된 이슈

| 번호 | 이슈 설명 | 심각도 | 상태 | 담당자 |
|------|-----------|--------|------|--------|
| 1    |           |        |      |        |
| 2    |           |        |      |        |

---

## 테스트 실행 정보

- **테스트 일자**:
- **테스터**:
- **환경**:
  - 서버:
  - DB:
  - 브라우저:
- **결과**: ⬜ 통과 / ⬜ 실패
