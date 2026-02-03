import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DashboardTab = 'endpoints' | 'myApis' | 'models' | 'test' | 'scenarios' | 'versions' | 'environments' | 'settings' | 'testResults' | 'demo' | 'teams' | 'projects' | 'hierarchy';
type ViewMode = 'grid' | 'list';
type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  sidebarExpanded: boolean;

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

  // Command Palette & Shortcuts
  commandPaletteOpen: boolean;
  shortcutsHelpOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  toggleSidebarExpanded: () => void;
  setActiveTab: (tab: DashboardTab) => void;
  setSearchQuery: (query: string) => void;
  toggleMethod: (method: string) => void;
  clearMethodFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: Theme) => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleShortcutsHelp: () => void;
  openShortcutsHelp: () => void;
  closeShortcutsHelp: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      mobileSidebarOpen: false,
      sidebarExpanded: false,
      activeTab: 'endpoints',
      searchQuery: '',
      selectedMethods: [],
      viewMode: 'grid',
      theme: 'light',
      activeModal: null,
      modalData: null,
      commandPaletteOpen: false,
      shortcutsHelpOpen: false,

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleMobileSidebar: () =>
        set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

      toggleSidebarExpanded: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

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

      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

      openCommandPalette: () => set({ commandPaletteOpen: true }),

      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      toggleShortcutsHelp: () =>
        set((state) => ({ shortcutsHelpOpen: !state.shortcutsHelpOpen })),

      openShortcutsHelp: () => set({ shortcutsHelpOpen: true }),

      closeShortcutsHelp: () => set({ shortcutsHelpOpen: false }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarExpanded: state.sidebarExpanded,
        viewMode: state.viewMode,
        theme: state.theme,
      }),
    }
  )
);
