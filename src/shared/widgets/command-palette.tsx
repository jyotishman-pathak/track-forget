'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Layers, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/src/shared/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface CommandPaletteProps {
  tracks: { id: string; name: string; slug: string; accent_color: string; template: string }[];
}

export function CommandPalette({ tracks }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const allCommands: CommandItem[] = [
    ...tracks.map((t) => ({
      id: `track-${t.id}`,
      label: t.name,
      sublabel: t.template,
      icon: (
        <span
          className="flex h-5 w-5 items-center justify-center rounded"
          style={{ backgroundColor: `${t.accent_color}22`, color: t.accent_color }}
        >
          <Layers className="h-3 w-3" />
        </span>
      ),
      action: () => router.push(`/track/${t.slug}`),
      category: 'Tracks',
    })),
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      sublabel: 'Home',
      icon: <Hash className="h-4 w-4 text-zinc-500" />,
      action: () => router.push('/'),
      category: 'Navigation',
    },
  ];

  const filtered = query.trim()
    ? allCommands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.sublabel?.toLowerCase().includes(query.toLowerCase()),
      )
    : allCommands;

  // Group by category
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatFiltered = Object.values(groups).flat();

  function handleSelect(cmd: CommandItem) {
    cmd.action();
    setOpen(false);
    setQuery('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (flatFiltered[selectedIndex]) handleSelect(flatFiltered[selectedIndex]);
    }
  }

  useEffect(() => setSelectedIndex(0), [query]);

  return (
    <>
      {/* Trigger hint */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-white/[0.10] hover:text-zinc-400 md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 rounded border border-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950 shadow-2xl"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Jump to track, navigate..."
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
                <kbd className="shrink-0 rounded border border-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {flatFiltered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-zinc-600">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  Object.entries(groups).map(([category, items]) => (
                    <div key={category} className="mb-2">
                      <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                        {category}
                      </p>
                      {items.map((cmd) => {
                        const globalIndex = flatFiltered.indexOf(cmd);
                        const isSelected = globalIndex === selectedIndex;
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => handleSelect(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                              isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]',
                            )}
                          >
                            {cmd.icon}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-zinc-100">{cmd.label}</p>
                              {cmd.sublabel && (
                                <p className="truncate font-mono text-[10px] text-zinc-600">
                                  {cmd.sublabel}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2">
                <div className="flex items-center gap-3 text-[10px] text-zinc-700">
                  <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                  <span><kbd className="font-mono">↵</kbd> open</span>
                  <span><kbd className="font-mono">esc</kbd> close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
