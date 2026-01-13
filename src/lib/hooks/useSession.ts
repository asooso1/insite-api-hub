'use client';

import { useEffect, useState } from 'react';
import { UserSession } from '@/app/actions/auth';

export function useSession() {
    const [session, setSession] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
        
        // 30초마다 세션 체크
        const interval = setInterval(() => {
            checkSession();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const checkSession = async () => {
        try {
            const response = await fetch('/api/session/check', {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    setSession(data.session);
                } else {
                    setSession(null);
                    // 세션이 없으면 auth 페이지로 리다이렉트
                    if (window.location.pathname !== '/auth') {
                        window.location.href = '/auth';
                    }
                }
            } else {
                setSession(null);
            }
        } catch (error) {
            console.error('Session check failed:', error);
            setSession(null);
        } finally {
            setLoading(false);
        }
    };

    return { session, loading, refreshSession: checkSession };
}

