'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Flame, Clock, Layers } from 'lucide-react';
import { ProgressRing } from './progress-ring';
import { progressPercent, formatTimeToday, calculateStreak } from '@/src/shared/lib/format';

import { cn } from '@/src/shared/lib/utils';
import { Session, Track } from '@/src/shared/types';


interface TrackCardProps {
  track: Track;
  sessions?: Session[];
  index?: number;
}

const statusDot: Record<string, string> = {
  ACTIVE: 'bg-emerald-400',
  PAUSED: 'bg-amber-400',
  COMPLETED: 'bg-zinc-500',
};

export function TrackCard({ track, sessions = [], index = 0 }: TrackCardProps) {
  const percent = progressPercent(track.completed_tasks, track.total_tasks);
  const timeToday = formatTimeToday(sessions);
  const streak = calculateStreak(sessions);

  // Find current phase (first non-completed)
  const currentPhase = track.phases?.find((p) => p.status !== 'COMPLETED');
  const currentPhaseLabel = currentPhase
    ? `Phase ${currentPhase.number}: ${currentPhase.title}`
    : track.phases?.length
      ? 'All phases complete'
      : 'No phases yet';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Link href={`/track/${track.slug}`} className="group block h-full">
        <div
          className={cn(
            'glass-panel glass-panel-hover relative h-full overflow-hidden rounded-xl p-5',
            'transition-all duration-300 group-hover:scale-[1.01]',
          )}
        >
          {/* Accent glow on hover */}
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
            style={{ backgroundColor: track.accent_color }}
          />

          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: track.accent_color,
                  boxShadow: `0 0 8px ${track.accent_color}80`,
                }}
              />
              <div>
                <h3 className="text-sm font-medium tracking-tight text-zinc-100">
                  {track.name}
                </h3>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={cn(
                      'h-1 w-1 rounded-full',
                      statusDot[track.status] ?? 'bg-zinc-500',
                    )}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {track.template} · {track.category}
                  </span>
                </div>
              </div>
            </div>

            <ProgressRing
              percent={percent}
              color={track.accent_color}
              size={56}
              strokeWidth={3}
              label={`${percent}%`}
            />
          </div>

          {/* Current phase */}
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
            <Layers className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <span className="truncate text-xs text-zinc-400">{currentPhaseLabel}</span>
          </div>

          {/* Stats row — dense, Bloomberg-terminal style */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat
              icon={<Layers className="h-3 w-3" />}
              label="Tasks"
              value={`${track.completed_tasks}/${track.total_tasks}`}
            />
            <Stat
              icon={<Flame className="h-3 w-3" />}
              label="Streak"
              value={`${streak}d`}
              accent={streak > 0 ? track.accent_color : undefined}
            />
            <Stat
              icon={<Clock className="h-3 w-3" />}
              label="Today"
              value={timeToday}
            />
          </div>

          {/* Footer — progress bar + arrow */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: track.accent_color }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: index * 0.06 }}
              />
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-600 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-2.5 py-2">
      <div className="flex items-center gap-1 text-zinc-600">
        {icon}
        <span className="text-[9px] uppercase tracking-wider">{label}</span>
      </div>
      <span
        className="mt-1 block font-mono text-xs font-medium tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
