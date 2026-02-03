'use client'

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
}

interface AnimatedTabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  variant?: 'underline' | 'pill' | 'boxed'
}

/**
 * AnimatedTabs 컴포넌트
 *
 * 탭 전환 시 부드러운 morphing 트랜지션 제공
 * - 활성 탭 인디케이터 슬라이드 애니메이션 (layoutId)
 * - 콘텐츠 전환 시 fade + slide 방향 애니메이션
 * - 좌→우, 우→좌 방향 감지하여 슬라이드 방향 결정
 */
export default function AnimatedTabs({
  tabs,
  defaultTab,
  onChange,
  variant = 'underline'
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const [direction, setDirection] = useState(0)

  const handleTabChange = (newTabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
    const newIndex = tabs.findIndex(tab => tab.id === newTabId)

    // 방향 결정: 우→좌(-1), 좌→우(1)
    setDirection(newIndex > currentIndex ? 1 : -1)
    setActiveTab(newTabId)
    onChange?.(newTabId)
  }

  const activeContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className="w-full">
      {/* 탭 버튼 영역 */}
      <LayoutGroup>
        <div
          className={`
            flex gap-2 border-b border-gray-200 dark:border-gray-700
            ${variant === 'pill' ? 'bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border-0' : ''}
            ${variant === 'boxed' ? 'border-0 gap-0' : ''}
          `}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative px-4 py-2 text-sm font-medium transition-colors
                  ${variant === 'underline' ? 'pb-3' : ''}
                  ${variant === 'pill' ? 'rounded-md' : ''}
                  ${variant === 'boxed' ? 'border-r border-gray-200 dark:border-gray-700 last:border-r-0' : ''}
                  ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                {/* 아이콘 */}
                {tab.icon && <span className="mr-2 inline-block">{tab.icon}</span>}

                {/* 라벨 */}
                <span>{tab.label}</span>

                {/* 활성 인디케이터 - underline variant */}
                {isActive && variant === 'underline' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}

                {/* 활성 인디케이터 - pill variant */}
                {isActive && variant === 'pill' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm -z-10"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}

                {/* 활성 인디케이터 - boxed variant */}
                {isActive && variant === 'boxed' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400 -z-10"
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </LayoutGroup>

      {/* 탭 콘텐츠 영역 */}
      <div className="relative mt-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            {activeContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * 콘텐츠 전환 애니메이션 variants
 * - enter: 진입 시 (방향에 따라 좌/우에서 슬라이드)
 * - center: 중앙 정렬 (최종 상태)
 * - exit: 퇴장 시 (방향에 따라 좌/우로 슬라이드)
 */
const contentVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0
  })
}
