#!/bin/bash

# API Hub Remote Deployment Script

echo "🚀 API Hub 배포를 시작합니다..."

# 1. Docker 설치 확인
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker가 설치되어 있지 않습니다. Docker를 먼저 설치해주세요." >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo "❌ Error: Docker Compose가 설치되어 있지 않습니다. Docker Compose를 먼저 설치해주세요." >&2
  exit 1
fi

# 2. 이미지 빌드 및 컨테이너 실행
echo "📦 Docker 컨테이너를 빌드하고 실행합니다 (Port - App:3000, DB:7000)..."
docker-compose up -d --build

# 3. 상태 확인
echo "⏳ 상태 확인 중..."
sleep 5
docker ps | grep apihub

echo "✅ 배포가 완료되었습니다!"
echo "🌐 App: http://your-server-ip:3000"
echo "🐘 DB (External): your-server-ip:7000"
echo "💡 로그 확인: docker-compose logs -f"
