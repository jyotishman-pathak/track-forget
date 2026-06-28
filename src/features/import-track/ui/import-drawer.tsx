'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, Loader2, FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseTrackMarkdown } from '../lib/parse-markdown';
import { importTrackFromMarkdown } from '../api/import';
import { cn } from '@/src/shared/lib/utils';
import { TRACK_ACCENTS } from '@/src/shared/config/track';

interface ImportTrackDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

interface MarkdownFile {
  filename: string;
  label: string;
}

// Smart defaults based on filename
function getDefaultsForFile(filename: string): { name: string; slug: string; accent: string } {
  const map: Record<string, { name: string; slug: string; accent: string }> = {
    'dsa-150-gauntlet.md':        { name: '150 DSA Gauntlet', slug: 'dsa-150-gauntlet', accent: TRACK_ACCENTS.dsa },
    'nodejs-backend-gauntlet.md': { name: 'Node.js Backend Gauntlet', slug: 'nodejs-backend', accent: TRACK_ACCENTS.node },
    'redis-gauntlet.md':          { name: 'Redis Gauntlet', slug: 'redis-gauntlet', accent: TRACK_ACCENTS.redis },
    'webrtc-insane-prompt.md':    { name: 'WebRTC Gauntlet', slug: 'webrtc-gauntlet', accent: TRACK_ACCENTS.webrtc },
    'ml_pr.md':                   { name: 'ML Medical AI Gauntlet', slug: 'ml-medical-ai', accent: TRACK_ACCENTS.ml },
  };
  return map[filename] ?? {
    name: filename.replace('.md', '').replace(/-/g, ' '),
    slug: filename.replace('.md', ''),
    accent: Object.values(TRACK_ACCENTS)[0],
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ImportTrackDrawer({ open, onOpenChange, onImported }: ImportTrackDrawerProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [accentColor, setAccentColor] = useState<string>(Object.values(TRACK_ACCENTS)[0]);
  const [markdown, setMarkdown] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Preset files
  const [mdFiles, setMdFiles] = useState<MarkdownFile[]>([]);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [loadedFile, setLoadedFile] = useState<string | null>(null);

  // Fetch available markdown files
  useEffect(() => {
    if (!open) return;
    fetch('/api/markdowns')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMdFiles(data);
      })
      .catch(() => {});
  }, [open]);

  const parsedPreview = useMemo(() => {
    if (!markdown.trim()) return [];
    return parseTrackMarkdown(markdown);
  }, [markdown]);

  const totalTasks = parsedPreview.reduce((sum, p) => sum + p.tasks.length, 0);
  const totalNotes = parsedPreview.filter((p) => p.notes).length;

  async function loadMarkdownFile(filename: string) {
    setLoadingFile(filename);
    setError(null);
    try {
      const res = await fetch(`/markdowns/${filename}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const text = await res.text();
      setMarkdown(text);
      setLoadedFile(filename);

      // Auto-fill name/slug/color if empty
      const defaults = getDefaultsForFile(filename);
      if (!name || name === '') setName(defaults.name);
      if (!slug || slug === '') setSlug(defaults.slug);
      setAccentColor(defaults.accent);
    } catch (e) {
      setError(`Failed to load ${filename}`);
    } finally {
      setLoadingFile(null);
    }
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
    setSuccess(false);
    try {
      await importTrackFromMarkdown({
        name: name.trim(),
        slug: slug.trim(),
        accentColor,
        markdown,
      });
      setSuccess(true);
      onImported();
      setTimeout(() => {
        setName('');
        setSlug('');
        setMarkdown('');
        setLoadedFile(null);
        setSuccess(false);
        onOpenChange(false);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import track');
    } finally {
      setImporting(false);
    }
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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-white/[0.06] bg-[#111113]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center gap-2">
                <FileDown className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-medium tracking-tight text-zinc-100">
                  Import Track from Markdown
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
              <div className="space-y-6">

                {/* ── Pre-built Gauntlets ── */}
                {mdFiles.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FolderOpen className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-xs font-medium text-zinc-400">
                        Pre-built Gauntlets
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {mdFiles.map((file) => {
                        const defaults = getDefaultsForFile(file.filename);
                        const isLoaded = loadedFile === file.filename;
                        const isLoading = loadingFile === file.filename;
                        return (
                          <button
                            key={file.filename}
                            onClick={() => loadMarkdownFile(file.filename)}
                            disabled={isLoading}
                            className={cn(
                              'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all',
                              isLoaded
                                ? 'border-white/[0.12] bg-white/[0.05]'
                                : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]',
                            )}
                          >
                            {/* Color dot */}
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: defaults.accent }}
                            />

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-zinc-200">
                                {defaults.name}
                              </p>
                              <p className="font-mono text-[10px] text-zinc-600">
                                {file.filename}
                              </p>
                            </div>

                            {isLoading && (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500" />
                            )}
                            {isLoaded && !isLoading && (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Track Metadata ── */}
                <div>
                  <p className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Track Details
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                        Track Name
                      </label>
                      <input
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="DSA Gauntlet"
                        className="w-full rounded-md border border-white/[0.06] bg-black/20 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
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
                        className="w-full rounded-md border border-white/[0.06] bg-black/20 px-3 py-2 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Accent color */}
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Accent Color
                    </label>
                    <div className="flex gap-2">
                      {Object.entries(TRACK_ACCENTS).map(([key, color]) => (
                        <button
                          key={key}
                          onClick={() => setAccentColor(color)}
                          className={cn(
                            'h-7 w-7 rounded-full border-2 transition-all active:scale-95',
                            accentColor === color
                              ? 'border-white/50 scale-110'
                              : 'border-transparent hover:scale-110',
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={key}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Markdown Paste Area ── */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-400">
                      Markdown
                      {loadedFile && (
                        <span className="ml-2 font-mono text-[10px] text-zinc-600">
                          ({loadedFile})
                        </span>
                      )}
                    </label>
                    {markdown && (
                      <button
                        onClick={() => { setMarkdown(''); setLoadedFile(null); }}
                        className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    placeholder={'## PHASE 1 — Arrays\n- [ ] Two Sum\n- [ ] 3Sum [medium]\n\n## PHASE 2 — Binary Search\n- [ ] Search in Rotated Array [medium]'}
                    rows={8}
                    className="w-full resize-none rounded-md border border-white/[0.06] bg-black/20 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-200 placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none scrollbar-thin"
                  />
                </div>

                {/* ── Live Preview ── */}
                {parsedPreview.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">Preview</span>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
                        <span>{parsedPreview.length} phases</span>
                        <span>{totalTasks} tasks</span>
                        {totalNotes > 0 && (
                          <span className="text-zinc-600">{totalNotes} with notes</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {parsedPreview.map((phase) => (
                        <div key={phase.number} className="flex items-start gap-2.5">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: accentColor }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-300">
                                P{phase.number}: {phase.title}
                              </span>
                              <span className="font-mono text-[10px] text-zinc-600">
                                {phase.tasks.length} tasks
                              </span>
                              {phase.notes && (
                                <span className="font-mono text-[10px] text-zinc-700">
                                  + notes
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span className="text-xs text-rose-400">{error}</span>
                  </div>
                )}

                {/* Success */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Track imported successfully!</span>
                  </motion.div>
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
                disabled={importing || !name.trim() || !slug.trim() || !markdown.trim() || success}
                className="flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : success ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
                {importing ? 'Importing…' : success ? 'Done!' : `Import${totalTasks ? ` (${totalTasks} tasks)` : ''}`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
