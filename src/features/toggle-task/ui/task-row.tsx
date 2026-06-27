'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Flame, Clock } from 'lucide-react';
import { TaskCheckbox } from './task-checkbox';
import { toggleTask } from '@/src/entities/task';
import { useTrackStore } from '../store';
import { updatePhaseStatus } from '@/src/entities/phase';
import type { Task } from '@/src/shared/types';
import { cn } from '@/src/shared/lib/utils';

interface TaskRowProps {
  task: Task;
  accentColor: string;
  phaseId: string;
}

const difficultyStyles: Record<string, string> = {
  easy: 'text-emerald-400/70 border-emerald-400/20',
  medium: 'text-amber-400/70 border-amber-400/20',
  hard: 'text-rose-400/70 border-rose-400/20',
};

export function TaskRow({ task, accentColor, phaseId }: TaskRowProps) {
  const [isToggling, setIsToggling] = useState(false);
  const updateTaskInState = useTrackStore((s) => s.updateTaskInState);
  const updatePhaseInState = useTrackStore((s) => s.updatePhaseInState);
  const phases = useTrackStore((s) => s.phases);

  async function handleToggle() {
    if (isToggling) return;
    setIsToggling(true);
    const newCompleted = !task.completed;

    // Optimistic update
    updateTaskInState(task.id, {
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    });

    try {
      await toggleTask(task.id, newCompleted);

      // Recompute phase progress
      const phase = phases.find((p) => p.id === phaseId);
      if (phase?.tasks) {
        const completedCount = phase.tasks.filter(
          (t) => (t.id === task.id ? newCompleted : t.completed),
        ).length;
        const total = phase.tasks.length;
        const newStatus = completedCount === total ? 'COMPLETED' : completedCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
        updatePhaseInState(phaseId, {
          completed_tasks: completedCount,
          total_tasks: total,
          status: newStatus,
        });
        if (newStatus !== phase.status) {
          updatePhaseStatus(phaseId, newStatus).catch(() => {});
        }
      }
    } catch (err) {
      // Revert on failure
      updateTaskInState(task.id, {
        completed: task.completed,
        completed_at: task.completed_at,
      });
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5',
        'transition-colors duration-200 hover:border-white/[0.06] hover:bg-white/[0.02]',
      )}
    >
      <div className="mt-0.5">
        <TaskCheckbox
          checked={task.completed}
          accentColor={accentColor}
          onToggle={handleToggle}
          disabled={isToggling}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <motion.p
            animate={{
              opacity: task.completed ? 0.5 : 1,
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              'text-sm leading-relaxed text-zinc-200',
              task.completed && 'text-zinc-500 line-through',
            )}
          >
            {task.description}
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          {task.difficulty && (
            <span
              className={cn(
                'rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                difficultyStyles[task.difficulty] ?? 'text-zinc-500 border-zinc-700',
              )}
            >
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
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <ExternalLink className="h-3 w-3" />
              <span>resource</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
