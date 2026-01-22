import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/lib/api-types';
import { getProjects } from '@/app/actions/project';

interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (id: string | null) => void;
  fetchProjects: () => Promise<void>;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      loading: false,
      error: null,

      setProjects: (projects) => set({ projects }),

      setCurrentProject: (id) => {
        set({ currentProjectId: id });
        // Also set cookie for server-side
        if (typeof document !== 'undefined') {
          document.cookie = `current_project_id=${id}; path=/; max-age=31536000`;
        }
      },

      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const projects = await getProjects();
          set({ projects, loading: false });

          // Set first project as current if none selected
          const state = get();
          if (!state.currentProjectId && projects.length > 0) {
            get().setCurrentProject(projects[0].id);
          }
        } catch (error) {
          set({ error: 'Failed to fetch projects', loading: false });
        }
      },

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
    }),
    {
      name: 'project-storage',
      partialize: (state) => ({ currentProjectId: state.currentProjectId }),
    }
  )
);
