import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const RESERVED_PREFIXES = ['admin', 'auth', '_next', 'favicon.ico'];

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const params = await context.params;
    const segments = params.path;
    const firstSegment = segments[0];

    // Avoid hijacking internal routes
    if (RESERVED_PREFIXES.includes(firstSegment)) {
        return NextResponse.json(
            { error: 'Not Found' },
            { status: 404 }
        );
    }

    const pathWithSlash = '/' + segments.join('/');
    const pathWithoutSlash = segments.join('/');

    try {
        const result = await db.query(
            "SELECT id, summary FROM endpoints WHERE (path = $1 OR path = $2) AND method = $3 LIMIT 1",
            [pathWithSlash, pathWithoutSlash, request.method]
        );

        if (result.rows.length > 0) {
            return NextResponse.json({
                success: true,
                message: `Global Mock response for ${pathWithSlash}`,
                endpointId: result.rows[0].id,
                summary: result.rows[0].summary,
                timestamp: new Date().toISOString()
            });
        }

        // API 요청이지만 엔드포인트가 없으면 404 JSON 응답
        return NextResponse.json(
            { error: `API Hub: Endpoint [${pathWithSlash}] not registered` },
            { status: 404 }
        );
    } catch (error) {
        console.error('Global Mock API Error:', error);
        // 에러 발생 시 에러를 throw하여 error.tsx를 트리거
        throw error;
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return GET(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return GET(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return GET(request, context);
}

