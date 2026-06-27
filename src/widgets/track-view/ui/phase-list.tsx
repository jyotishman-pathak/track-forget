'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, Circle, Loader } from 'lucide-react';
import { useState } from 'react';
import type { Phase } from '@/src/shared/types';
import { progressPercent } from '@/src/shared/lib/format';
import { cn } from '@/src/shared/lib/utils';

interface PhaseListProps {
  phases: Phase[];
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string) => void;
  accentColor: string;
}

const phaseStatusIcon: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />,
  IN_PROGRESS: <Loader className="h-3.5 w-3.5 text-amber-400/70" />,
  NOT_STARTED: <Circle className="h-3.5 w-3.5 text-zinc-600" />,
};

export function PhaseList({ phases, selectedPhaseId, onSelectPhase, accentColor }: PhaseListProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleCollapse(phaseId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Phases
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
        {phases.map((phase) => {
          const isSelected = phase.id === selectedPhaseId;
          const isCollapsed = collapsed.has(phase.id);
          const percent = progressPercent(phase.completed_tasks, phase.total_tasks);

          return (
            <div key={phase.id} className="mb-1">
              <div
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-2 py-2 transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-white/[0.04]'
                    : 'hover:bg-white/[0.02]',
                )}
                onClick={() => onSelectPhase(phase.id)}
              >
                {/* Selection indicator */}
                <div
                  className="h-6 w-0.5 rounded-full transition-opacity"
                  style={{
                    backgroundColor: accentColor,
                    opacity: isSelected ? 1 : 0,
                  }}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse(phase.id);
                  }}
                  className="text-zinc-600 transition-colors hover:text-zinc-400"
                >
                  <motion.div animate={{ rotate: isCollapsed ? 0 : 90 }}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </motion.div>
                </button>

                {phaseStatusIcon[phase.status] ?? phaseStatusIcon.NOT_STARTED}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-600">
                      P{phase.number}
                    </span>
                    <span
                      className={cn(
                        'truncate text-xs font-medium',
                        isSelected ? 'text-zinc-100' : 'text-zinc-300',
                      )}
                    >
                      {phase.title}
                    </span>
                  </div>
                </div>

                <span className="font-mono text-[10px] tabular-nums text-zinc-600">
                  {phase.completed_tasks}/{phase.total_tasks}
                </span>
              </div>

              {/* Phase progress bar (when selected) */}
              <AnimatePresence>
                {isSelected && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-2"
                  >
                    <div className="ml-7 mt-1 h-0.5 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
