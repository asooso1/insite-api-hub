'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'compact';
  className?: string;
}

/**
 * ThemeToggle - 다크모드 토글 버튼
 *
 * variants:
 * - icon: 아이콘만 표시 (클릭 시 순환: light → dark → system)
 * - dropdown: 드롭다운 메뉴
 * - compact: 작은 아이콘 버튼
 */
export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();

  const iconVariants = {
    initial: { scale: 0, rotate: -180, opacity: 0 },
    animate: { scale: 1, rotate: 0, opacity: 1 },
    exit: { scale: 0, rotate: 180, opacity: 0 },
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    }
    if (isDark) {
      return <Moon className="w-5 h-5 text-indigo-400" />;
    }
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getLabel = () => {
    if (theme === 'system') return '시스템 설정';
    if (theme === 'dark') return '다크 모드';
    return '라이트 모드';
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative group ${className}`}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={theme}
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              {getIcon()}
            </motion.div>
          </AnimatePresence>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {getLabel()}
          </span>
        </button>

        {/* 드롭다운 메뉴 */}
        <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 min-w-[140px]">
            <ThemeOption
              icon={<Sun className="w-4 h-4" />}
              label="라이트"
              isActive={theme === 'light'}
              onClick={() => setTheme('light')}
            />
            <ThemeOption
              icon={<Moon className="w-4 h-4" />}
              label="다크"
              isActive={theme === 'dark'}
              onClick={() => setTheme('dark')}
            />
            <ThemeOption
              icon={<Monitor className="w-4 h-4" />}
              label="시스템"
              isActive={theme === 'system'}
              onClick={() => setTheme('system')}
            />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
        title={getLabel()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
          >
            {theme === 'system' ? (
              <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            ) : isDark ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </motion.div>
        </AnimatePresence>
      </button>
    );
  }

  // Default: icon variant
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 ${className}`}
      title={getLabel()}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          variants={iconVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {getIcon()}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

function ThemeOption({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary dark:bg-primary/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeTheme"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

export default ThemeToggle;
