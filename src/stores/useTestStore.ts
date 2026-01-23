import { create } from 'zustand';
import { TestCase, TestHistory, BatchTestSummary } from '@/lib/api-types';

interface TestState {
  testCases: TestCase[];
  testHistory: TestHistory[];
  batchResults: BatchTestSummary | null;
  isRunning: boolean;
  currentTestIndex: number;
  selectedCases: string[];
  filter: 'all' | 'success' | 'failed';

  // Actions
  setTestCases: (cases: TestCase[]) => void;
  addTestCase: (testCase: TestCase) => void;
  removeTestCase: (id: string) => void;
  setTestHistory: (history: TestHistory[]) => void;
  addTestHistory: (history: TestHistory) => void;
  setBatchResults: (results: BatchTestSummary | null) => void;
  setIsRunning: (running: boolean) => void;
  setCurrentTestIndex: (index: number) => void;
  toggleSelectCase: (id: string) => void;
  selectAllCases: () => void;
  clearSelection: () => void;
  setFilter: (filter: 'all' | 'success' | 'failed') => void;

  // Computed values
  filteredHistory: () => TestHistory[];
  successRate: () => number;
  avgResponseTime: () => number;
}

export const useTestStore = create<TestState>((set, get) => ({
  testCases: [],
  testHistory: [],
  batchResults: null,
  isRunning: false,
  currentTestIndex: -1,
  selectedCases: [],
  filter: 'all',

  setTestCases: (cases) => set({ testCases: cases }),

  addTestCase: (testCase) =>
    set((state) => ({ testCases: [...state.testCases, testCase] })),

  removeTestCase: (id) =>
    set((state) => ({
      testCases: state.testCases.filter((tc) => tc.id !== id),
      selectedCases: state.selectedCases.filter((caseId) => caseId !== id),
    })),

  setTestHistory: (history) => set({ testHistory: history }),

  addTestHistory: (history) =>
    set((state) => ({ testHistory: [history, ...state.testHistory] })),

  setBatchResults: (results) => set({ batchResults: results }),

  setIsRunning: (running) => set({ isRunning: running }),

  setCurrentTestIndex: (index) => set({ currentTestIndex: index }),

  toggleSelectCase: (id) =>
    set((state) => ({
      selectedCases: state.selectedCases.includes(id)
        ? state.selectedCases.filter((caseId) => caseId !== id)
        : [...state.selectedCases, id],
    })),

  selectAllCases: () =>
    set((state) => ({
      selectedCases: state.testCases.map((tc) => tc.id),
    })),

  clearSelection: () => set({ selectedCases: [] }),

  setFilter: (filter) => set({ filter }),

  // Computed values
  filteredHistory: () => {
    const { testHistory, filter } = get();
    if (filter === 'all') return testHistory;
    return testHistory.filter((h) =>
      filter === 'success' ? h.success : !h.success
    );
  },

  successRate: () => {
    const { testHistory } = get();
    if (testHistory.length === 0) return 0;
    const successCount = testHistory.filter((h) => h.success).length;
    return Math.round((successCount / testHistory.length) * 100);
  },

  avgResponseTime: () => {
    const { testHistory } = get();
    if (testHistory.length === 0) return 0;
    const totalTime = testHistory.reduce((acc, h) => acc + h.response_time, 0);
    return Math.round(totalTime / testHistory.length);
  },
}));
