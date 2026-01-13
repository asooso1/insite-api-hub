'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Animated 404 */}
                <div className="relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.6 }}
                        className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 leading-none"
                    >
                        404
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AlertCircle className="w-16 h-16 md:w-24 md:h-24 text-blue-200 animate-pulse" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        페이지를 찾을 수 없습니다
                    </h1>
                    <p className="text-lg text-slate-600 font-medium">
                        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                        href="/"
                        className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
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
                <div className="pt-8 border-t border-slate-200">
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" />
                        다른 페이지를 찾고 계신가요?{' '}
                        <Link href="/" className="text-blue-600 hover:text-blue-700 font-bold underline">
                            대시보드
                        </Link>
                        {' '}에서 시작하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}

