'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { useRipple } from '@/hooks/useRipple'
import { forwardRef } from 'react'

interface RippleButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  ripple?: boolean
  scale?: boolean
}

/**
 * RippleButton 컴포넌트
 *
 * 클릭 시 ripple 효과와 scale 애니메이션을 제공하는 버튼 컴포넌트
 *
 * @param variant - 버튼 스타일 (primary, secondary, ghost, danger)
 * @param size - 버튼 크기 (sm, md, lg)
 * @param ripple - ripple 효과 활성화 여부 (기본값: true)
 * @param scale - scale 효과 활성화 여부 (기본값: true)
 *
 * @example
 * ```tsx
 * <RippleButton variant="primary" size="md">
 *   클릭하세요
 * </RippleButton>
 *
 * <RippleButton variant="danger" size="lg" ripple={false}>
 *   삭제
 * </RippleButton>
 * ```
 */
export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      ripple = true,
      scale = true,
      onClick,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const createRipple = useRipple({ duration: 600 })

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled) {
        createRipple(e)
      }
      onClick?.(e)
    }

    // variant별 스타일
    const variantStyles = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
      ghost:
        'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-border',
      danger:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg',
    }

    // size별 스타일
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
    }

    // 애니메이션 variants
    const buttonVariants = scale
      ? {
          tap: { scale: 0.98 },
          hover: { scale: 1.02 },
        }
      : undefined

    return (
      <motion.button
        ref={ref}
        className={`
          relative overflow-hidden
          font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        variants={buttonVariants}
        whileTap={scale && !disabled ? 'tap' : undefined}
        whileHover={scale && !disabled ? 'hover' : undefined}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)

RippleButton.displayName = 'RippleButton'
