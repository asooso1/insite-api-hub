'use client'

import { useEffect, useState } from 'react';
import { useSpring, useTransform } from 'framer-motion';

export interface UseAnimatedValueOptions {
  duration?: number; // 애니메이션 지속 시간 (ms, 기본 1000)
  delay?: number; // 시작 지연 (ms, 기본 0)
  easing?: 'spring' | 'easeOut' | 'linear'; // 이징 타입 (기본 spring)
}

/**
 * useAnimatedValue
 *
 * Framer Motion의 useSpring을 활용한 숫자 애니메이션 훅
 *
 * @param targetValue - 목표 값
 * @param options - 애니메이션 옵션
 * @returns 현재 애니메이션 중인 값
 *
 * @example
 * ```tsx
 * const animatedValue = useAnimatedValue(1234, { duration: 1500, easing: 'spring' })
 * return <div>{Math.round(animatedValue)}</div>
 * ```
 */
export function useAnimatedValue(
  targetValue: number,
  options: UseAnimatedValueOptions = {}
): number {
  const { duration = 1000, delay = 0, easing = 'spring' } = options;

  // Spring 설정
  const springConfig =
    easing === 'spring'
      ? { stiffness: 100, damping: 30, restDelta: 0.001 }
      : easing === 'easeOut'
      ? { stiffness: 300, damping: 50, restDelta: 0.001 }
      : { stiffness: 500, damping: 100, restDelta: 0.001 }; // linear

  const spring = useSpring(0, springConfig);
  const [displayValue, setDisplayValue] = useState(0);

  // spring 값 변화 구독
  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => unsubscribe();
  }, [spring]);

  // targetValue 변경 시 애니메이션 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      spring.set(targetValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [targetValue, delay, spring]);

  return displayValue;
}

/**
 * useAnimatedValueWithRAF (RequestAnimationFrame 기반 대안)
 *
 * Framer Motion 없이 사용할 수 있는 순수 RAF 구현
 */
export function useAnimatedValueWithRAF(
  targetValue: number,
  options: UseAnimatedValueOptions = {}
): number {
  const { duration = 1000, delay = 0, easing = 'easeOut' } = options;
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now() + delay;
    const startValue = currentValue;
    const difference = targetValue - startValue;

    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < 0) {
        // 딜레이 중
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      if (elapsed >= duration) {
        setCurrentValue(targetValue);
        return;
      }

      const progress = elapsed / duration;
      let easedProgress = progress;

      // Easing 함수 적용
      switch (easing) {
        case 'easeOut':
          easedProgress = 1 - Math.pow(1 - progress, 3); // cubic easeOut
          break;
        case 'spring':
          // 간단한 spring 근사 (overshoot)
          easedProgress = 1 - Math.pow(1 - progress, 2) * Math.cos(progress * Math.PI * 2);
          break;
        case 'linear':
        default:
          easedProgress = progress;
          break;
      }

      const newValue = startValue + difference * easedProgress;
      setCurrentValue(newValue);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetValue, duration, delay, easing]);

  return currentValue;
}
