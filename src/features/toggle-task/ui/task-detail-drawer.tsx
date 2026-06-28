'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Eye,
  Code2,
  Save,
  ExternalLink,
  Flame,
  Clock,
  FileText,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import TextareaAutosize from 'react-textarea-autosize';
import type { Task } from '@/src/shared/types';
import { updateTaskNotes } from '@/src/entities/task';
import { useTrackStore } from './../../toggle-task/store';
import { cn } from '@/src/shared/lib/utils';
import 'highlight.js/styles/github-dark.css';

interface TaskDetailDrawerProps {
  task: Task | null;
  accentColor: string;
  onClose: () => void;
}

const difficultyStyles: Record<string, string> = {
  easy: 'text-emerald-400/70 border-emerald-400/20 bg-emerald-400/5',
  medium: 'text-amber-400/70 border-amber-400/20 bg-amber-400/5',
  hard: 'text-rose-400/70 border-rose-400/20 bg-rose-400/5',
};

export function TaskDetailDrawer({ task, accentColor, onClose }: TaskDetailDrawerProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const updateTaskInState = useTrackStore((s) => s.updateTaskInState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync content when task changes
  useEffect(() => {
    if (task) {
      setContent(task.notes ?? '');
      setSaved(false);
    }
  }, [task?.id]);

  // Auto-save with debounce
  const autoSave = useCallback(
    async (value: string) => {
      if (!task) return;
      setSaving(true);
      try {
        await updateTaskNotes(task.id, value.trim() || null);
        updateTaskInState(task.id, { notes: value.trim() || null });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error('Failed to save notes:', err);
      } finally {
        setSaving(false);
      }
    },
    [task, updateTaskInState],
  );

  function handleChange(value: string) {
    setContent(value);
    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(value), 1200);
  }

  // Cleanup timer on unmount
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
            className={cn(
              'fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col',
              'border-l border-white/[0.08] bg-[#111113]',
            )}
          >
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-white/[0.06] px-6 py-4">
              <div className="flex-1 min-w-0">
                <p
                  className="font-mono text-[10px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: accentColor }}
                >
                  Task Notes
                </p>
                <h2 className={cn('text-sm font-medium leading-snug', task.completed ? 'text-zinc-500 line-through' : 'text-zinc-100')}>
                  {task.description}
                </h2>

                {/* Meta badges */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {task.difficulty && (
                    <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider', difficultyStyles[task.difficulty] ?? 'text-zinc-500 border-zinc-700')}>
                      {task.difficulty}
                    </span>
                  )}
                  {task.cold_redo && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400/60">
                      <Flame className="h-3 w-3" />
                      <span className="uppercase tracking-wider">Cold Redo</span>
                    </span>
                  )}
                  {task.time_spent_sec > 0 && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-600">
                      <Clock className="h-3 w-3" />
                      {Math.round(task.time_spent_sec / 60)}m
                    </span>
                  )}
                  {task.resource_url && (
                    <a
                      href={task.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>resource</span>
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-2">
              <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
                <button
                  onClick={() => setMode('edit')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    mode === 'edit'
                      ? 'bg-white/[0.08] text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  <Code2 className="h-3 w-3" />
                  Write
                </button>
                <button
                  onClick={() => setMode('preview')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                    mode === 'preview'
                      ? 'bg-white/[0.08] text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>

              <div className="flex items-center gap-2">
                {saving && (
                  <span className="text-[10px] font-mono text-zinc-600 animate-pulse">saving…</span>
                )}
                {saved && !saving && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[10px] font-mono"
                    style={{ color: accentColor }}
                  >
                    <Save className="h-3 w-3" />
                    Saved
                  </motion.span>
                )}
                <span className="font-mono text-[10px] text-zinc-700">
                  Markdown supported
                </span>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden">
              {mode === 'edit' ? (
                <TextareaAutosize
                  value={content}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder={`# Notes\n\nWrite anything in Markdown...\n\n\`\`\`js\n// code blocks work too\n\`\`\``}
                  minRows={20}
                  className={cn(
                    'h-full w-full resize-none bg-transparent px-6 py-5 font-mono text-sm',
                    'text-zinc-300 placeholder:text-zinc-700 focus:outline-none',
                    'leading-relaxed',
                  )}
                />
              ) : (
                <div className="h-full overflow-y-auto px-6 py-5">
                  {content.trim() ? (
                  <div className="prose-task">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="mb-3 mt-6 text-xl font-semibold text-zinc-100 first:mt-0">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mb-2 mt-5 text-lg font-semibold text-zinc-100">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mb-2 mt-4 text-base font-semibold text-zinc-200">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-3 text-sm leading-relaxed text-zinc-300">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm text-zinc-300">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote
                            className="my-3 border-l-2 pl-4 italic text-zinc-500"
                            style={{ borderColor: accentColor }}
                          >
                            {children}
                          </blockquote>
                        ),
                        code: ({ children, className }) => {
                          const isBlock = className?.includes('language-');
                          if (isBlock) {
                            return (
                              <code className={cn('block text-xs', className)}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-zinc-300">
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="my-3 overflow-x-auto rounded-lg border border-white/[0.08] bg-[#0d0d0f] p-4 text-xs">
                            {children}
                          </pre>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm underline underline-offset-2 transition-colors"
                            style={{ color: accentColor }}
                          >
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-zinc-100">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-zinc-400">{children}</em>
                        ),
                        hr: () => (
                          <hr className="my-6 border-white/[0.08]" />
                        ),
                        table: ({ children }) => (
                          <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.08]">
                            <table className="w-full text-sm">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border-b border-white/[0.08] bg-white/[0.03] px-4 py-2 text-left text-xs font-medium text-zinc-400">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border-b border-white/[0.06] px-4 py-2 text-xs text-zinc-300">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <FileText className="mb-3 h-8 w-8 text-zinc-700" />
                      <p className="text-sm text-zinc-600">Nothing to preview yet.</p>
                      <p className="mt-1 text-xs text-zinc-700">Switch to Write mode and start typing.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-white/[0.06] px-6 py-3">
              <p className="text-[10px] text-zinc-700">
                Notes auto-save after you stop typing. Supports <span className="text-zinc-600">**bold**</span>, <span className="text-zinc-600">*italic*</span>, <span className="text-zinc-600">`code`</span>, <span className="text-zinc-600">```fenced blocks```</span>, tables, lists, and more.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
