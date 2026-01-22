import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiVersion } from '@/lib/api-types';
import { ApiChange } from '@/lib/change-detection';

interface ChangeStore {
  // State
  changes: ApiChange[];
  selectedVersion: ApiVersion | null;
  comparisonMode: 'split' | 'unified';
  filter: 'all' | 'added' | 'removed' | 'modified';
  isComparing: boolean;

  // Actions
  setChanges: (changes: ApiChange[]) => void;
  setSelectedVersion: (version: ApiVersion | null) => void;
  setComparisonMode: (mode: 'split' | 'unified') => void;
  setFilter: (filter: 'all' | 'added' | 'removed' | 'modified') => void;
  setIsComparing: (isComparing: boolean) => void;
  clearChanges: () => void;

  // Computed
  filteredChanges: () => ApiChange[];
  changeStats: () => { added: number; removed: number; modified: number; total: number };
}

export const useChangeStore = create<ChangeStore>()(
  persist(
    (set, get) => ({
      changes: [],
      selectedVersion: null,
      comparisonMode: 'split',
      filter: 'all',
      isComparing: false,

      setChanges: (changes) => set({ changes }),

      setSelectedVersion: (version) => set({ selectedVersion: version }),

      setComparisonMode: (mode) => set({ comparisonMode: mode }),

      setFilter: (filter) => set({ filter }),

      setIsComparing: (isComparing) => set({ isComparing }),

      clearChanges: () =>
        set({
          changes: [],
          selectedVersion: null,
          isComparing: false,
        }),

      filteredChanges: () => {
        const { changes, filter } = get();
        if (filter === 'all') return changes;

        const filterMap = {
          added: 'ADD',
          removed: 'DELETE',
          modified: 'MODIFY',
        } as const;

        return changes.filter((change) => change.type === filterMap[filter]);
      },

      changeStats: () => {
        const { changes } = get();
        return {
          added: changes.filter((c) => c.type === 'ADD').length,
          removed: changes.filter((c) => c.type === 'DELETE').length,
          modified: changes.filter((c) => c.type === 'MODIFY').length,
          total: changes.length,
        };
      },
    }),
    {
      name: 'change-storage',
      partialize: (state) => ({
        comparisonMode: state.comparisonMode,
        filter: state.filter,
      }),
    }
  )
);
