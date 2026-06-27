'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Activity, Layers, Clock, Flame, CalendarDays } from 'lucide-react';
import { TrackCard } from './track-card';
import { ImportTrackDrawer } from '@/src/features/import-track';
import { fetchTracks } from '@/src/entities/track';
import { fetchSessionsByTrack } from '@/src/entities/session';
import type { Track, Session } from '@/src/shared/types';
import { formatDuration, calculateStreak } from '@/src/shared/lib/format';
import { CommandPalette } from '@/src/shared/widgets/command-palette';
import { ActivityHeatmap } from '@/src/shared/widgets/activity-heatmap';

export function DashboardWidget() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const loadTracks = useCallback(async () => {
    try {
      const data = await fetchTracks();
      setTracks(data);
      const sessionsEntries = await Promise.all(
        data.map(async (t) => [t.id, await fetchSessionsByTrack(t.id)] as const),
      );
      setSessionsMap(Object.fromEntries(sessionsEntries));
    } catch (err) {
      console.error('Failed to load tracks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const totalTasks = tracks.reduce((sum, t) => sum + t.total_tasks, 0);
  const completedTasks = tracks.reduce((sum, t) => sum + t.completed_tasks, 0);
  const allSessions = Object.values(sessionsMap).flat();
  const totalTime = allSessions.reduce((sum, s) => sum + s.duration_sec, 0);
  const streak = calculateStreak(allSessions);

  // Aggregate accent color for heatmap (use first track's or amber)
  const heatmapAccent = tracks[0]?.accent_color ?? '#f59e0b';

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d39980]" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Command Center
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
            TrackForge
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Your learning gauntlet. {tracks.length} tracks in pursuit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cmd+K palette */}
          <CommandPalette
            tracks={tracks.map((t) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
              accent_color: t.accent_color,
              template: t.template,
            }))}
          />

          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm font-medium text-zinc-200 transition-all hover:border-white/[0.12] hover:bg-white/[0.04] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Import Track
          </button>
        </div>
      </div>

      {/* Global stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <GlobalStat
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Active Tracks"
          value={`${tracks.length}`}
        />
        <GlobalStat
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Tasks Done"
          value={`${completedTasks}/${totalTasks}`}
        />
        <GlobalStat
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Total Time"
          value={formatDuration(totalTime)}
        />
        <GlobalStat
          icon={<Flame className="h-3.5 w-3.5 text-amber-400" />}
          label="Day Streak"
          value={streak > 0 ? `${streak}d 🔥` : '0d'}
          highlight={streak >= 3}
        />
      </div>

      {/* Activity Heatmap — collapsible */}
      <div className="mb-6 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01]">
        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Activity</span>
            <span className="font-mono text-xs text-zinc-600">
              {allSessions.length} sessions
            </span>
          </div>
          <motion.span
            animate={{ rotate: showHeatmap ? 180 : 0 }}
            className="text-zinc-600"
          >
            ▾
          </motion.span>
        </button>

        <motion.div
          initial={false}
          animate={{ height: showHeatmap ? 'auto' : 0, opacity: showHeatmap ? 1 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 pt-1">
            <ActivityHeatmap sessions={allSessions} accentColor={heatmapAccent} />
          </div>
        </motion.div>
      </div>

      {/* Track grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.01]"
            />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <EmptyState onImport={() => setImportOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, i) => (
            <TrackCard
              key={track.id}
              track={track}
              sessions={sessionsMap[track.id] ?? []}
              index={i}
            />
          ))}
        </div>
      )}

      <ImportTrackDrawer
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={loadTracks}
      />
    </div>
  );
}

function GlobalStat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`glass-panel rounded-lg px-4 py-3 transition-colors ${highlight ? 'border-amber-400/20' : ''}`}>
      <div className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span className={`mt-1.5 block font-mono text-lg font-medium tabular-nums ${highlight ? 'text-amber-300' : 'text-zinc-100'}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-20"
    >
      <p className="text-sm text-zinc-400">No tracks yet.</p>
      <p className="mt-1 text-xs text-zinc-600">
        Import your first track from markdown to get started.
      </p>
      <button
        onClick={onImport}
        className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-all hover:bg-white active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        Import Track
      </button>
    </motion.div>
  );
}
