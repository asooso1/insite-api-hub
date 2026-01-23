'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  RefreshCw,
  Home,
  ArrowLeft,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cardVariants, buttonVariants } from '@/lib/design-system';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface InlineErrorProps {
  message: string;
  className?: string;
}

interface ErrorCardProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

interface ErrorPageProps {
  code?: number;
  title: string;
  message?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  onRetry?: () => void;
  className?: string;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

interface NoResultsProps {
  query?: string;
  suggestions?: string[];
  className?: string;
}

interface NoFilterResultsProps {
  onClearFilters: () => void;
  className?: string;
}

interface SuccessStateProps {
  title: string;
  message?: string;
  className?: string;
}

interface InfoCardProps {
  title: string;
  message: string;
  className?: string;
}

interface WarningCardProps {
  title: string;
  message: string;
  className?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const errorShake = {
  initial: { x: 0 },
  animate: {
    x: [0, -4, 4, -4, 4, 0],
    transition: {
      duration: 0.4,
    },
  },
};

const fadeScale = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// ============================================
// INLINE ERROR
// ============================================

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <motion.div
      variants={errorShake}
      initial="initial"
      animate="animate"
      className={`flex items-start gap-2 text-sm text-red-600 dark:text-red-400 ${className}`}
    >
      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="font-medium">{message}</span>
    </motion.div>
  );
}

// ============================================
// ERROR CARD
// ============================================

export function ErrorCard({
  title,
  message,
  onRetry,
  className = '',
}: ErrorCardProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20 p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-1">
            {title}
          </h3>
          {message && (
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              {message}
            </p>
          )}

          {onRetry && (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// ERROR PAGE
// ============================================

export function ErrorPage({
  code,
  title,
  message,
  showBackButton = true,
  showHomeButton = true,
  onRetry,
  className = '',
}: ErrorPageProps) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-amber-950/20 ${className}`}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Error Icon */}
        <motion.div variants={staggerItem} className="flex justify-center">
          <div className="relative">
            <AlertTriangle className="w-24 h-24 text-red-500 dark:text-red-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-red-200 dark:bg-red-800 rounded-full animate-ping opacity-40" />
            </div>
          </div>
        </motion.div>

        {/* Error Content */}
        <motion.div variants={staggerItem} className="space-y-4">
          {code && (
            <div className="text-8xl font-black text-red-500 dark:text-red-400 opacity-20">
              {code}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {message && (
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">
              {message}
            </p>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          variants={staggerItem}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {onRetry && (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 dark:bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </motion.button>
          )}

          {showHomeButton && (
            <Link href="/">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <Home className="w-4 h-4" />
                홈으로
              </motion.button>
            </Link>
          )}

          {showBackButton && (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              이전 페이지
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="mb-6 w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500"
        >
          {icon}
        </motion.div>
      )}

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </motion.div>
  );
}

// ============================================
// NO RESULTS
// ============================================

export function NoResults({
  query,
  suggestions = [],
  className = '',
}: NoResultsProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-6 w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
      >
        <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </motion.div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        검색 결과가 없습니다
      </h3>

      {query && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            {query}
          </span>
          에 대한 결과를 찾을 수 없습니다
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="max-w-md">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            다음을 시도해보세요
          </p>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                {suggestion}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// NO FILTER RESULTS
// ============================================

export function NoFilterResults({
  onClearFilters,
  className = '',
}: NoFilterResultsProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="mb-6 w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
      >
        <Filter className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </motion.div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        필터 조건에 맞는 결과가 없습니다
      </h3>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        다른 필터 조건을 시도하거나 필터를 초기화해보세요.
      </p>

      <motion.button
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
      >
        <XCircle className="w-4 h-4" />
        필터 초기화
      </motion.button>
    </motion.div>
  );
}

// ============================================
// SUCCESS STATE
// ============================================

export function SuccessState({
  title,
  message,
  className = '',
}: SuccessStateProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`rounded-xl border border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-950/20 p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-green-900 dark:text-green-100 mb-1">
            {title}
          </h3>
          {message && (
            <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
              {message}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// INFO CARD
// ============================================

export function InfoCard({ title, message, className = '' }: InfoCardProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`rounded-xl border border-blue-200 dark:border-blue-800/30 bg-blue-50 dark:bg-blue-950/20 p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// WARNING CARD
// ============================================

export function WarningCard({
  title,
  message,
  className = '',
}: WarningCardProps) {
  return (
    <motion.div
      variants={fadeScale}
      initial="initial"
      animate="animate"
      className={`rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
