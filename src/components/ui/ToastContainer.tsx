'use client'

import { AnimatePresence } from 'framer-motion'
import { Toast3D } from './Toast3D'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

/**
 * 토스트 컨테이너 컴포넌트
 *
 * Features:
 * - 우측 하단 고정 위치
 * - AnimatePresence로 여러 토스트 관리
 * - staggerChildren으로 순차 애니메이션
 * - 최대 5개 토스트 표시
 */
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  // 최대 5개만 표시 (최신 것부터)
  const visibleToasts = toasts.slice(-5)

  return (
    <div
      className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none"
      style={{
        perspective: '1000px',
      }}
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast3D
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={onClose}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
