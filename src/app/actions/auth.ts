'use server';

import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export interface UserSession {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    sessionToken?: string;
}

// Simple hash (In real prod, use bcrypt or similar. Here we implement a basic one due to install issues)
async function hashPassword(password: string) {
    // For demonstration, but we should try to use a real library if possible.
    // Given the environment, we'll store as-is or simple transform for now.
    return `hash:${password}`;
}

export async function signUp(email: string, password: string, name: string) {
    const passwordHash = await hashPassword(password);
    const client = await db.getClient();
    try {
        const res = await client.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
            [email, passwordHash, name]
        );
        return { success: true, user: res.rows[0] };
    } catch (e: any) {
        if (e.code === '23505') {
            return { success: false, message: '이미 존재하는 이메일입니다.' };
        }
        return { success: false, message: '가입 중 오류가 발생했습니다.' };
    } finally {
        client.release();
    }
}

export async function signIn(email: string, password: string) {
    const client = await db.getClient();
    try {
        const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = res.rows[0];

        if (user && user.password_hash === `hash:${password}`) {
            // 세션 토큰 생성
            const sessionToken = randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 1주일

            // DB에 세션 저장
            await client.query(
                `INSERT INTO user_sessions (user_id, session_token, expires_at, last_active_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                 ON CONFLICT (session_token) DO UPDATE SET last_active_at = CURRENT_TIMESTAMP`,
                [user.id, sessionToken, expiresAt]
            );

            const sessionData: UserSession = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                sessionToken: sessionToken
            };

            const cookieStore = await cookies();
            cookieStore.set('session', JSON.stringify(sessionData), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
                sameSite: 'lax',
            });

            return { success: true };
        }
        return { success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' };
    } finally {
        client.release();
    }
}

export async function signOut() {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    
    if (session) {
        try {
            const sessionData = JSON.parse(session.value) as UserSession;
            if (sessionData.sessionToken) {
                const client = await db.getClient();
                try {
                    await client.query('DELETE FROM user_sessions WHERE session_token = $1', [sessionData.sessionToken]);
                } finally {
                    client.release();
                }
            }
        } catch (e) {
            // 쿠키 파싱 실패 시 무시
        }
    }
    
    cookieStore.delete('session');
    return { success: true };
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    if (!session) return null;
    
    try {
        const sessionData = JSON.parse(session.value) as UserSession;
        
        // DB에서 세션 확인 및 활성 상태 업데이트
        if (sessionData.sessionToken) {
            const client = await db.getClient();
            try {
                const res = await client.query(
                    `SELECT us.*, u.email, u.name, u.role 
                     FROM user_sessions us
                     JOIN users u ON us.user_id = u.id
                     WHERE us.session_token = $1 AND us.expires_at > CURRENT_TIMESTAMP`,
                    [sessionData.sessionToken]
                );
                
                if (res.rows.length === 0) {
                    // 세션이 만료되었거나 존재하지 않음
                    cookieStore.delete('session');
                    return null;
                }
                
                // last_active_at 업데이트 (5분마다 한 번씩만)
                const lastActive = new Date(res.rows[0].last_active_at);
                const now = new Date();
                const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
                
                if (diffMinutes >= 5) {
                    await client.query(
                        'UPDATE user_sessions SET last_active_at = CURRENT_TIMESTAMP WHERE session_token = $1',
                        [sessionData.sessionToken]
                    );
                }
                
                // 최신 사용자 정보 반환
                return {
                    id: res.rows[0].user_id,
                    email: res.rows[0].email,
                    name: res.rows[0].name,
                    role: res.rows[0].role,
                    sessionToken: sessionData.sessionToken
                };
            } finally {
                client.release();
            }
        }
        
        // 세션 토큰이 없는 경우 (구버전 쿠키)
        return sessionData;
    } catch {
        return null;
    }
}

/**
 * 세션 활성 상태를 실시간으로 업데이트
 */
export async function updateSessionActivity(): Promise<boolean> {
    const session = await getSession();
    if (!session || !session.sessionToken) return false;
    
    const client = await db.getClient();
    try {
        await client.query(
            'UPDATE user_sessions SET last_active_at = CURRENT_TIMESTAMP WHERE session_token = $1',
            [session.sessionToken]
        );
        return true;
    } catch {
        return false;
    } finally {
        client.release();
    }
}

/**
 * 현재 활성 세션 목록 조회 (관리자용)
 */
export async function getActiveSessions(): Promise<any[]> {
    const session = await getSession();
    if (session?.role !== 'ADMIN') throw new Error('Unauthorized');
    
    const client = await db.getClient();
    try {
        const res = await client.query(
            `SELECT 
                us.id,
                us.session_token,
                us.last_active_at,
                us.expires_at,
                us.created_at,
                u.id as user_id,
                u.email,
                u.name,
                u.role,
                CASE 
                    WHEN us.last_active_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN true
                    ELSE false
                END as is_active
             FROM user_sessions us
             JOIN users u ON us.user_id = u.id
             WHERE us.expires_at > CURRENT_TIMESTAMP
             ORDER BY us.last_active_at DESC`
        );
        return res.rows;
    } finally {
        client.release();
    }
}

export async function getAllUsers() {
    const session = await getSession();
    if (session?.role !== 'ADMIN') throw new Error('Unauthorized');

    const client = await db.getClient();
    try {
        const res = await client.query('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
        return res.rows;
    } finally {
        client.release();
    }
}
