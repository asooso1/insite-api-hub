# Settings 컴포넌트 사용 가이드

## 개요
NotificationSettings와 DigestSettings 컴포넌트는 실제 세션 기반 userId를 필수 props로 받도록 수정되었습니다.

## 수정 내용

### NotificationSettings
- **파일**: `src/components/settings/NotificationSettings.tsx`
- **변경사항**:
  - 라인 124, 138의 `'current-user-id'` 하드코딩 제거
  - `userId: string` props 추가
  - useEffect dependency에 userId 추가

### DigestSettings
- **파일**: `src/components/settings/DigestSettings.tsx`
- **변경사항**:
  - 라인 73, 88의 `'current-user-id'` 하드코딩 제거
  - `userId: string` props 추가
  - useEffect dependency에 userId 추가

## 사용 방법

### 페이지에서 사용 예시

```tsx
// src/app/settings/page.tsx (예시)
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import NotificationSettings from '@/components/settings/NotificationSettings';
import DigestSettings from '@/components/settings/DigestSettings';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div className="space-y-8">
      <NotificationSettings userId={session.user.id} />
      <DigestSettings userId={session.user.id} />
    </div>
  );
}
```

### Client 컴포넌트에서 사용 예시

```tsx
'use client';

import { useSession } from 'next-auth/react';
import NotificationSettings from '@/components/settings/NotificationSettings';
import DigestSettings from '@/components/settings/DigestSettings';

export default function SettingsClient() {
  const { data: session } = useSession();

  if (!session?.user?.id) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div className="space-y-8">
      <NotificationSettings userId={session.user.id} />
      <DigestSettings userId={session.user.id} />
    </div>
  );
}
```

## 주의사항

1. **필수 Props**: `userId`는 필수 props이므로 반드시 전달해야 합니다.
2. **세션 검증**: 컴포넌트 사용 전에 세션 유효성을 확인하세요.
3. **타입 안정성**: TypeScript가 userId 누락 시 컴파일 에러를 발생시킵니다.

## 테스트 체크리스트

- [ ] 로그인한 사용자의 알림 설정이 올바르게 로드되는지 확인
- [ ] 다른 사용자로 로그인 시 해당 사용자의 설정이 로드되는지 확인
- [ ] 설정 변경이 올바른 사용자에게 저장되는지 확인
- [ ] 로그아웃 후 페이지 접근 시 적절한 에러 처리가 되는지 확인
