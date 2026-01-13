import { notFound } from 'next/navigation';

const RESERVED_PREFIXES = ['admin', 'auth', '_next', 'favicon.ico', 'api'];

export const dynamic = 'force-dynamic';

export default async function DynamicPage({
    params,
}: {
    params: Promise<{ path: string[] }>;
}) {
    const resolvedParams = await params;
    const segments = resolvedParams.path;
    const firstSegment = segments[0];

    // 내부 라우트는 404 처리
    if (RESERVED_PREFIXES.includes(firstSegment)) {
        notFound();
    }

    // 존재하지 않는 페이지는 404 처리
    // not-found.tsx가 자동으로 렌더링됨
    notFound();
}

