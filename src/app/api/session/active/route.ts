import { NextResponse } from 'next/server';
import { getActiveSessions } from '@/app/actions/auth';

export async function GET() {
    try {
        const sessions = await getActiveSessions();
        return NextResponse.json({ sessions });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }
        return NextResponse.json(
            { error: '세션 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

