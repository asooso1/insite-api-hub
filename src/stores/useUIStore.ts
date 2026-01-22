import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DashboardTab = 'endpoints' | 'models' | 'test' | 'scenarios' | 'versions' | 'environments';
type ViewMode = 'grid' | 'list';
type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;

  // Navigation
  activeTab: DashboardTab;

  // Search & Filter
  searchQuery: string;
  selectedMethods: string[];

  // View
  viewMode: ViewMode;
  theme: Theme;

  // Modals
  activeModal: string | null;
  modalData: any;

  // Actions
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setActiveTab: (tab: DashboardTab) => void;
  setSearchQuery: (query: string) => void;
  toggleMethod: (method: string) => void;
  clearMethodFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      mobileSidebarOpen: false,
      activeTab: 'endpoints',
      searchQuery: '',
      selectedMethods: [],
      viewMode: 'grid',
      theme: 'light',
      activeModal: null,
      modalData: null,

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleMethod: (method) =>
        set((state) => ({
          selectedMethods: state.selectedMethods.includes(method)
            ? state.selectedMethods.filter((m) => m !== method)
            : [...state.selectedMethods, method],
        })),

      clearMethodFilters: () => set({ selectedMethods: [] }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setTheme: (theme) => set({ theme }),

      openModal: (modalId, data = null) =>
        set({ activeModal: modalId, modalData: data }),

      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        viewMode: state.viewMode,
        theme: state.theme,
      }),
    }
  )
);
