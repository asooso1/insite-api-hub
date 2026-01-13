---
description: 작업 완료 후 항상 Git에 푸시하여 동기화하는 절차
---

// turbo-all
1. 작업이 완료되면 현재 변경 사항을 확인합니다.
```bash
git status
```

2. 모든 변경 사항을 스테이징하고 의미 있는 커밋 메시지와 함께 커밋합니다.
```bash
git add .
git commit -m "feat/fix: [작업 내용 요약]"
```

3. 원격 저장소에 푸시합니다.
```bash
git push origin main
```

4. `notify_user`를 통해 작업 완료 및 푸시 성공을 알립니다.
