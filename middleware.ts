import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    try {
        const { pathname } = request.nextUrl;
        
        // 인증이 필요 없는 경로들
        const publicPaths = ['/auth'];
        const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
        
        // 정적 파일들은 통과
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/favicon.ico') ||
            pathname.startsWith('/public')
        ) {
            return NextResponse.next();
        }
        
        // API 경로는 세션 체크를 API 자체에서 처리하도록 통과
        // (API에서 필요시 인증 체크 수행)
        if (pathname.startsWith('/api')) {
            return NextResponse.next();
        }
        
        // 동적 라우트 경로에서 API 요청인지 확인
        // Accept 헤더로 구분 (API 요청은 application/json을 포함)
        const acceptHeader = request.headers.get('accept') || '';
        const isApiRequest = acceptHeader.includes('application/json') || 
                            request.headers.get('content-type')?.includes('application/json');
        
        // 동적 라우트이고 API 요청인 경우 Route Handler로 통과
        // (Route Handler가 처리하도록 함)
        if (isApiRequest && !pathname.startsWith('/api')) {
            return NextResponse.next();
        }
        
        // 공개 경로는 통과
        if (isPublicPath) {
            return NextResponse.next();
        }
        
        // 세션 쿠키 확인
        const sessionCookie = request.cookies.get('session');
        
        // 세션이 없으면 auth 페이지로 리다이렉트
        if (!sessionCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth';
            url.searchParams.set('redirect', pathname);
            return NextResponse.redirect(url);
        }
        
        // 세션이 있으면 통과
        return NextResponse.next();
    } catch (error) {
        // 미들웨어에서 에러 발생 시 로깅하고 통과
        // Next.js가 자동으로 error.tsx를 처리함
        console.error('Middleware error:', error);
        // 에러가 발생해도 요청을 통과시켜 Next.js의 에러 핸들링이 작동하도록 함
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};

