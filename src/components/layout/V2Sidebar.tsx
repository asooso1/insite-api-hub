'use client';

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    List,
    Layers,
    Zap,
    ArrowUpDown,
    History,
    Settings,
    Users,
    Folder,
    Network,
    ChevronRight,
    ChevronLeft,
    FileCheck,
    AlertCircle
} from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";

export type V2NavItem =
    | 'endpoints'
    | 'models'
    | 'test'
    | 'scenarios'
    | 'testResults'
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
    badge?: number;
    badgeType?: 'default' | 'error' | 'warning';
    shortcut?: string;
}

interface NavGroup {
    title: string;
    items: NavItemConfig[];
}

// Tab groups
const navGroups: NavGroup[] = [
    {
        title: 'API 관리',
        items: [
            { id: 'endpoints', label: '엔드포인트', icon: <List className="w-4 h-4" />, href: '/?tab=endpoints', shortcut: '1' },
            { id: 'models', label: '데이터 모델', icon: <Layers className="w-4 h-4" />, href: '/?tab=models', shortcut: '2' },
            { id: 'versions', label: '변경 이력', icon: <History className="w-4 h-4" />, href: '/?tab=versions', badge: 3, shortcut: '3' },
        ],
    },
    {
        title: '테스트',
        items: [
            { id: 'test', label: 'API 테스트', icon: <Zap className="w-4 h-4" />, href: '/?tab=test', shortcut: '4' },
            { id: 'scenarios', label: '시나리오', icon: <ArrowUpDown className="w-4 h-4" />, href: '/?tab=scenarios', shortcut: '5' },
            { id: 'testResults', label: '테스트 결과', icon: <FileCheck className="w-4 h-4" />, href: '/?tab=testResults', badge: 2, badgeType: 'error', shortcut: '6' },
        ],
    },
    {
        title: '설정',
        items: [
            { id: 'environments', label: '서버 설정', icon: <Settings className="w-4 h-4" />, href: '/?tab=environments', shortcut: '7' },
            { id: 'teams', label: '팀 관리', icon: <Users className="w-4 h-4" />, href: '/?tab=teams', shortcut: '8' },
            { id: 'projects', label: '프로젝트 관리', icon: <Folder className="w-4 h-4" />, href: '/?tab=projects', shortcut: '9' },
            { id: 'hierarchy', label: '전사 계층 구조', icon: <Network className="w-4 h-4" />, href: '/?tab=hierarchy', shortcut: '0' },
        ],
    },
];

interface V2SidebarProps {
    activeTab: V2NavItem;
    onTabChange?: (tab: V2NavItem) => void;
    avatar?: string;
    isMobileMenuOpen?: boolean;
    onMobileMenuToggle?: () => void;
}

export function V2Sidebar({
    activeTab,
    onTabChange,
    avatar,
    isMobileMenuOpen = false,
    onMobileMenuToggle
}: V2SidebarProps) {
    const router = useRouter();
    const { sidebarExpanded, toggleSidebarExpanded } = useUIStore();
    const { session } = useAuthStore();
    const [isHovered, setIsHovered] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    // Calculate if sidebar should show as expanded
    const isExpanded = sidebarExpanded || isHovered;

    // Flatten all items for keyboard navigation
    const allItems = navGroups.flatMap(group => group.items);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Number shortcuts (1-9)
            if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const item = allItems.find(item => item.shortcut === e.key);
                if (item) {
                    e.preventDefault();
                    handleNavClick(item);
                }
            }

            // Tab navigation
            if (e.key === 'Tab' && e.shiftKey === false) {
                const inputs = ['INPUT', 'TEXTAREA', 'SELECT'];
                if (!inputs.includes((e.target as HTMLElement)?.tagName)) {
                    e.preventDefault();
                    setFocusedIndex((prev) => (prev + 1) % allItems.length);
                }
            }

            // Enter/Space to select focused item
            if ((e.key === 'Enter' || e.key === ' ') && focusedIndex >= 0) {
                e.preventDefault();
                handleNavClick(allItems[focusedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedIndex]);

    const handleNavClick = (item: NavItemConfig) => {
        // 내부 탭 전환 (/?tab=xxx 형태)
        if (item.href?.startsWith('/?tab=')) {
            if (onTabChange) {
                onTabChange(item.id);
            }
            router.push(item.href, { scroll: false });
        }
        // 외부 페이지 이동 (/teams, /projects 등)
        else if (item.href) {
            router.push(item.href);
        }
        // href 없이 onTabChange 콜백만 사용
        else if (onTabChange) {
            onTabChange(item.id);
        }

        // 모바일 메뉴 닫기
        if (isMobileMenuOpen && onMobileMenuToggle) {
            onMobileMenuToggle();
        }
    };

    const sidebarContent = (
        <motion.div
            className="flex flex-col h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header with toggle button */}
            <div className="px-4 py-6 flex items-center justify-between">
                <AnimatePresence mode="wait">
                    {isExpanded && (
                        <motion.h2
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                        >
                            Navigation
                        </motion.h2>
                    )}
                </AnimatePresence>

                <button
                    onClick={toggleSidebarExpanded}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {sidebarExpanded ? (
                        <ChevronLeft className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Navigation groups */}
            <div className="flex-1 overflow-y-auto px-3 space-y-6">
                {navGroups.map((group, groupIndex) => (
                    <div key={group.title}>
                        {/* Group title */}
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-3 mb-2 overflow-hidden"
                                >
                                    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        {group.title}
                                    </h3>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Group items */}
                        <div className="space-y-1">
                            {group.items.map((item, itemIndex) => {
                                const globalIndex = navGroups
                                    .slice(0, groupIndex)
                                    .reduce((acc, g) => acc + g.items.length, 0) + itemIndex;

                                return (
                                    <NavButton
                                        key={item.id}
                                        item={item}
                                        isActive={activeTab === item.id}
                                        isFocused={focusedIndex === globalIndex}
                                        isExpanded={isExpanded}
                                        onClick={() => handleNavClick(item)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer with avatar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <motion.div
                    className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                        isExpanded ? '' : 'justify-center'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {avatar ? (
                            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session?.name || 'User')}`} alt="avatar" />
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="overflow-hidden"
                            >
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{session?.name || '사용자'}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{session?.email || ''}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isExpanded ? 256 : 64 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hidden md:flex bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)]"
            >
                {sidebarContent}
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed inset-0 bg-slate-900/50 dark:bg-black/70 z-40"
                            onClick={onMobileMenuToggle}
                        />
                        <motion.aside
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="md:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col z-50 shadow-2xl"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

interface NavButtonProps {
    item: NavItemConfig;
    isActive: boolean;
    isFocused: boolean;
    isExpanded: boolean;
    onClick: () => void;
}

function NavButton({ item, isActive, isFocused, isExpanded, onClick }: NavButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            className={`
                group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'}
                ${isFocused && !isActive ? 'ring-2 ring-blue-300 dark:ring-blue-700 ring-offset-2 dark:ring-offset-slate-900' : ''}
            `}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            layout
        >
            {/* Active indicator bar */}
            {isActive && (
                <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}

            {/* Icon */}
            <div className={`relative flex-shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}>
                {item.icon}
            </div>

            {/* Label */}
            <AnimatePresence mode="wait">
                {isExpanded && (
                    <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                        {item.label}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Badge */}
            {item.badge && item.badge > 0 && (
                <AnimatePresence mode="wait">
                    {isExpanded ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.badgeType === 'error'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : item.badgeType === 'warning'
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                    : isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                            {item.badge}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                item.badgeType === 'error'
                                    ? 'bg-red-500 dark:bg-red-600 text-white'
                                    : item.badgeType === 'warning'
                                    ? 'bg-amber-500 dark:bg-amber-600 text-white'
                                    : 'bg-blue-500 dark:bg-blue-600 text-white'
                            }`}
                        >
                            {item.badge > 9 ? '9+' : item.badge}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Keyboard shortcut hint */}
            {isExpanded && item.shortcut && !isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-auto px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-400 dark:text-slate-500"
                >
                    {item.shortcut}
                </motion.div>
            )}

            {/* Tooltip for collapsed state */}
            {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none whitespace-nowrap z-[100] shadow-xl flex items-center gap-2">
                    {item.label}
                    {item.shortcut && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-700 dark:bg-slate-700 text-[10px] font-mono">
                            {item.shortcut}
                        </span>
                    )}
                    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45" />
                </div>
            )}
        </motion.button>
    );
}
