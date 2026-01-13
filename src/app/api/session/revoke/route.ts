import { NextResponse } from 'next/server';
import { getSession } from '@/app/actions/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const { sessionToken } = await request.json();
        if (!sessionToken) {
            return NextResponse.json(
                { error: '세션 토큰이 필요합니다.' },
                { status: 400 }
            );
        }

        const client = await db.getClient();
        try {
            await client.query(
                'DELETE FROM user_sessions WHERE session_token = $1',
                [sessionToken]
            );
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json(
            { error: '세션 종료 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

