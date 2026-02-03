'use client'

import { useEffect, useRef, useState } from 'react';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { cn } from '@/lib/utils';

export interface AnimatedCounterProps {
  value: number; // 목표 값
  duration?: number; // 애니메이션 지속 시간 (ms, 기본 1000)
  format?: (value: number) => string; // 포맷터 (예: toLocaleString)
  prefix?: string; // 접두사 (예: '$', '₩')
  suffix?: string; // 접미사 (예: '%', '개')
  className?: string;
  delay?: number; // 시작 지연 (ms)
  fromValue?: number; // 시작 값 (기본 0)
  once?: boolean; // 최초 마운트 시 한 번만 애니메이션 (기본 false)
  threshold?: number; // IntersectionObserver threshold (0~1, 기본 0.1)
  easing?: 'spring' | 'easeOut' | 'linear'; // 이징 타입 (기본 spring)
  decimalPlaces?: number; // 소수점 자리수 (기본 0 - 정수)
}

/**
 * AnimatedCounter 컴포넌트
 *
 * 0(또는 fromValue)에서 목표 값까지 부드럽게 카운팅하는 애니메이션 컴포넌트
 *
 * @example
 * ```tsx
 * <AnimatedCounter
 *   value={12345}
 *   prefix="₩"
 *   format={(v) => v.toLocaleString()}
 *   duration={1500}
 * />
 * // 결과: ₩0 → ₩12,345 (1.5초 동안 카운팅)
 * ```
 *
 * @example IntersectionObserver 사용
 * ```tsx
 * <AnimatedCounter
 *   value={9999}
 *   threshold={0.5}
 *   once={true}
 *   suffix="명"
 * />
 * // 뷰포트의 50%에 진입하면 한 번만 애니메이션
 * ```
 */
export function AnimatedCounter({
  value,
  duration = 1000,
  format,
  prefix = '',
  suffix = '',
  className,
  delay = 0,
  fromValue = 0,
  once = false,
  threshold = 0.1,
  easing = 'spring',
  decimalPlaces = 0,
}: AnimatedCounterProps) {
  const [targetValue, setTargetValue] = useState(fromValue);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  const animatedValue = useAnimatedValue(targetValue, {
    duration,
    delay,
    easing,
  });

  // IntersectionObserver 설정
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  // 가시성 및 값 변경 시 애니메이션 시작
  useEffect(() => {
    if (isVisible && (!once || !hasAnimated)) {
      setTargetValue(value);
      if (once) {
        setHasAnimated(true);
      }
    } else if (!isVisible && !once) {
      setTargetValue(fromValue);
    }
  }, [isVisible, value, fromValue, once, hasAnimated]);

  // 포맷팅
  const formattedValue = (() => {
    const roundedValue =
      decimalPlaces === 0
        ? Math.round(animatedValue)
        : parseFloat(animatedValue.toFixed(decimalPlaces));

    if (format) {
      return format(roundedValue);
    }
    return roundedValue.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  })();

  return (
    <span ref={elementRef} className={cn('inline-block tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

/**
 * AnimatedCounterSimple 컴포넌트
 *
 * IntersectionObserver 없이 즉시 애니메이션 시작하는 간단한 버전
 */
export function AnimatedCounterSimple({
  value,
  duration = 1000,
  format,
  prefix = '',
  suffix = '',
  className,
  delay = 0,
  fromValue = 0,
  easing = 'spring',
  decimalPlaces = 0,
}: Omit<AnimatedCounterProps, 'once' | 'threshold'>) {
  const animatedValue = useAnimatedValue(value, {
    duration,
    delay,
    easing,
  });

  const formattedValue = (() => {
    const roundedValue =
      decimalPlaces === 0
        ? Math.round(animatedValue)
        : parseFloat(animatedValue.toFixed(decimalPlaces));

    if (format) {
      return format(roundedValue);
    }
    return roundedValue.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  })();

  return (
    <span className={cn('inline-block tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

export default AnimatedCounter;
