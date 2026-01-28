'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransition3DProps {
  children: ReactNode;
  transitionKey: string;  // 탭이나 페이지를 구분하는 키
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}

// 3D Depth 트랜지션 variants
const pageVariants = {
  initial: (direction: string) => ({
    opacity: 0,
    scale: 0.95,
    z: -100,
    rotateY: direction === 'left' ? -5 : direction === 'right' ? 5 : 0,
    rotateX: direction === 'up' ? 5 : direction === 'down' ? -5 : 0,
    filter: 'blur(4px)',
  }),
  animate: {
    opacity: 1,
    scale: 1,
    z: 0,
    rotateY: 0,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 150,
      damping: 20,
      mass: 0.8,
    },
  },
  exit: (direction: string) => ({
    opacity: 0,
    scale: 0.98,
    z: -50,
    rotateY: direction === 'left' ? 3 : direction === 'right' ? -3 : 0,
    rotateX: direction === 'up' ? -3 : direction === 'down' ? 3 : 0,
    filter: 'blur(2px)',
    transition: {
      duration: 0.15,
      ease: 'easeIn' as const,
    },
  }),
};

/**
 * 3D Depth 페이지 전환 래퍼 컴포넌트
 *
 * 탭이나 페이지 전환 시 3D perspective 기반의 부드러운 전환 효과를 제공합니다.
 *
 * @example
 * ```tsx
 * <PageTransition3D transitionKey={activeTab} direction="right">
 *   {renderTabContent()}
 * </PageTransition3D>
 * ```
 */
export function PageTransition3D({
  children,
  transitionKey,
  direction = 'right',
  className = ''
}: PageTransition3DProps) {
  return (
    <div style={{ perspective: '1200px' }} className={className}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={transitionKey}
          custom={direction}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
