'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useScrollShrink } from '@/hooks/useScrollShrink';
import { CSSProperties } from 'react';

export interface ShrinkableHeaderProps {
  children: React.ReactNode;
  collapsedContent?: React.ReactNode; // 축소 시 표시할 내용
  maxHeight?: number; // 확장 시 높이 (기본 120px)
  minHeight?: number; // 축소 시 높이 (기본 60px)
  threshold?: number; // 축소 시작 스크롤 위치 (기본 50px)
  className?: string;
}

/**
 * 스크롤 시 축소되는 헤더 컴포넌트
 *
 * 기능:
 * - 스크롤 시 헤더 높이 축소 애니메이션
 * - 로고/제목 크기 축소
 * - 배경 블러 효과 증가
 * - sticky 포지셔닝
 *
 * @example
 * ```tsx
 * <ShrinkableHeader
 *   maxHeight={120}
 *   minHeight={60}
 *   collapsedContent={<Logo size="small" />}
 * >
 *   <Logo size="large" />
 *   <Navigation />
 * </ShrinkableHeader>
 * ```
 */
export function ShrinkableHeader({
  children,
  collapsedContent,
  maxHeight = 120,
  minHeight = 60,
  threshold = 50,
  className = '',
}: ShrinkableHeaderProps) {
  const { isShrunken, scrollProgress } = useScrollShrink(threshold);

  // 스크롤 진행률에 따른 값 계산
  const height = maxHeight - (maxHeight - minHeight) * scrollProgress;
  const fontSize = 1.5 - 0.5 * scrollProgress; // 1.5rem → 1rem
  const padding = 1.5 - 0.75 * scrollProgress; // 1.5rem → 0.75rem
  const backdropBlur = 12 * scrollProgress; // 0 → 12px
  const shadowOpacity = 0.1 * scrollProgress; // 0 → 0.1

  const headerStyle: CSSProperties = {
    height: `${height}px`,
    padding: `${padding}rem 1.5rem`,
    backdropFilter: `blur(${backdropBlur}px)`,
    WebkitBackdropFilter: `blur(${backdropBlur}px)`,
    boxShadow: `0 2px 8px rgba(0, 0, 0, ${shadowOpacity})`,
  };

  const contentStyle: CSSProperties = {
    fontSize: `${fontSize}rem`,
  };

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 transition-all duration-300 ease-in-out ${className}`}
      style={headerStyle}
      initial={false}
      animate={{
        height: `${height}px`,
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <motion.div
          style={contentStyle}
          className="flex-1 transition-all duration-300 ease-in-out"
          initial={false}
          animate={{
            opacity: isShrunken && collapsedContent ? 0 : 1,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          {!isShrunken || !collapsedContent ? children : null}
        </motion.div>

        {collapsedContent && (
          <motion.div
            className="absolute inset-0 flex items-center px-6"
            initial={false}
            animate={{
              opacity: isShrunken ? 1 : 0,
              pointerEvents: isShrunken ? 'auto' : 'none',
            }}
            transition={{
              duration: 0.2,
            }}
          >
            <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
              {collapsedContent}
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

/**
 * 간단한 사용 예제 컴포넌트
 */
export function ShrinkableHeaderExample() {
  return (
    <ShrinkableHeader
      maxHeight={120}
      minHeight={60}
      threshold={50}
      collapsedContent={
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">API Hub</h1>
          <nav className="flex gap-4">
            <a href="#" className="hover:text-blue-600">검색</a>
            <a href="#" className="hover:text-blue-600">대시보드</a>
          </nav>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">API Hub</h1>
        <p className="text-gray-600">최고의 API 검색 및 관리 플랫폼</p>
        <nav className="flex gap-6 text-lg">
          <a href="#" className="hover:text-blue-600">검색</a>
          <a href="#" className="hover:text-blue-600">대시보드</a>
          <a href="#" className="hover:text-blue-600">문서</a>
          <a href="#" className="hover:text-blue-600">설정</a>
        </nav>
      </div>
    </ShrinkableHeader>
  );
}
