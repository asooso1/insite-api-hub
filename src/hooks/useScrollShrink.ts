'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ScrollShrinkReturn {
  isShrunken: boolean;
  scrollProgress: number;
}

/**
 * Custom hook for scroll-based header shrinking effect
 *
 * @param threshold - Scroll position in pixels to trigger shrink effect (default: 50)
 * @returns Object containing isShrunken state and scrollProgress (0~1)
 *
 * @example
 * ```tsx
 * const { isShrunken, scrollProgress } = useScrollShrink(50);
 *
 * <header className={isShrunken ? 'shrunken' : ''}>
 *   <div style={{ opacity: 1 - scrollProgress }}>
 *     Large content
 *   </div>
 * </header>
 * ```
 */
export function useScrollShrink(threshold: number = 50): ScrollShrinkReturn {
  const [isShrunken, setIsShrunken] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;

    // threshold 이상 스크롤 시 축소 상태 활성화
    setIsShrunken(scrollY > threshold);

    // 스크롤 진행률 계산 (0~1 사이 값)
    // threshold의 2배 지점에서 1.0에 도달
    const progress = Math.min(scrollY / (threshold * 2), 1);
    setScrollProgress(progress);
  }, [threshold]);

  useEffect(() => {
    // 초기 스크롤 위치 확인
    handleScroll();

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 클린업 함수
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    isShrunken,
    scrollProgress,
  };
}
