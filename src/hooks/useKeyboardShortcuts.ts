import { useEffect, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export type ModifierKey = 'ctrl' | 'meta' | 'shift' | 'alt';
export type ShortcutScope = 'global' | 'modal' | 'list';

export interface Shortcut {
  key: string; // 'k', 'Escape', 'ArrowUp', etc.
  modifiers?: ModifierKey[];
  action: () => void;
  description: string;
  scope?: ShortcutScope;
}

// ============================================
// OS DETECTION
// ============================================

/**
 * Detects the current operating system
 * @returns 'mac' | 'windows' | 'linux' | 'unknown'
 */
export function detectOS(): 'mac' | 'windows' | 'linux' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'mac';
  }
  if (platform.includes('win') || userAgent.includes('win')) {
    return 'windows';
  }
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Get the primary modifier key for the current OS
 * @returns 'meta' for Mac, 'ctrl' for others
 */
export function getPrimaryModifier(): 'meta' | 'ctrl' {
  return detectOS() === 'mac' ? 'meta' : 'ctrl';
}

/**
 * Format modifier key display text
 * @param modifier - The modifier key
 * @returns Human-readable display text
 */
export function formatModifier(modifier: ModifierKey): string {
  const isMac = detectOS() === 'mac';

  switch (modifier) {
    case 'meta':
      return isMac ? '⌘' : 'Ctrl';
    case 'ctrl':
      return isMac ? '⌃' : 'Ctrl';
    case 'shift':
      return isMac ? '⇧' : 'Shift';
    case 'alt':
      return isMac ? '⌥' : 'Alt';
    default:
      return modifier;
  }
}

/**
 * Format key display text
 * @param key - The key
 * @returns Human-readable display text
 */
export function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    Escape: 'Esc',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Enter: '↵',
    Backspace: '⌫',
    Delete: '⌦',
    Tab: '⇥',
    ' ': 'Space',
  };

  return keyMap[key] || key.toUpperCase();
}

/**
 * Format complete shortcut for display
 * @param shortcut - The shortcut object
 * @returns Array of key parts for rendering
 */
export function formatShortcut(shortcut: Shortcut): string[] {
  const parts: string[] = [];

  if (shortcut.modifiers) {
    shortcut.modifiers.forEach((mod) => {
      parts.push(formatModifier(mod));
    });
  }

  parts.push(formatKey(shortcut.key));

  return parts;
}

// ============================================
// SHORTCUT MATCHING
// ============================================

/**
 * Check if a keyboard event matches a shortcut
 * @param event - The keyboard event
 * @param shortcut - The shortcut to match
 * @returns true if the event matches the shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  // Match the key (case-insensitive)
  const keyMatches =
    event.key.toLowerCase() === shortcut.key.toLowerCase() ||
    event.code.toLowerCase() === shortcut.key.toLowerCase();

  if (!keyMatches) return false;

  // If no modifiers specified, ensure no modifiers are pressed
  if (!shortcut.modifiers || shortcut.modifiers.length === 0) {
    return !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  }

  // Check each modifier
  const requiredModifiers = new Set(shortcut.modifiers);

  const hasCtrl = requiredModifiers.has('ctrl') ? event.ctrlKey : !event.ctrlKey;
  const hasMeta = requiredModifiers.has('meta') ? event.metaKey : !event.metaKey;
  const hasShift = requiredModifiers.has('shift') ? event.shiftKey : !event.shiftKey;
  const hasAlt = requiredModifiers.has('alt') ? event.altKey : !event.altKey;

  return hasCtrl && hasMeta && hasShift && hasAlt;
}

// ============================================
// HOOK
// ============================================

/**
 * Custom hook for keyboard shortcuts
 * @param shortcuts - Array of shortcuts to register
 * @param options - Configuration options
 */
export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  options: {
    enabled?: boolean;
    scope?: ShortcutScope;
  } = {}
): void {
  const { enabled = true, scope = 'global' } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields (unless global scope)
      if (scope !== 'global') {
        const target = event.target as HTMLElement;
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (isInput) return;
      }

      // Find matching shortcut
      const matchedShortcut = shortcutsRef.current.find((shortcut) => {
        // Check scope
        if (shortcut.scope && shortcut.scope !== scope) return false;

        return matchesShortcut(event, shortcut);
      });

      if (matchedShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchedShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, scope]);
}

// ============================================
// PREDEFINED SHORTCUTS
// ============================================

/**
 * Get primary modifier key based on OS
 */
export const PRIMARY_MODIFIER: ModifierKey = getPrimaryModifier();

/**
 * Common shortcut patterns
 */
export const SHORTCUT_PATTERNS = {
  COMMAND_PALETTE: { key: 'k', modifiers: [PRIMARY_MODIFIER] as ModifierKey[] },
  HELP: { key: '/', modifiers: [PRIMARY_MODIFIER] as ModifierKey[] },
  SAVE: { key: 's', modifiers: [PRIMARY_MODIFIER] as ModifierKey[] },
  SUBMIT: { key: 'Enter', modifiers: [PRIMARY_MODIFIER] as ModifierKey[] },
  ESCAPE: { key: 'Escape', modifiers: [] as ModifierKey[] },
  SEARCH: { key: 'f', modifiers: [PRIMARY_MODIFIER] as ModifierKey[] },
  REFRESH: { key: 'r', modifiers: [PRIMARY_MODIFIER] as ModifierKey[] },
} as const;

/**
 * Navigation shortcuts (1-9 for tabs)
 */
export function createTabShortcut(tabIndex: number, action: () => void): Shortcut {
  return {
    key: String(tabIndex),
    modifiers: [],
    action,
    description: `Go to tab ${tabIndex}`,
    scope: 'global',
  };
}

/**
 * Arrow navigation shortcuts
 */
export const ARROW_SHORTCUTS = {
  UP: { key: 'ArrowUp', modifiers: [] as ModifierKey[] },
  DOWN: { key: 'ArrowDown', modifiers: [] as ModifierKey[] },
  LEFT: { key: 'ArrowLeft', modifiers: [] as ModifierKey[] },
  RIGHT: { key: 'ArrowRight', modifiers: [] as ModifierKey[] },
} as const;
