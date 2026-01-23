'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMentionSuggestions } from '@/app/actions/notifications';

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: () => void;
    placeholder?: string;
    className?: string;
    rows?: number;
}

interface Suggestion {
    id: string;
    name: string;
    email: string;
}

export function MentionInput({
    value,
    onChange,
    onSubmit,
    placeholder = '내용을 입력하세요... @를 입력하여 멘션',
    className = '',
    rows = 3
}: MentionInputProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Detect @ mention
    const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;
        onChange(newValue);

        // Find @ before cursor
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            // Check if there's no space after @
            if (!textAfterAt.includes(' ') && textAfterAt.length > 0) {
                setMentionQuery(textAfterAt);
                setMentionStart(lastAtIndex);
                setShowSuggestions(true);
                setSelectedIndex(0);

                // Fetch suggestions
                const results = await getMentionSuggestions(textAfterAt);
                setSuggestions(results);
            } else if (textAfterAt.length === 0) {
                // Just typed @
                setMentionQuery('');
                setMentionStart(lastAtIndex);
                setShowSuggestions(true);
                setSelectedIndex(0);
                const results = await getMentionSuggestions('');
                setSuggestions(results);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    }, [onChange]);

    // Insert mention
    const insertMention = useCallback((user: Suggestion) => {
        if (mentionStart === -1) return;

        const beforeMention = value.slice(0, mentionStart);
        const afterMention = value.slice(mentionStart + mentionQuery.length + 1);
        const newValue = `${beforeMention}@${user.name} ${afterMention}`;

        onChange(newValue);
        setShowSuggestions(false);
        setSuggestions([]);
        setMentionQuery('');
        setMentionStart(-1);

        // Focus and set cursor position
        if (textareaRef.current) {
            const newCursorPos = mentionStart + user.name.length + 2;
            textareaRef.current.focus();
            setTimeout(() => {
                textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
        }
    }, [value, mentionStart, mentionQuery, onChange]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit) {
                e.preventDefault();
                onSubmit();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                break;
            case 'Enter':
            case 'Tab':
                e.preventDefault();
                insertMention(suggestions[selectedIndex]);
                break;
            case 'Escape':
                setShowSuggestions(false);
                break;
        }
    }, [showSuggestions, suggestions, selectedIndex, insertMention, onSubmit]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={rows}
                className={`
                    w-full px-4 py-3 text-sm bg-background border border-border rounded-xl
                    resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                    ${className}
                `}
            />

            {/* Mention suggestions dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        ref={suggestionsRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto"
                    >
                        <div className="p-1">
                            {suggestions.map((user, index) => (
                                <button
                                    key={user.id}
                                    onClick={() => insertMention(user)}
                                    className={`
                                        w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors
                                        ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}
                                    `}
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint */}
            {!showSuggestions && (
                <p className="absolute bottom-1 right-3 text-[10px] text-slate-300 pointer-events-none">
                    @로 멘션
                </p>
            )}
        </div>
    );
}

// Render mentions as highlighted text
export function renderMentions(text: string): React.ReactNode {
    const mentionPattern = /@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionPattern.exec(text)) !== null) {
        // Add text before mention
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        // Add highlighted mention
        parts.push(
            <span
                key={match.index}
                className="text-blue-600 font-semibold bg-blue-50 px-1 rounded"
            >
                @{match[1]}
            </span>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
}
