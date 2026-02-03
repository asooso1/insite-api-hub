'use client'

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

/**
 * 토스트 관리 훅
 *
 * Features:
 * - 토스트 추가/제거
 * - 자동 제거 타이머
 * - 타입별 헬퍼 메서드 (success, error, warning, info)
 *
 * @example
 * ```tsx
 * const { toasts, success, error, removeToast } = useToast()
 *
 * // 성공 토스트
 * success('저장되었습니다')
 *
 * // 에러 토스트
 * error('오류가 발생했습니다')
 *
 * // 커스텀 duration
 * addToast('메시지', 'info', 6000)
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'info', duration: number = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const toast: Toast = {
        id,
        message,
        type,
        duration,
      }

      setToasts((prev) => [...prev, toast])

      // 자동 제거 타이머
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }

      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => {
      return addToast(message, 'success', duration)
    },
    [addToast]
  )

  const error = useCallback(
    (message: string, duration?: number) => {
      return addToast(message, 'error', duration)
    },
    [addToast]
  )

  const warning = useCallback(
    (message: string, duration?: number) => {
      return addToast(message, 'warning', duration)
    },
    [addToast]
  )

  const info = useCallback(
    (message: string, duration?: number) => {
      return addToast(message, 'info', duration)
    },
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}
