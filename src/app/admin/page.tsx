'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, UserSession, getSession } from '@/app/actions/auth';
import { useToast } from '@/components/ui/Toast';
import {
    Users,
    Shield,
    Activity,
    Search,
    MoreVertical,
    Lock,
    Mail,
    Calendar,
    ChevronRight,
    LayoutDashboard,
    ArrowLeft,
    RefreshCcw,
    Zap,
    ExternalLink,
    Clock,
    LogOut,
    Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'users' | 'sessions';

export default function AdminBackoffice() {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionSearchQuery, setSessionSearchQuery] = useState('');
    const [session, setSession] = useState<UserSession | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const checkAuth = async () => {
            const currentSession = await getSession();
            if (!currentSession || currentSession.role !== 'ADMIN') {
                showToast('권한이 없습니다.', 'error');
                window.location.href = '/';
                return;
            }
            setSession(currentSession);
            loadUsers();
            loadSessions();
        };
        checkAuth();
    }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (err) {
            showToast('데이터 조회 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function loadSessions() {
        setSessionsLoading(true);
        try {
            const response = await fetch('/api/session/active');
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            } else {
                showToast('세션 조회 중 오류가 발생했습니다.', 'error');
            }
        } catch (err) {
            showToast('세션 조회 중 오류가 발생했습니다.', 'error');
        } finally {
            setSessionsLoading(false);
        }
    }

    async function revokeSession(sessionToken: string) {
        try {
            const response = await fetch('/api/session/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken })
            });
            if (response.ok) {
                showToast('세션이 강제 종료되었습니다.', 'success');
                loadSessions();
            } else {
                showToast('세션 종료 중 오류가 발생했습니다.', 'error');
            }
        } catch (err) {
            showToast('세션 종료 중 오류가 발생했습니다.', 'error');
        }
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSessions = sessions.filter(s =>
        s.email?.toLowerCase().includes(sessionSearchQuery.toLowerCase()) ||
        s.name?.toLowerCase().includes(sessionSearchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <Zap className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">보안 세션 확인 중...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
            {/* Glassmorphism Header */}
            <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">
                            <Shield className="w-3 h-3" />
                            <span>루트 시스템 관리자 (Root Admin)</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">시스템 중앙 백오피스</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col text-right mr-2">
                        <p className="text-xs font-black text-slate-800 leading-none">{session?.name}</p>
                        <p className="text-[10px] text-emerald-600 font-black tracking-tighter uppercase flex items-center justify-end gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            보안 세션 활성화
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (activeTab === 'users') {
                                loadUsers();
                            } else {
                                loadSessions();
                            }
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" /> 데이터 새로고침
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto p-10 space-y-10">
                {/* Tab Navigation */}
                <div className="flex items-center gap-4 bg-white rounded-[2rem] border border-slate-200 p-2 shadow-sm">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 px-6 py-3.5 rounded-[1.5rem] text-sm font-black transition-all ${
                            activeTab === 'users'
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Users className="w-4 h-4" />
                            사용자 관리
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('sessions');
                            loadSessions();
                        }}
                        className={`flex-1 px-6 py-3.5 rounded-[1.5rem] text-sm font-black transition-all ${
                            activeTab === 'sessions'
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Monitor className="w-4 h-4" />
                            활성 세션 관리
                        </div>
                    </button>
                </div>

                {/* Visual Stats Bento */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard 
                        label="전체 사용자" 
                        value={users.length} 
                        suffix="명" 
                        icon={<Users />} 
                        color="blue" 
                        description="시스템에 등록된 총 계정 수" 
                    />
                    <StatCard 
                        label="관리자 계정" 
                        value={users.filter(u => u.role === 'ADMIN').length} 
                        suffix="명" 
                        icon={<Shield />} 
                        color="rose" 
                        description="루트 권한 보유 사용자" 
                    />
                    <StatCard 
                        label="활성 세션" 
                        value={sessions.filter(s => s.is_active).length} 
                        suffix="개" 
                        icon={<Activity />} 
                        color="emerald" 
                        description="현재 활성화된 세션 수" 
                    />
                    <StatCard 
                        label="전체 세션" 
                        value={sessions.length} 
                        suffix="개" 
                        icon={<Monitor />} 
                        color="slate" 
                        description="만료되지 않은 모든 세션" 
                    />
                </div>

                {/* Main Data Table */}
                {activeTab === 'users' ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden group">
                        <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">사용자 디렉토리 관리</h3>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase">DB Live</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">시스템 전체 사용자의 권한 및 상태를 제어합니다.</p>
                            </div>
                            <div className="relative group/search">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="이름 또는 이메일로 검색..."
                                    className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm w-full md:w-80 transition-all shadow-inner"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">사용자 프로필</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">계정 등급</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">가입 일자</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">현재 상태</th>
                                    <th className="px-10 py-5 border-b border-slate-100"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {filteredUsers.map((user, idx) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-blue-50/30 transition-all group/row cursor-default"
                                        >
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm group-hover/row:border-blue-200 group-hover/row:text-blue-500 transition-all">
                                                        {user.name?.[0] || user.email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 group-hover/row:text-blue-700 transition-colors">{user.name || '익명 사용자'}</p>
                                                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`
                                                    px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight
                                                    ${user.role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}
                                                `}>
                                                    {user.role === 'ADMIN' ? 'ROOT ADMIN' : 'MEMBER'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                                                    <Calendar className="w-4 h-4 text-slate-300" />
                                                    {new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                    <span className="text-[11px] font-black text-emerald-600 tracking-tight uppercase">온라인 (Active)</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-95">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden group">
                        <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">활성 세션 관리</h3>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase">Live</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">현재 시스템에 로그인된 모든 세션을 모니터링하고 관리합니다.</p>
                            </div>
                            <div className="relative group/search">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="사용자 이름 또는 이메일로 검색..."
                                    className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm w-full md:w-80 transition-all shadow-inner"
                                    value={sessionSearchQuery}
                                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {sessionsLoading ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                    <Zap className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">세션 데이터 로딩 중...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">사용자</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">세션 상태</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">마지막 활동</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">세션 생성</th>
                                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">만료 예정</th>
                                            <th className="px-10 py-5 border-b border-slate-100"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence mode="popLayout">
                                            {filteredSessions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-10 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Monitor className="w-12 h-12 text-slate-300" />
                                                            <p className="text-sm font-black text-slate-400">활성 세션이 없습니다</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSessions.map((sess, idx) => (
                                                    <motion.tr
                                                        key={sess.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="hover:bg-blue-50/30 transition-all group/row cursor-default"
                                                    >
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm group-hover/row:border-blue-200 group-hover/row:text-blue-500 transition-all">
                                                                    {sess.name?.[0] || sess.email[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 group-hover/row:text-blue-700 transition-colors">{sess.name || '익명 사용자'}</p>
                                                                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                                                        <Mail className="w-3 h-3" /> {sess.email}
                                                                    </p>
                                                                    <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                                                                        {sess.role === 'ADMIN' ? '관리자' : '일반 사용자'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            {sess.is_active ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                                    <span className="text-[11px] font-black text-emerald-600 tracking-tight uppercase">활성</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                                                    <span className="text-[11px] font-black text-slate-400 tracking-tight uppercase">비활성</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                                                                <Clock className="w-4 h-4 text-slate-300" />
                                                                {new Date(sess.last_active_at).toLocaleString('ko-KR', { 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                                                                <Calendar className="w-4 h-4 text-slate-300" />
                                                                {new Date(sess.created_at).toLocaleDateString('ko-KR', { 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6">
                                                            <div className="text-xs font-black text-slate-500">
                                                                {new Date(sess.expires_at).toLocaleDateString('ko-KR', { 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric'
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('이 세션을 강제 종료하시겠습니까?')) {
                                                                        revokeSession(sess.session_token);
                                                                    }
                                                                }}
                                                                className="p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm rounded-xl transition-all active:scale-95"
                                                                title="세션 강제 종료"
                                                            >
                                                                <LogOut className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                ))
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value, suffix = "", icon, color, description }: { label: string, value: any, suffix?: string, icon: any, color: string, description: string }) {
    const colorVariants: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100",
        slate: "bg-slate-50 text-slate-600 border-slate-100 shadow-slate-100"
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200/50 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="flex items-center justify-between mb-6">
                <div className={`p-3.5 rounded-2xl ${colorVariants[color]} border transition-all group-hover:scale-110`}>
                    {icon}
                </div>
                <div className="p-2 bg-slate-50 rounded-xl text-slate-300 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                    <ExternalLink className="w-4 h-4 " />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
            <div className="flex items-baseline gap-1 mb-2">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
                <span className="text-sm font-bold text-slate-400">{suffix}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight italic">
                * {description}
            </p>
        </div>
    );
}
