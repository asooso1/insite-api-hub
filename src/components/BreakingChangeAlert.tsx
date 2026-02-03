'use client';

import { useState } from 'react';
import { BreakingChange } from '@/lib/breaking-changes';

interface Props {
  changes: BreakingChange[];
  endpointPath: string;
  onDismiss?: () => void;
}

/**
 * Breaking Change 경고 배너 컴포넌트
 *
 * API 엔드포인트에서 호환성 문제가 발견되었을 때 표시하는 빨간색 경고 배너
 */
export default function BreakingChangeAlert({ changes, endpointPath, onDismiss }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (changes.length === 0) {
    return null;
  }

  const categoryLabels: Record<string, string> = {
    REQUIRED_FIELD_REMOVED: '필수 필드 제거',
    REQUIRED_FIELD_ADDED: '필수 필드 추가',
    TYPE_INCOMPATIBLE: '타입 불일치',
    FIELD_MADE_REQUIRED: '필드 필수화',
    DTO_REMOVED: 'DTO 제거',
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'REQUIRED_FIELD_REMOVED':
      case 'DTO_REMOVED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'REQUIRED_FIELD_ADDED':
      case 'FIELD_MADE_REQUIRED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'TYPE_INCOMPATIBLE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // 카테고리별 그룹화
  const groupedChanges: Record<string, BreakingChange[]> = {};
  changes.forEach((change) => {
    const category = change.category;
    if (!groupedChanges[category]) {
      groupedChanges[category] = [];
    }
    groupedChanges[category].push(change);
  });

  return (
    <div className="mb-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Breaking Changes 감지
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                <span className="font-mono text-xs">{endpointPath}</span>에서{' '}
                <span className="font-bold">{changes.length}개</span>의 호환성 문제가
                발견되었습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          >
            {isExpanded ? '접기' : '자세히 보기'}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 확장된 상세 정보 */}
      {isExpanded && (
        <div className="border-t border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 p-4">
          <div className="space-y-4">
            {Object.entries(groupedChanges).map(([category, categoryChanges]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getCategoryBadgeColor(
                      category
                    )}`}
                  >
                    {categoryLabels[category] || category}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {categoryChanges.length}개
                  </span>
                </div>

                <div className="ml-4 space-y-2">
                  {categoryChanges.map((change, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {change.fieldPath}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {change.message}
                      </div>

                      {/* Before/After 표시 */}
                      {change.before && change.after && (
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-500">Before:</span>
                            <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-red-600 dark:text-red-400">
                              {change.before.type}
                              {change.before.required && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </code>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 dark:text-gray-500">After:</span>
                            <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-green-600 dark:text-green-400">
                              {change.after.type}
                              {change.after.required && (
                                <span className="ml-1 text-green-500">*</span>
                              )}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 권장 사항 */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              💡 권장 사항
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>API 버전 관리를 고려하세요 (예: /v2/)</li>
              <li>클라이언트에게 변경 사항을 사전 공지하세요</li>
              <li>마이그레이션 기간을 제공하세요</li>
              <li>필요 시 이전 버전과 새 버전을 동시에 지원하세요</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
