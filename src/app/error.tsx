'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // 에러 로깅 (실제 프로덕션에서는 에러 리포팅 서비스로 전송)
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Animated Error Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="flex justify-center"
                >
                    <div className="relative">
                        <AlertTriangle className="w-24 h-24 md:w-32 md:h-32 text-red-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-100 rounded-full animate-ping opacity-75" />
                        </div>
                    </div>
                </motion.div>

                {/* Error Message */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        문제가 발생했습니다
                    </h1>
                    <p className="text-lg text-slate-600 font-medium">
                        예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                    </p>
                    {error.digest && (
                        <p className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-lg inline-block">
                            에러 ID: {error.digest}
                        </p>
                    )}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                            <p className="text-xs font-bold text-red-800 mb-2">개발 모드 - 에러 상세:</p>
                            <pre className="text-[10px] text-red-600 overflow-auto">
                                {error.message}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                        onClick={reset}
                        className="group flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        다시 시도
                    </button>
                    <Link
                        href="/"
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-black text-sm hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        홈으로 돌아가기
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-black text-sm hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        이전 페이지
                    </button>
                </div>

                {/* Help Text */}
                <div className="pt-8 border-t border-red-200">
                    <p className="text-sm text-slate-600">
                        문제가 계속되면 관리자에게 문의해주세요.
                    </p>
                </div>
            </div>
        </div>
    );
}

