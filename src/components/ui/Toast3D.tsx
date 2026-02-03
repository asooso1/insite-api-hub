'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast3DProps {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: {
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    border: 'border-green-500/30 dark:border-green-400/40',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    border: 'border-red-500/30 dark:border-red-400/40',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/30 dark:border-amber-400/40',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/30 dark:border-blue-400/40',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
}

/**
 * 3D 슬라이드 애니메이션이 적용된 토스트 컴포넌트
 *
 * Features:
 * - rotateX 3D 애니메이션 (90deg → 0 → -90deg)
 * - 우측에서 슬라이드 인/아웃
 * - perspective 1000px
 * - spring 물리 애니메이션
 * - 타입별 색상 및 아이콘
 * - 다크모드 지원
 */
export function Toast3D({ id, message, type, duration = 4000, onClose }: Toast3DProps) {
  const Icon = iconMap[type]
  const colors = colorMap[type]

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        x: 400,
        rotateX: 90,
      }}
      animate={{
        opacity: 1,
        x: 0,
        rotateX: 0,
      }}
      exit={{
        opacity: 0,
        x: 400,
        rotateX: -90,
        transition: {
          duration: 0.3,
          ease: 'easeIn',
        },
      }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      className={cn(
        'relative flex items-center gap-3 px-5 py-4',
        'rounded-xl shadow-lg backdrop-blur-xl border',
        'min-w-[320px] max-w-[450px]',
        colors.bg,
        colors.border
      )}
    >
      {/* 아이콘 */}
      <div className={cn('shrink-0', colors.icon)}>
        <Icon className="w-5 h-5" />
      </div>

      {/* 메시지 */}
      <p className={cn('text-sm font-medium flex-1 leading-relaxed', colors.text)}>
        {message}
      </p>

      {/* 닫기 버튼 */}
      <button
        onClick={() => onClose(id)}
        className={cn(
          'shrink-0 opacity-50 hover:opacity-100 transition-opacity',
          colors.text
        )}
        aria-label="닫기"
      >
        <X className="w-4 h-4" />
      </button>

      {/* 진행 바 */}
      <motion.div
        className={cn('absolute bottom-0 left-0 h-1 opacity-30', colors.icon)}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        style={{
          background: 'currentColor',
        }}
      />
    </motion.div>
  )
}
