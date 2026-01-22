'use client';

import { ReactNode, useEffect } from "react";
import { V2Header } from "./V2Header";
import { V2Sidebar, V2NavItem } from "./V2Sidebar";
import { useAuthStore, useUIStore } from "@/stores";
import { ChevronDown } from "lucide-react";

interface V2LayoutProps {
    children: ReactNode;
    activeTab: V2NavItem;
    onTabChange?: (tab: V2NavItem) => void;
    title: string;
    subtitle?: string;
    breadcrumb?: string[];
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    searchPlaceholder?: string;
    showSearch?: boolean;
    showManagementSection?: boolean;
    headerActions?: ReactNode;
}

export function V2Layout({
    children,
    activeTab,
    onTabChange,
    title,
    subtitle,
    breadcrumb = ["Workspace"],
    searchQuery,
    onSearchChange,
    searchPlaceholder,
    showSearch = true,
    showManagementSection = true,
    headerActions
}: V2LayoutProps) {
    const session = useAuthStore((state) => state.session);
    const fetchSession = useAuthStore((state) => state.fetchSession);
    const isMobileMenuOpen = useUIStore((state) => state.mobileSidebarOpen);
    const toggleMobileMenu = useUIStore((state) => state.toggleMobileSidebar);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-slate-900 font-sans selection:bg-blue-100">
            {/* 상단 헤더 */}
            <V2Header
                session={session}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                showSearch={showSearch}
                onMobileMenuToggle={toggleMobileMenu}
            />

            {/* 메인 레이아웃 */}
            <div className="pt-16 flex h-screen overflow-hidden">
                {/* 좌측 사이드바 */}
                <V2Sidebar
                    activeTab={activeTab}
                    onTabChange={onTabChange}
                    showManagementSection={showManagementSection}
                    avatar={session?.name ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.name}` : undefined}
                    isMobileMenuOpen={isMobileMenuOpen}
                    onMobileMenuToggle={toggleMobileMenu}
                />

                {/* 메인 컨텐츠 영역 */}
                <main className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
                    {/* 페이지 헤더 */}
                    <div className="flex-initial p-8 pb-4">
                        <div className="max-w-[1400px] mx-auto">
                            <div className="flex items-end justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div>
                                    <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        {breadcrumb.map((item, idx) => (
                                            <span key={idx} className={idx === breadcrumb.length - 1 ? "text-slate-800" : ""}>
                                                {item}
                                                {idx < breadcrumb.length - 1 && <ChevronDown className="w-3 h-3 inline ml-2 -rotate-90" />}
                                            </span>
                                        ))}
                                    </nav>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {title}
                                    </h2>
                                    {subtitle && (
                                        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                                    )}
                                </div>

                                {headerActions && (
                                    <div className="flex gap-2">
                                        {headerActions}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 컨텐츠 영역 */}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-20">
                        <div className="max-w-[1400px] mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// 공통 카드 컴포넌트
export function V2Card({
    children,
    className = "",
    hover = true
}: {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}) {
    return (
        <div className={`
            bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all
            ${hover ? 'hover:shadow-xl hover:shadow-slate-200/50' : ''}
            ${className}
        `}>
            {children}
        </div>
    );
}

// 공통 버튼 컴포넌트
export function V2Button({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    className = ""
}: {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}) {
    const variants = {
        primary: 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:shadow-blue-200',
        secondary: 'bg-white border border-slate-200 text-slate-700 shadow-sm hover:shadow-md',
        danger: 'bg-rose-500 text-white shadow-lg shadow-rose-100 hover:shadow-rose-200',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-[11px]',
        md: 'px-4 py-2 text-xs',
        lg: 'px-6 py-3 text-sm'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${variants[variant]}
                ${sizes[size]}
                font-black rounded-xl transition-all active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center gap-2
                ${className}
            `}
        >
            {children}
        </button>
    );
}

// 공통 모달 컴포넌트
export function V2Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    maxWidth = 'max-w-lg'
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
    maxWidth?: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={`
                relative w-full ${maxWidth} bg-white border border-slate-200
                rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden
                animate-in fade-in zoom-in-95 duration-200
            `}>
                <div className="p-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-1">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}

// 공통 입력 컴포넌트
export function V2Input({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    required = false,
    rows
}: {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'url';
    required?: boolean;
    rows?: number;
}) {
    const inputClass = `
        w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl
        text-sm text-slate-800 placeholder:text-slate-400
        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
        transition-all
    `;

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            {rows ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className={`${inputClass} resize-none`}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={inputClass}
                />
            )}
        </div>
    );
}

// 공통 스켈레톤 컴포넌트
export function V2Skeleton({
    className = "",
    variant = 'card',
    count = 1
}: {
    className?: string;
    variant?: 'card' | 'row' | 'text' | 'avatar';
    count?: number;
}) {
    const baseClass = "bg-white border border-slate-200 animate-pulse rounded-3xl";

    const variants = {
        card: "h-48",
        row: "h-16",
        text: "h-4 rounded-lg",
        avatar: "w-10 h-10 rounded-full"
    };

    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`${baseClass} ${variants[variant]} ${className}`} />
            ))}
        </>
    );
}
