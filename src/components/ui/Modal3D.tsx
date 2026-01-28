'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modal3DVariants } from '@/lib/design-system';

interface Modal3DProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  maxWidth?: string;
}

/**
 * Modal3D - 3D Perspective 진입 애니메이션이 적용된 모달 컴포넌트
 *
 * @param isOpen - 모달 열림/닫힘 상태
 * @param onClose - 모달 닫기 핸들러
 * @param children - 모달 내용
 * @param title - 모달 제목 (옵션)
 * @param className - 추가 CSS 클래스
 * @param maxWidth - 최대 너비 (기본값: max-w-2xl)
 */
export function Modal3D({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  maxWidth = 'max-w-2xl',
}: Modal3DProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ perspective: '1200px' }}>
          {/* 배경 오버레이 */}
          <motion.div
            variants={modal3DVariants.overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 모달 콘텐츠 */}
          <motion.div
            variants={modal3DVariants.content}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${maxWidth} mx-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* 헤더 */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 본문 */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
