'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  Clock,
  ArrowRight,
  Grid,
  Database,
  TestTube,
  FileText,
  Settings,
  Users,
  Folder,
  Play,
} from 'lucide-react';
import { modalBackdropVariants, modalContentVariants, glassClasses } from '@/lib/design-system';
import { useKeyboardShortcuts, ARROW_SHORTCUTS, formatShortcut } from '@/hooks/useKeyboardShortcuts';
import { useUIStore } from '@/stores/useUIStore';

// ============================================
// TYPES
// ============================================

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[]; // For search matching
  shortcut?: string[]; // Display shortcut
}

export type CommandCategory = 'navigation' | 'actions' | 'settings' | 'recent';

// ============================================
// COMMAND PALETTE COMPONENT
// ============================================

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { setActiveTab, setViewMode, openModal } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ============================================
  // COMMANDS DEFINITION
  // ============================================

  const allCommands: Command[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-endpoints',
        title: 'Go to Endpoints',
        description: 'View all API endpoints',
        category: 'navigation',
        icon: Grid,
        action: () => {
          setActiveTab('endpoints');
          handleCommandExecute('nav-endpoints');
        },
        keywords: ['endpoints', 'api', 'routes'],
        shortcut: ['1'],
      },
      {
        id: 'nav-models',
        title: 'Go to Models',
        description: 'Browse data models',
        category: 'navigation',
        icon: Database,
        action: () => {
          setActiveTab('models');
          handleCommandExecute('nav-models');
        },
        keywords: ['models', 'schema', 'types'],
        shortcut: ['2'],
      },
      {
        id: 'nav-test',
        title: 'Go to Test',
        description: 'API testing interface',
        category: 'navigation',
        icon: TestTube,
        action: () => {
          setActiveTab('test');
          handleCommandExecute('nav-test');
        },
        keywords: ['test', 'testing', 'api test'],
        shortcut: ['3'],
      },
      {
        id: 'nav-scenarios',
        title: 'Go to Scenarios',
        description: 'Manage test scenarios',
        category: 'navigation',
        icon: FileText,
        action: () => {
          setActiveTab('scenarios');
          handleCommandExecute('nav-scenarios');
        },
        keywords: ['scenarios', 'test cases', 'workflows'],
        shortcut: ['4'],
      },
      {
        id: 'nav-versions',
        title: 'Go to Versions',
        description: 'Version history',
        category: 'navigation',
        icon: Clock,
        action: () => {
          setActiveTab('versions');
          handleCommandExecute('nav-versions');
        },
        keywords: ['versions', 'history', 'changes'],
        shortcut: ['5'],
      },
      {
        id: 'nav-environments',
        title: 'Go to Environments',
        description: 'Environment settings',
        category: 'navigation',
        icon: Settings,
        action: () => {
          setActiveTab('environments');
          handleCommandExecute('nav-environments');
        },
        keywords: ['environments', 'env', 'config'],
        shortcut: ['6'],
      },
      {
        id: 'nav-teams',
        title: 'Go to Teams',
        description: 'Manage teams',
        category: 'navigation',
        icon: Users,
        action: () => {
          router.push('/teams');
          handleCommandExecute('nav-teams');
        },
        keywords: ['teams', 'members', 'users'],
      },
      {
        id: 'nav-projects',
        title: 'Go to Projects',
        description: 'View all projects',
        category: 'navigation',
        icon: Folder,
        action: () => {
          router.push('/projects');
          handleCommandExecute('nav-projects');
        },
        keywords: ['projects', 'repos', 'repositories'],
      },

      // Actions
      {
        id: 'action-run-test',
        title: 'Run Test',
        description: 'Execute current test',
        category: 'actions',
        icon: Play,
        action: () => {
          // This would trigger test execution
          handleCommandExecute('action-run-test');
        },
        keywords: ['run', 'execute', 'test', 'start'],
        shortcut: ['⌘', 'Enter'],
      },
      {
        id: 'action-grid-view',
        title: 'Switch to Grid View',
        description: 'Display items in grid',
        category: 'actions',
        icon: Grid,
        action: () => {
          setViewMode('grid');
          handleCommandExecute('action-grid-view');
        },
        keywords: ['grid', 'view', 'layout'],
      },
      {
        id: 'action-list-view',
        title: 'Switch to List View',
        description: 'Display items in list',
        category: 'actions',
        icon: FileText,
        action: () => {
          setViewMode('list');
          handleCommandExecute('action-list-view');
        },
        keywords: ['list', 'view', 'layout'],
      },

      // Settings
      {
        id: 'settings-shortcuts',
        title: 'Keyboard Shortcuts',
        description: 'View all shortcuts',
        category: 'settings',
        icon: Settings,
        action: () => {
          openModal('keyboard-shortcuts');
          handleCommandExecute('settings-shortcuts');
        },
        keywords: ['shortcuts', 'keyboard', 'hotkeys', 'help'],
        shortcut: ['⌘', '/'],
      },
    ],
    [setActiveTab, setViewMode, openModal, router]
  );

  // ============================================
  // COMMAND EXECUTION & RECENT TRACKING
  // ============================================

  const handleCommandExecute = (commandId: string) => {
    // Update recent commands
    setRecentCommands((prev) => {
      const filtered = prev.filter((id) => id !== commandId);
      const updated = [commandId, ...filtered].slice(0, 5); // Keep last 5

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('command-palette-recent', JSON.stringify(updated));
      }

      return updated;
    });

    onClose();
  };

  // Load recent commands on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('command-palette-recent');
      if (stored) {
        try {
          setRecentCommands(JSON.parse(stored));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, []);

  // ============================================
  // SEARCH & FILTERING
  // ============================================

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show recent commands first when no search
      const recent = recentCommands
        .map((id) => allCommands.find((cmd) => cmd.id === id))
        .filter(Boolean) as Command[];

      const recentIds = new Set(recentCommands);
      const others = allCommands.filter((cmd) => !recentIds.has(cmd.id));

      return [...recent, ...others];
    }

    const query = searchQuery.toLowerCase();

    return allCommands.filter((cmd) => {
      // Match title
      if (cmd.title.toLowerCase().includes(query)) return true;

      // Match description
      if (cmd.description?.toLowerCase().includes(query)) return true;

      // Match keywords
      if (cmd.keywords?.some((keyword) => keyword.toLowerCase().includes(query))) {
        return true;
      }

      return false;
    });
  }, [searchQuery, allCommands, recentCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory | 'recent', Command[]> = {
      recent: [],
      navigation: [],
      actions: [],
      settings: [],
    };

    const recentIds = new Set(recentCommands.slice(0, 5));

    filteredCommands.forEach((cmd) => {
      if (!searchQuery && recentIds.has(cmd.id)) {
        groups.recent.push(cmd);
      } else {
        groups[cmd.category].push(cmd);
      }
    });

    return groups;
  }, [filteredCommands, recentCommands, searchQuery]);

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================

  useKeyboardShortcuts(
    [
      {
        ...ARROW_SHORTCUTS.DOWN,
        action: () => {
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        },
        description: 'Move down',
        scope: 'modal',
      },
      {
        ...ARROW_SHORTCUTS.UP,
        action: () => {
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        },
        description: 'Move up',
        scope: 'modal',
      },
      {
        key: 'Enter',
        action: () => {
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            selected.action();
          }
        },
        description: 'Execute command',
        scope: 'modal',
      },
      {
        key: 'Escape',
        action: onClose,
        description: 'Close palette',
        scope: 'modal',
      },
    ],
    { enabled: isOpen, scope: 'modal' }
  );

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;

    const selectedElement = listRef.current.querySelector(
      `[data-command-index="${selectedIndex}"]`
    );

    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const categoryLabels: Record<CommandCategory | 'recent', string> = {
    recent: 'Recent',
    navigation: 'Navigation',
    actions: 'Actions',
    settings: 'Settings',
  };

  const renderCommandGroup = (category: CommandCategory | 'recent', commands: Command[]) => {
    if (commands.length === 0) return null;

    const globalIndex = filteredCommands.findIndex((cmd) => cmd.id === commands[0].id);

    return (
      <div key={category} className="mb-4 last:mb-0">
        <div className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          {categoryLabels[category]}
        </div>
        <div className="space-y-0.5">
          {commands.map((cmd, localIndex) => {
            const cmdIndex = filteredCommands.findIndex((c) => c.id === cmd.id);
            const isSelected = cmdIndex === selectedIndex;
            const Icon = cmd.icon;

            return (
              <motion.button
                key={cmd.id}
                data-command-index={cmdIndex}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(cmdIndex)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                  transition-colors duration-150
                  ${
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }
                `}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.1 }}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{cmd.title}</div>
                  {cmd.description && (
                    <div
                      className={`text-xs mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {cmd.description}
                    </div>
                  )}
                </div>

                {cmd.shortcut && (
                  <div className="flex items-center gap-1">
                    {cmd.shortcut.map((key, i) => (
                      <kbd
                        key={i}
                        className={`
                          px-1.5 py-0.5 text-xs font-medium rounded
                          ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }
                        `}
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                )}

                {isSelected && (
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-white" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Palette */}
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
          >
            <div className={`${glassClasses.modal} rounded-2xl overflow-hidden shadow-2xl`}>
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <kbd className="px-2 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                  ESC
                </kbd>
              </div>

              {/* Commands List */}
              <div
                ref={listRef}
                className="max-h-[400px] overflow-y-auto p-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 transparent',
                }}
              >
                {filteredCommands.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400">No commands found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  <>
                    {Object.entries(groupedCommands).map(([category, commands]) =>
                      renderCommandGroup(category as CommandCategory | 'recent', commands)
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">↵</kbd>
                    Select
                  </span>
                </div>
                <span>{filteredCommands.length} commands</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
