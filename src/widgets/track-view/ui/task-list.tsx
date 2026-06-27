'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { TaskRow } from '@/src/features/toggle-task';
import { createTask } from '@/src/entities/task';
import type { Phase, Task } from '@/src/shared/types';
import { progressPercent } from '@/src/shared/lib/format';
import { cn } from '@/src/shared/lib/utils';

interface TaskListProps {
  phase: Phase | null;
  accentColor: string;
  onTaskAdded: () => void;
}

export function TaskList({ phase, accentColor, onTaskAdded }: TaskListProps) {
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [adding, setAdding] = useState(false);

  if (!phase) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm text-zinc-500">Select a phase to view tasks</p>
      </div>
    );
  }

  const percent = progressPercent(phase.completed_tasks, phase.total_tasks);
  const tasks = (phase.tasks ?? []) as Task[];

  async function handleAddTask() {
    if (!newTaskDesc.trim() || !phase) return;
    setAdding(true);
    try {
      await createTask({
        phase_id: phase.id,
        description: newTaskDesc.trim(),
      });
      setNewTaskDesc('');
      onTaskAdded();
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Phase header */}
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-xs font-medium"
            style={{ color: accentColor }}
          >
            PHASE {phase.number}
          </span>
          <span className="text-zinc-600">/</span>
          <h1 className="text-lg font-medium tracking-tight text-zinc-100">
            {phase.title}
          </h1>
        </div>
        {phase.description && (
          <p className="mt-1.5 text-sm text-zinc-500">{phase.description}</p>
        )}

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: accentColor }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-zinc-400">
            {phase.completed_tasks}/{phase.total_tasks}
          </span>
          {percent === 100 && phase.total_tasks > 0 && (
            <CheckCircle2 className="h-4 w-4" style={{ color: accentColor }} />
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-zinc-500">No tasks in this phase yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Add one below to get started.
            </p>
          </div>
        )}
      </div>

      {/* Add task input */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md border border-zinc-700">
            <Plus className="h-3 w-3 text-zinc-600" />
          </div>
          <input
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !adding) handleAddTask();
            }}
            placeholder="Add a task..."
            disabled={adding}
            className={cn(
              'flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none',
              'disabled:opacity-50',
            )}
          />
          {newTaskDesc.trim() && (
            <button
              onClick={handleAddTask}
              disabled={adding}
              className="rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
