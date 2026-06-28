'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, ChevronDown, BookOpen, X } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { TaskRow } from '@/src/features/toggle-task';
import { createTask } from '@/src/entities/task';
import type { Phase, Task } from '@/src/shared/types';
import { progressPercent } from '@/src/shared/lib/format';
import { cn } from '@/src/shared/lib/utils';
import TextareaAutosize from 'react-textarea-autosize';
import 'highlight.js/styles/github-dark.css';

interface TaskListProps {
  phase: Phase | null;
  accentColor: string;
  onTaskAdded: () => void;
}

/** Extract the first meaningful concept line from raw markdown for a teaser */
function extractTeaser(md: string): string | null {
  const lines = md.split('\n');
  for (const line of lines) {
    const t = line.trim();
    // Skip empty, headings, code fences, horizontal rules, table rows
    if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('---') || t.startsWith('|')) continue;
    // Strip markdown bold/italic/link markers for teaser
    const clean = t
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^>+\s*/, '')
      .trim();
    if (clean.length > 20) return clean.length > 120 ? clean.slice(0, 117) + '…' : clean;
  }
  return null;
}

export function TaskList({ phase, accentColor, onTaskAdded }: TaskListProps) {
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [adding, setAdding] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  if (!phase) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm text-zinc-500">Select a phase to view tasks</p>
      </div>
    );
  }

  const percent = progressPercent(phase.completed_tasks, phase.total_tasks);
  const tasks = (phase.tasks ?? []) as Task[];

  // Split description: if it contains code fences or multiple paragraphs, it's rich notes
  const hasRichContent = phase.description && (
    phase.description.includes('```') ||
    phase.description.includes('\n\n') ||
    phase.description.length > 200
  );
  const teaser = phase.description ? extractTeaser(phase.description) : null;

  async function handleAddTask() {
    if (!newTaskDesc.trim() || !phase) return;
    setAdding(true);
    try {
      await createTask({
        phase_id: phase.id,
        description: newTaskDesc.trim(),
        notes: newTaskNotes.trim() || null,
      });
      setNewTaskDesc('');
      setNewTaskNotes('');
      setShowNotes(false);
      onTaskAdded();
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* ── Phase header ── */}
        <div className="border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 font-mono text-xs font-semibold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                P{phase.number}
              </span>
              <span className="text-zinc-700">/</span>
              <h1 className="truncate text-base font-semibold tracking-tight text-zinc-100">
                {phase.title}
              </h1>
            </div>

            {/* Guide button — only shown when there's rich content */}
            {hasRichContent && (
              <button
                onClick={() => setGuideOpen(true)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                  'border border-white/[0.06] text-zinc-400 transition-all',
                  'hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-zinc-200',
                )}
              >
                <BookOpen className="h-3 w-3" />
                Phase Guide
              </button>
            )}
          </div>

          {/* Teaser line — only for short descriptions */}
          {teaser && !hasRichContent && (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{teaser}</p>
          )}

          {/* Teaser for rich content */}
          {teaser && hasRichContent && (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 line-clamp-1">{teaser}</p>
          )}

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: accentColor }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums text-zinc-500">
              {phase.completed_tasks}/{phase.total_tasks}
            </span>
            {percent === 100 && phase.total_tasks > 0 && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
            )}
          </div>
        </div>

        {/* ── Task list ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                accentColor={accentColor}
                phaseId={phase.id}
              />
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06]"
                style={{ backgroundColor: `${accentColor}10` }}
              >
                <Plus className="h-4 w-4" style={{ color: accentColor }} />
              </div>
              <p className="text-sm text-zinc-500">No tasks yet</p>
              <p className="mt-1 text-xs text-zinc-700">Add the first task below</p>
            </div>
          )}
        </div>

        {/* ── Add task input ── */}
        <div className="border-t border-white/[0.06] px-4 py-3">
          <div className="flex items-start gap-2">
            <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-800">
              <Plus className="h-3 w-3 text-zinc-600" />
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <input
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !adding) handleAddTask();
                }}
                placeholder="Add a task..."
                disabled={adding}
                className={cn(
                  'flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none',
                  'disabled:opacity-50',
                )}
              />

              <AnimatePresence>
                {showNotes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <TextareaAutosize
                      value={newTaskNotes}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
                      placeholder={`Optional notes (Markdown supported)\n\n\`\`\`js\nconsole.log('hello')\n\`\`\``}
                      minRows={3}
                      disabled={adding}
                      autoFocus
                      className={cn(
                        'w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.02]',
                        'px-3 py-2 font-mono text-xs text-zinc-300',
                        'placeholder:text-zinc-700 focus:outline-none focus:border-white/[0.12]',
                        'disabled:opacity-50 transition-colors',
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {newTaskDesc.trim() && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <button
                      onClick={() => setShowNotes((v) => !v)}
                      className={cn(
                        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
                        showNotes ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-700 hover:text-zinc-500',
                      )}
                    >
                      <ChevronDown
                        className={cn('h-3 w-3 transition-transform', showNotes && 'rotate-180')}
                      />
                      {showNotes ? 'Hide notes' : 'Add notes'}
                    </button>

                    <button
                      onClick={handleAddTask}
                      disabled={adding}
                      className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-zinc-300 transition-colors hover:text-white disabled:opacity-40"
                    >
                      {adding ? 'Adding…' : 'Add'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Phase Guide Drawer ── */}
      <AnimatePresence>
        {guideOpen && phase.description && (
          <>
            {/* Backdrop */}
            <motion.div
              key="guide-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setGuideOpen(false)}
            />

            {/* Slide-over */}
            <motion.aside
              key="guide-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 38 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.08] bg-[#111113]"
            >
              {/* Guide header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <div>
                  <p
                    className="font-mono text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: accentColor }}
                  >
                    Phase {phase.number} — Guide
                  </p>
                  <h2 className="mt-0.5 text-sm font-semibold text-zinc-100">{phase.title}</h2>
                </div>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Guide content — rendered markdown */}
              <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children }) => <h1 className="mb-3 mt-6 text-lg font-bold text-zinc-100 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-2 mt-5 text-base font-semibold text-zinc-100">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-semibold text-zinc-200">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-zinc-300">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1.5">{children}</ol>,
                    li: ({ children }) => <li className="text-sm text-zinc-300 leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-3 border-l-2 pl-4 italic text-zinc-500" style={{ borderColor: accentColor }}>
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-');
                      if (isBlock) return <code className={cn('block text-xs leading-relaxed', className)}>{children}</code>;
                      return <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-xs text-zinc-200">{children}</code>;
                    },
                    pre: ({ children }) => (
                      <pre className="my-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-4 text-xs leading-relaxed">
                        {children}
                      </pre>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="underline underline-offset-2 transition-colors text-sm"
                        style={{ color: accentColor }}>
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                    em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                    hr: () => <hr className="my-6 border-white/[0.06]" />,
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-xl border border-white/[0.08]">
                        <table className="w-full text-sm">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border-b border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-left text-xs font-semibold text-zinc-400">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border-b border-white/[0.05] px-4 py-2.5 text-xs text-zinc-300">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {phase.description}
                </ReactMarkdown>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
