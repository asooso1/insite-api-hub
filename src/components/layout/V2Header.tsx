'use client';

import { Search, Bell, UserCircle, Zap, ArrowRight, Menu } from "lucide-react";
import { UserSession, signOut } from "@/app/actions/auth";

interface V2HeaderProps {
    session: UserSession | null;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    searchPlaceholder?: string;
    showSearch?: boolean;
    onMobileMenuToggle?: () => void;
}

export function V2Header({
    session,
    searchQuery = "",
    onSearchChange,
    searchPlaceholder = "빠른 검색...",
    showSearch = true,
    onMobileMenuToggle
}: V2HeaderProps) {
    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 shadow-sm dark:shadow-slate-950/20 transition-colors duration-300">
            <div className="flex items-center gap-8">
                {onMobileMenuToggle && (
                    <button
                        onClick={onMobileMenuToggle}
                        className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
                <a href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200 dark:shadow-blue-900/50">
                        <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
                        API HUB <span className="text-blue-600 dark:text-blue-400 text-sm">v2.0</span>
                    </h1>
                </a>

                {showSearch && (
                    <div className="hidden md:flex items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700 group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 mr-2" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="bg-transparent text-xs font-medium outline-none w-64 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                </button>
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none">{session?.name || '사용자'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-tight uppercase">
                            {session?.role === 'ADMIN' ? '시스템 관리자' : '프로젝트 멤버'}
                        </p>
                    </div>
                    <div className="relative group/user">
                        <UserCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 cursor-pointer group-hover/user:text-blue-500 transition-colors" />
                        <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all p-2 z-[100] scale-95 group-hover/user:scale-100 origin-top-right">
                            {session?.role === 'ADMIN' && (
                                <button
                                    onClick={() => window.location.href = '/admin'}
                                    className="w-full text-left px-4 py-3 text-[11px] font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all flex items-center justify-between group/btn"
                                >
                                    <span>시스템 백오피스 관리</span>
                                    <ArrowRight className="w-3 h-3 translate-x-1 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                                </button>
                            )}
                            <div className="h-px bg-slate-50 dark:bg-slate-700 my-1" />
                            <button
                                onClick={() => {
                                    signOut();
                                    window.location.reload();
                                }}
                                className="w-full text-left px-4 py-3 text-[11px] font-black text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
