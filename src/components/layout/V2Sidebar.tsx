'use client';

import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
    List,
    Layers,
    Zap,
    ArrowUpDown,
    History,
    Settings,
    Users,
    Folder,
    Network
} from "lucide-react";

export type V2NavItem =
    | 'endpoints'
    | 'models'
    | 'test'
    | 'scenarios'
    | 'versions'
    | 'environments'
    | 'teams'
    | 'projects'
    | 'hierarchy';

interface NavItemConfig {
    id: V2NavItem;
    label: string;
    icon: ReactNode;
    href?: string;
}

const navItems: NavItemConfig[] = [
    { id: 'endpoints', label: '엔드포인트', icon: <List className="w-4 h-4" />, href: '/?tab=endpoints' },
    { id: 'models', label: '데이터 모델', icon: <Layers className="w-4 h-4" />, href: '/?tab=models' },
    { id: 'test', label: 'API 테스트', icon: <Zap className="w-4 h-4" />, href: '/?tab=test' },
    { id: 'scenarios', label: '자동화 시나리오', icon: <ArrowUpDown className="w-4 h-4" />, href: '/?tab=scenarios' },
    { id: 'versions', label: '변경 이력', icon: <History className="w-4 h-4" />, href: '/?tab=versions' },
    { id: 'environments', label: '서버 설정', icon: <Settings className="w-4 h-4" />, href: '/?tab=environments' },
];

const managementItems: NavItemConfig[] = [
    { id: 'teams', label: '팀 관리', icon: <Users className="w-4 h-4" />, href: '/teams' },
    { id: 'projects', label: '프로젝트 관리', icon: <Folder className="w-4 h-4" />, href: '/projects' },
    { id: 'hierarchy', label: '전사 계층 구조', icon: <Network className="w-4 h-4" />, href: '/hierarchy' },
];

interface V2SidebarProps {
    activeTab: V2NavItem;
    onTabChange?: (tab: V2NavItem) => void;
    showManagementSection?: boolean;
    avatar?: string;
    isMobileMenuOpen?: boolean;
    onMobileMenuToggle?: () => void;
}

export function V2Sidebar({
    activeTab,
    onTabChange,
    showManagementSection = true,
    avatar,
    isMobileMenuOpen = false,
    onMobileMenuToggle
}: V2SidebarProps) {
    const handleNavClick = (item: NavItemConfig) => {
        if (item.href) {
            window.location.href = item.href;
        } else if (onTabChange) {
            onTabChange(item.id);
        }
        // Close mobile menu after navigation
        if (isMobileMenuOpen && onMobileMenuToggle) {
            onMobileMenuToggle();
        }
    };

    const sidebarContent = (
        <>
            {/* 메인 네비게이션 */}
            {navItems.map((item) => (
                <NavButton
                    key={item.id}
                    item={item}
                    isActive={activeTab === item.id}
                    onClick={() => handleNavClick(item)}
                />
            ))}

            {/* 구분선 */}
            {showManagementSection && (
                <>
                    <div className="w-10 h-px bg-slate-100 my-2" />

                    {/* 관리 섹션 */}
                    {managementItems.map((item) => (
                        <NavButton
                            key={item.id}
                            item={item}
                            isActive={activeTab === item.id}
                            onClick={() => handleNavClick(item)}
                        />
                    ))}
                </>
            )}

            {/* 하단 아바타 */}
            <div className="mt-auto p-4 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer overflow-hidden">
                    {avatar ? (
                        <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="avatar" />
                    )}
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-24 bg-white border-r border-slate-100 flex-col items-center py-8 gap-4 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="md:hidden fixed inset-0 bg-slate-900/50 z-40"
                        onClick={onMobileMenuToggle}
                    />
                    <aside className="md:hidden fixed left-0 top-0 h-full w-24 bg-white border-r border-slate-100 flex flex-col items-center py-8 gap-4 z-50 shadow-xl animate-in slide-in-from-left duration-300">
                        {sidebarContent}
                    </aside>
                </>
            )}
        </>
    );
}

interface NavButtonProps {
    item: NavItemConfig;
    isActive: boolean;
    onClick: () => void;
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
                group relative w-14 h-14 flex items-center justify-center rounded-[1.25rem] transition-all duration-300
                ${isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110'
                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}
            `}
        >
            <div className="relative z-10 transition-transform group-hover:scale-110">
                {item.icon}
            </div>

            {/* 툴팁 */}
            <div className="absolute left-20 px-3 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-x-[-10px] group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-[100] shadow-2xl flex items-center">
                {item.label}
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
            </div>

            {isActive && (
                <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-[-8px] w-[4px] h-8 bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
        </button>
    );
}
