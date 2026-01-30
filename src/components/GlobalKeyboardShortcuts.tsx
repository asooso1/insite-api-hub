'use client';

import { useKeyboardShortcuts, SHORTCUT_PATTERNS } from '@/hooks/useKeyboardShortcuts';
import { useUIStore } from '@/stores/useUIStore';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';

/**
 * GlobalKeyboardShortcuts
 *
 * This component provides global keyboard shortcuts for the entire application.
 * It should be placed in the root layout to ensure shortcuts work everywhere.
 *
 * Usage:
 * ```tsx
 * // app/layout.tsx
 * import { GlobalKeyboardShortcuts } from '@/components/GlobalKeyboardShortcuts';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <GlobalKeyboardShortcuts />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * Shortcuts:
 * - Cmd/Ctrl + K: Open command palette
 * - Cmd/Ctrl + /: Show keyboard shortcuts help
 * - 1-6: Switch between tabs (endpoints, models, test, scenarios, versions, environments)
 * - Escape: Close modals/palettes
 */
export function GlobalKeyboardShortcuts() {
  const {
    shortcutsHelpOpen,
    openCommandPalette,
    openShortcutsHelp,
    closeShortcutsHelp,
    setActiveTab,
  } = useUIStore();

  // Register global keyboard shortcuts
  useKeyboardShortcuts(
    [
      // Command Palette (Cmd+K)
      {
        ...SHORTCUT_PATTERNS.COMMAND_PALETTE,
        action: openCommandPalette,
        description: 'Open command palette',
        scope: 'global',
      },

      // Keyboard Shortcuts Help (Cmd+/)
      {
        ...SHORTCUT_PATTERNS.HELP,
        action: openShortcutsHelp,
        description: 'Show keyboard shortcuts',
        scope: 'global',
      },

      // Tab Navigation (1-6)
      {
        key: '1',
        action: () => setActiveTab('endpoints'),
        description: 'Go to Endpoints tab',
        scope: 'global',
      },
      {
        key: '2',
        action: () => setActiveTab('models'),
        description: 'Go to Models tab',
        scope: 'global',
      },
      {
        key: '3',
        action: () => setActiveTab('test'),
        description: 'Go to Test tab',
        scope: 'global',
      },
      {
        key: '4',
        action: () => setActiveTab('scenarios'),
        description: 'Go to Scenarios tab',
        scope: 'global',
      },
      {
        key: '5',
        action: () => setActiveTab('versions'),
        description: 'Go to Versions tab',
        scope: 'global',
      },
      {
        key: '6',
        action: () => setActiveTab('environments'),
        description: 'Go to Environments tab',
        scope: 'global',
      },
    ],
    { enabled: true, scope: 'global' }
  );

  return (
    <>
      {/* CommandPalette는 DashboardV2의 GlobalSearch에서 통합 관리됨 */}
      <KeyboardShortcutsHelp isOpen={shortcutsHelpOpen} onClose={closeShortcutsHelp} />
    </>
  );
}
