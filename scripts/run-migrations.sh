#!/bin/bash
# ==========================================
# DB 마이그레이션 실행 스크립트
# ==========================================
# 사용법: bash scripts/run-migrations.sh
#
# 환경변수:
# - DB_HOST: 데이터베이스 호스트 (기본값: localhost)
# - DB_PORT: 데이터베이스 포트 (기본값: 7000)
# - DB_NAME: 데이터베이스 이름 (기본값: apihub)
# - DB_USER: 데이터베이스 사용자 (기본값: apihub)
# - DB_PASS: 데이터베이스 비밀번호 (기본값: apihub_password)
# ==========================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경변수 또는 기본값
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-7000}
DB_NAME=${DB_NAME:-apihub}
DB_USER=${DB_USER:-apihub}
DB_PASS=${DB_PASS:-apihub_password}

# 스크립트 경로
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_FILE="$SCRIPT_DIR/apply-all-migrations.sql"

echo -e "${YELLOW}=========================================="
echo "DB 마이그레이션 실행"
echo -e "==========================================${NC}"
echo ""
echo "연결 정보:"
echo "  호스트: $DB_HOST"
echo "  포트: $DB_PORT"
echo "  데이터베이스: $DB_NAME"
echo "  사용자: $DB_USER"
echo ""

# 마이그레이션 파일 확인
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}오류: 마이그레이션 파일을 찾을 수 없습니다: $MIGRATION_FILE${NC}"
    exit 1
fi

# DB 연결 테스트
echo -e "${YELLOW}DB 연결 테스트 중...${NC}"
if ! PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}오류: 데이터베이스에 연결할 수 없습니다.${NC}"
    echo "연결 문자열: postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
    exit 1
fi
echo -e "${GREEN}DB 연결 성공!${NC}"
echo ""

# 마이그레이션 실행
echo -e "${YELLOW}마이그레이션 실행 중...${NC}"
echo ""

PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "마이그레이션이 성공적으로 완료되었습니다!"
    echo -e "==========================================${NC}"
else
    echo ""
    echo -e "${RED}=========================================="
    echo "마이그레이션 실행 중 오류가 발생했습니다."
    echo -e "==========================================${NC}"
    exit 1
fi
