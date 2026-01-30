#!/bin/bash

# Insite API Hub Remote Deployment Script

echo "🚀 Insite API Hub 배포를 시작합니다..."

# 1. Docker 설치 확인
if ! which docker &> /dev/null && ! [ -x "/usr/bin/docker" ]; then
  echo "❌ Error: Docker가 설치되어 있지 않습니다. Docker를 먼저 설치해주세요." >&2
  exit 1
fi

if ! which docker-compose &> /dev/null && ! [ -x "/usr/bin/docker-compose" ] && ! [ -x "/usr/local/bin/docker-compose" ]; then
  echo "❌ Error: Docker Compose가 설치되어 있지 않습니다. Docker Compose를 먼저 설치해주세요." >&2
  exit 1
fi

# 2. 기존 컨테이너 정리 (이전 이름의 컨테이너가 있을 경우)
echo "🧹 기존 컨테이너 정리 중..."
sudo docker rm -f apihub-app apihub-db 2>/dev/null || true

# 3. 이미지 빌드 및 컨테이너 실행 (sudo 권한 사용)
echo "📦 Docker 컨테이너를 빌드하고 실행합니다 (Port - App:3005, DB:7000)..."
sudo docker-compose up -d --build

if [ $? -ne 0 ]; then
  echo "❌ Docker Compose 실행 중 오류가 발생했습니다."
  exit 1
fi

# 4. 상태 확인
echo "⏳ 상태 확인 중..."
sleep 5
sudo docker ps | grep insite

echo ""
echo "✅ 배포가 완료되었습니다!"
echo "🌐 App: http://$(hostname -I | awk '{print $1}'):3005"
echo "🐘 DB (External): $(hostname -I | awk '{print $1}'):7000"
echo ""
echo "💡 유용한 명령어:"
echo "   - 로그 확인: sudo docker-compose logs -f"
echo "   - App 로그: sudo docker logs insite-api-app -f"
echo "   - DB 로그: sudo docker logs insite-api-db -f"
echo "   - 중지: sudo docker-compose down"
echo "   - 재시작: sudo docker-compose restart"
