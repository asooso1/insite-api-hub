import { useCallback } from 'react'

interface RippleOptions {
  duration?: number
  color?: string
}

/**
 * useRipple 훅
 *
 * 클릭 이벤트에서 물결(ripple) 효과를 생성하는 훅
 *
 * @param options - ripple 효과 옵션 (duration, color)
 * @returns createRipple - 클릭 이벤트를 받아 ripple 효과를 생성하는 함수
 *
 * @example
 * ```tsx
 * const createRipple = useRipple({ duration: 600 })
 *
 * <button onClick={createRipple}>
 *   클릭하세요
 * </button>
 * ```
 */
export function useRipple(options: RippleOptions = {}) {
  const { duration = 600, color = 'rgba(255, 255, 255, 0.3)' } = options

  const createRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()

      // 클릭 위치 계산
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // ripple 요소 생성
      const ripple = document.createElement('span')
      ripple.className = 'ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.style.background = color
      ripple.style.animationDuration = `${duration}ms`

      // button에 추가
      button.appendChild(ripple)

      // 애니메이션 완료 후 제거
      setTimeout(() => {
        ripple.remove()
      }, duration)
    },
    [duration, color]
  )

  return createRipple
}
