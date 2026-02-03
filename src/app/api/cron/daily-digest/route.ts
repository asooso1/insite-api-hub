import { NextRequest, NextResponse } from 'next/server';
import { sendDailyDigests } from '@/app/actions/digest';

/**
 * 일일 다이제스트 발송 크론 작업
 *
 * GET /api/cron/daily-digest?secret=xxx
 *
 * 외부 스케줄러(예: Vercel Cron, GitHub Actions)에서 호출하여
 * 모든 사용자에게 일일 다이제스트를 발송합니다.
 *
 * @param request - Next.js 요청 객체
 * @returns 발송 결과
 */
export async function GET(request: NextRequest) {
    try {
        // 보안: secret 검증
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (!process.env.CRON_SECRET) {
            console.error('[Cron] CRON_SECRET not configured');
            return NextResponse.json(
                { error: 'Cron job not configured' },
                { status: 500 }
            );
        }

        if (secret !== process.env.CRON_SECRET) {
            console.warn('[Cron] Unauthorized daily digest request');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 다이제스트 발송
        console.log('[Cron] Starting daily digest job');
        const result = await sendDailyDigests();

        console.log('[Cron] Daily digest job completed:', result);
        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Cron] Daily digest job failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to send daily digests',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
