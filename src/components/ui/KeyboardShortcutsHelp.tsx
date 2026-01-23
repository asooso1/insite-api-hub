'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Command, Keyboard } from 'lucide-react';
import { modalBackdropVariants, modalContentVariants, glassClasses } from '@/lib/design-system';
import { useKeyboardShortcuts, formatShortcut, Shortcut } from '@/hooks/useKeyboardShortcuts';

// ============================================
// TYPES
// ============================================

export interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

// ============================================
// KEYBOARD SHORTCUTS HELP COMPONENT
// ============================================

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  // Close on Escape
  useKeyboardShortcuts(
    [
      {
        key: 'Escape',
        action: onClose,
        description: 'Close help',
        scope: 'modal',
      },
    ],
    { enabled: isOpen, scope: 'modal' }
  );

  // ============================================
  // SHORTCUTS DEFINITION
  // ============================================

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'General',
      shortcuts: [
        {
          key: 'k',
          modifiers: ['meta'],
          action: () => {},
          description: 'Open command palette',
        },
        {
          key: '/',
          modifiers: ['meta'],
          action: () => {},
          description: 'Show keyboard shortcuts',
        },
        {
          key: 'Escape',
          action: () => {},
          description: 'Close modal or palette',
        },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        {
          key: '1',
          action: () => {},
          description: 'Go to Endpoints',
        },
        {
          key: '2',
          action: () => {},
          description: 'Go to Models',
        },
        {
          key: '3',
          action: () => {},
          description: 'Go to Test',
        },
        {
          key: '4',
          action: () => {},
          description: 'Go to Scenarios',
        },
        {
          key: '5',
          action: () => {},
          description: 'Go to Versions',
        },
        {
          key: '6',
          action: () => {},
          description: 'Go to Environments',
        },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        {
          key: 's',
          modifiers: ['meta'],
          action: () => {},
          description: 'Save current context',
        },
        {
          key: 'Enter',
          modifiers: ['meta'],
          action: () => {},
          description: 'Run test',
        },
        {
          key: 'r',
          modifiers: ['meta'],
          action: () => {},
          description: 'Refresh data',
        },
      ],
    },
    {
      title: 'List Navigation',
      shortcuts: [
        {
          key: 'ArrowUp',
          action: () => {},
          description: 'Move up',
        },
        {
          key: 'ArrowDown',
          action: () => {},
          description: 'Move down',
        },
        {
          key: 'Enter',
          action: () => {},
          description: 'Select item',
        },
      ],
    },
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderShortcutKeys = (shortcut: Shortcut) => {
    const keys = formatShortcut(shortcut);

    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className="px-2.5 py-1.5 text-xs font-medium bg-white/70 text-slate-700 rounded-md border border-slate-300/50 shadow-sm min-w-[2rem] text-center"
          >
            {key}
          </kbd>
        ))}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            variants={modalContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl z-[101]"
          >
            <div className={`${glassClasses.modal} rounded-2xl overflow-hidden shadow-2xl`}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Keyboard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-slate-500">
                      Master the keyboard to navigate faster
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div
                className="max-h-[500px] overflow-y-auto p-6"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 transparent',
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortcutGroups.map((group) => (
                    <div key={group.title} className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full" />
                        {group.title}
                      </h3>

                      <div className="space-y-2">
                        {group.shortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/40 rounded-lg border border-slate-200/50 hover:bg-white/60 transition-colors"
                          >
                            <span className="text-sm text-slate-700 flex-1">
                              {shortcut.description}
                            </span>
                            {renderShortcutKeys(shortcut)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Command className="w-4 h-4" />
                    <span>
                      Press{' '}
                      <kbd className="px-1.5 py-0.5 bg-white text-slate-700 rounded border border-slate-300">
                        Cmd/Ctrl
                      </kbd>{' '}
                      +{' '}
                      <kbd className="px-1.5 py-0.5 bg-white text-slate-700 rounded border border-slate-300">
                        /
                      </kbd>{' '}
                      to open this dialog anytime
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
