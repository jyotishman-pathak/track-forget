'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, Loader2, Sparkles } from 'lucide-react';
import { parseTrackMarkdown } from '../lib/parse-markdown';
import { importTrackFromMarkdown } from '../api/import';

import { cn } from '@/src/shared/lib/utils';
import { TRACK_ACCENTS } from '@/src/shared/config/track';

interface ImportTrackDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

const SAMPLE_MARKDOWN = `## PHASE 1: Arrays & Hashing
Foundation data structures for DSA mastery.
- [ ] Two Sum [easy]
- [ ] Best Time to Buy and Sell Stock [easy]
- [ ] Contains Duplicate [easy]
- [ ] Product of Array Except Self [medium]
- [ ] Longest Consecutive Sequence [medium]

## PHASE 2: Two Pointers
- [ ] Valid Palindrome [easy]
- [ ] Two Sum II [medium]
- [ ] 3Sum [medium]
- [ ] Container With Most Water [medium]

## PHASE 3: Sliding Window
- [ ] Maximum Subarray [easy]
- [ ] Minimum Size Subarray Sum [medium]
- [ ] Longest Substring Without Repeating Characters [medium]`;

export function ImportTrackDrawer({ open, onOpenChange, onImported }: ImportTrackDrawerProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [accentColor, setAccentColor] = useState<string>(TRACK_ACCENTS.dsa);
  const [markdown, setMarkdown] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedPreview = useMemo(() => {
    if (!markdown.trim()) return [];
    return parseTrackMarkdown(markdown);
  }, [markdown]);

  const totalTasks = parsedPreview.reduce((sum, p) => sum + p.tasks.length, 0);

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  async function handleImport() {
    if (!name.trim() || !slug.trim() || !markdown.trim()) return;
    setImporting(true);
    setError(null);
    try {
      await importTrackFromMarkdown({
        name: name.trim(),
        slug: slug.trim(),
        accentColor,
        markdown,
      });
      onImported();
      // Reset
      setName('');
      setSlug('');
      setMarkdown('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import track');
    } finally {
      setImporting(false);
    }
  }

  function loadSample() {
    setMarkdown(SAMPLE_MARKDOWN);
    if (!name) setName('DSA Gauntlet');
    if (!slug) setSlug('dsa-gauntlet');
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-white/[0.06] bg-card"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center gap-2">
                <FileDown className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-medium tracking-tight text-zinc-100">
                  Import Track
                </h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
              <div className="space-y-5">
                {/* Track metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Track Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="DSA Gauntlet"
                      className="w-full rounded-md border border-white/[0.06] bg-background px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Slug
                    </label>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="dsa-gauntlet"
                      className="w-full rounded-md border border-white/[0.06] bg-background px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Accent color picker */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    {Object.entries(TRACK_ACCENTS).map(([key, color]) => (
                      <button
                        key={key}
                        onClick={() => setAccentColor(color)}
                        className={cn(
                          'h-8 w-8 rounded-full border-2 transition-all active:scale-95',
                          accentColor === color
                            ? 'border-white/40'
                            : 'border-transparent hover:scale-110',
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={key}
                      />
                    ))}
                  </div>
                </div>

                {/* Markdown input */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-400">
                      Markdown
                    </label>
                    <button
                      onClick={loadSample}
                      className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      <Sparkles className="h-3 w-3" />
                      Load sample
                    </button>
                  </div>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    placeholder={'## PHASE 1: Arrays\n- [ ] Two Sum [easy]\n- [ ] 3Sum [medium]'}
                    rows={10}
                    className="w-full resize-none rounded-md border border-white/[0.06] bg-background px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none scrollbar-thin"
                  />
                </div>

                {/* Live preview */}
                {parsedPreview.length > 0 && (
                  <div className="rounded-lg border border-white/[0.06] bg-background/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        Preview
                      </span>
                      <span className="font-mono text-xs text-zinc-500">
                        {parsedPreview.length} phases · {totalTasks} tasks
                      </span>
                    </div>
                    <div className="space-y-3">
                      {parsedPreview.map((phase) => (
                        <div key={phase.number}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            <span className="text-xs font-medium text-zinc-300">
                              Phase {phase.number}: {phase.title}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-600">
                              {phase.tasks.length} tasks
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
              <button
                onClick={() => onOpenChange(false)}
                className="rounded-md px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !name.trim() || !slug.trim() || !markdown.trim()}
                className="flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
                {importing ? 'Importing...' : 'Import Track'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
