'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader } from 'lucide-react';
import type { Phase } from '@/src/shared/types';
import { progressPercent } from '@/src/shared/lib/format';
import { cn } from '@/src/shared/lib/utils';

interface PhaseListProps {
  phases: Phase[];
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string) => void;
  accentColor: string;
}

function PhaseStatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') return <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400/80" />;
  if (status === 'IN_PROGRESS') return (
    <div className="relative h-3 w-3 shrink-0">
      <Loader className="h-3 w-3 animate-spin text-amber-400/70" />
    </div>
  );
  return <Circle className="h-3 w-3 shrink-0 text-zinc-700" />;
}

export function PhaseList({ phases, selectedPhaseId, onSelectPhase, accentColor }: PhaseListProps) {
  const completed = phases.filter((p) => p.status === 'COMPLETED').length;
  const totalPercent = Math.round((completed / Math.max(phases.length, 1)) * 100);

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar header */}
      <div className="border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Phases
          </h2>
          <span className="font-mono text-[10px] text-zinc-600">
            {completed}/{phases.length}
          </span>
        </div>
        {/* Overall track progress */}
        <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/[0.04]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor }}
            initial={{ width: 0 }}
            animate={{ width: `${totalPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Phase list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {phases.map((phase) => {
          const isSelected = phase.id === selectedPhaseId;
          const percent = progressPercent(phase.completed_tasks, phase.total_tasks);

          return (
            <div key={phase.id}>
              <button
                onClick={() => onSelectPhase(phase.id)}
                className={cn(
                  'group relative flex w-full items-center gap-2.5 px-4 py-2 text-left transition-all duration-150',
                  isSelected
                    ? 'bg-white/[0.04]'
                    : 'hover:bg-white/[0.02]',
                )}
              >
                {/* Active indicator bar */}
                <div
                  className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: accentColor,
                    opacity: isSelected ? 1 : 0,
                  }}
                />

                <PhaseStatusIcon status={phase.status} />

                {/* Title + number */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 font-mono text-[9px] text-zinc-700">
                      P{phase.number}
                    </span>
                    <span
                      className={cn(
                        'truncate text-xs transition-colors',
                        isSelected
                          ? 'font-medium text-zinc-100'
                          : phase.status === 'COMPLETED'
                          ? 'text-zinc-500'
                          : 'text-zinc-300 group-hover:text-zinc-200',
                      )}
                    >
                      {phase.title}
                    </span>
                  </div>

                  {/* Per-phase mini progress */}
                  {phase.total_tasks > 0 && (
                    <div className="mt-1 h-[2px] overflow-hidden rounded-full bg-white/[0.03]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: isSelected ? accentColor : `${accentColor}60`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Task count */}
                <span
                  className={cn(
                    'shrink-0 font-mono text-[10px] tabular-nums',
                    isSelected ? 'text-zinc-500' : 'text-zinc-700',
                  )}
                >
                  {phase.completed_tasks}/{phase.total_tasks}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
