'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Command,
  ArrowRight,
  Hash,
  Layers,
  Folder,
  Users,
  Clock,
  Filter,
  Loader2,
} from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';
import { searchAll, SearchResult, SearchResponse } from '@/app/actions/search';

interface GlobalSearchProps {
  onSelectResult?: (result: SearchResult) => void;
  projectId?: string;
}

// 검색 타입 필터
type SearchType = 'all' | 'endpoint' | 'model' | 'project' | 'team';

const TYPE_LABELS: Record<SearchType, string> = {
  all: '전체',
  endpoint: '엔드포인트',
  model: '모델',
  project: '프로젝트',
  team: '팀',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  endpoint: <Hash className="w-4 h-4" />,
  model: <Layers className="w-4 h-4" />,
  project: <Folder className="w-4 h-4" />,
  team: <Users className="w-4 h-4" />,
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400',
};

// 로컬 스토리지 키
const RECENT_SEARCHES_KEY = 'apihub-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export function GlobalSearch({ onSelectResult, projectId }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<SearchType>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const commandPaletteOpen = useUIStore((state) => state.commandPaletteOpen);
  const closeCommandPalette = useUIStore((state) => state.closeCommandPalette);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  // 최근 검색 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // 무시
    }
  }, []);

  // 최근 검색 저장
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((q) => q !== searchQuery)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // 무시
      }
      return updated;
    });
  }, []);

  // 검색 실행
  const performSearch = useCallback(
    async (searchQuery: string) => {
      console.log('[GlobalSearch] 검색 시작:', searchQuery);

      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const types =
          selectedType === 'all'
            ? undefined
            : [selectedType as 'endpoint' | 'model' | 'project' | 'team'];

        console.log('[GlobalSearch] searchAll 호출:', { searchQuery, projectId, types });
        const response = await searchAll(searchQuery, {
          projectId,
          types,
          limit: 20,
        });

        console.log('[GlobalSearch] 검색 결과:', response);
        setResults(response.results);
        setSelectedIndex(0);
      } catch (error) {
        console.error('[GlobalSearch] 검색 오류:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, selectedType]
  );

  // 디바운스 검색 (200ms → 400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // 결과 선택
  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query);
      closeCommandPalette();

      if (onSelectResult) {
        onSelectResult(result);
      } else {
        // 기본 동작: 해당 탭으로 이동
        if (result.type === 'endpoint') {
          setActiveTab('endpoints');
        } else if (result.type === 'model') {
          setActiveTab('models');
        } else if (result.type === 'project') {
          setActiveTab('projects');
        } else if (result.type === 'team') {
          setActiveTab('teams');
        }
      }
    },
    [query, saveRecentSearch, closeCommandPalette, onSelectResult, setActiveTab]
  );

  // 키보드 네비게이션
  useEffect(() => {
    if (!commandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeCommandPalette();
          break;
        case 'Tab':
          e.preventDefault();
          // 타입 필터 순환
          const types: SearchType[] = ['all', 'endpoint', 'model', 'project', 'team'];
          const currentIdx = types.indexOf(selectedType);
          setSelectedType(types[(currentIdx + 1) % types.length]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, results, selectedIndex, selectedType, handleSelect, closeCommandPalette]);

  // 스크롤 조정
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // 모달 열릴 때 포커스
  useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
    }
  }, [commandPaletteOpen]);

  // 하이라이트 텍스트
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // 그룹화된 결과
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      const type = result.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(result);
    });
    return groups;
  }, [results]);

  if (!commandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]"
        onClick={closeCommandPalette}
      >
        {/* 배경 오버레이 */}
        <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm" />

        {/* 검색 모달 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 검색 입력 */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="엔드포인트, 모델, 프로젝트 검색..."
              className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base outline-none"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
            <button
              onClick={closeCommandPalette}
              className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 타입 필터 */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <div className="flex gap-1">
              {(['all', 'endpoint', 'model', 'project', 'team'] as SearchType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    selectedType === type
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">
              Tab으로 필터 전환
            </span>
          </div>

          {/* 검색 결과 */}
          <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
            {query.trim() === '' ? (
              // 최근 검색
              <div className="p-4">
                {recentSearches.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 최근 검색
                    </p>
                    <div className="space-y-1">
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(search)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          {search}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  검색어를 입력하세요
                </div>
              </div>
            ) : results.length === 0 && !isLoading ? (
              // 결과 없음
              <div className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  &quot;{query}&quot;에 대한 검색 결과가 없습니다
                </p>
              </div>
            ) : (
              // 그룹화된 결과
              <div className="p-2">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type} className="mb-4">
                    <p className="px-2 py-1 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      {TYPE_ICONS[type]} {TYPE_LABELS[type as SearchType]}
                      <span className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">
                        {items.length}
                      </span>
                    </p>
                    <div className="space-y-1 mt-1">
                      {items.map((result, idx) => {
                        const globalIndex = results.indexOf(result);
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                              globalIndex === selectedIndex
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {/* 타입 아이콘 / HTTP 메서드 */}
                            {result.type === 'endpoint' && result.method ? (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  METHOD_COLORS[result.method] || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {result.method}
                              </span>
                            ) : (
                              <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded">
                                {TYPE_ICONS[result.type]}
                              </span>
                            )}

                            {/* 내용 */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {result.type === 'endpoint'
                                  ? highlightText(result.path || result.title, query)
                                  : highlightText(result.title, query)}
                              </div>
                              {result.subtitle && (
                                <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                  {highlightText(result.subtitle, query)}
                                </div>
                              )}
                            </div>

                            {/* 프로젝트 이름 */}
                            {result.projectName && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {result.projectName}
                              </span>
                            )}

                            {/* 화살표 */}
                            <ArrowRight
                              className={`w-4 h-4 transition-opacity ${
                                globalIndex === selectedIndex ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 하단 도움말 */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">↑↓</kbd>
              탐색
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">↵</kbd>
              선택
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Tab</kbd>
              필터
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Esc</kbd>
              닫기
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default GlobalSearch;
