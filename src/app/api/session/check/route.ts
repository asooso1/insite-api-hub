import { NextResponse } from 'next/server';
import { updateSessionActivity, getSession } from '@/app/actions/auth';

export async function POST() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ valid: false, message: '세션이 없습니다.' }, { status: 401 });
        }

        // 세션 활성 상태 업데이트
        const updated = await updateSessionActivity();
        
        return NextResponse.json({
            valid: true,
            session: {
                id: session.id,
                email: session.email,
                name: session.name,
                role: session.role
            },
            updated
        });
    } catch (error) {
        return NextResponse.json(
            { valid: false, message: '세션 확인 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        return NextResponse.json({
            valid: true,
            session: {
                id: session.id,
                email: session.email,
                name: session.name,
                role: session.role
            }
        });
    } catch (error) {
        return NextResponse.json(
            { valid: false, message: '세션 확인 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

