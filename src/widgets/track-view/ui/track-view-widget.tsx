'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { PhaseList } from './phase-list';

import { SessionTimer } from '@/src/features/start-session';
import { fetchTrackBySlug } from '@/src/entities/track';
import { useTrackStore } from '@/src/features/toggle-task/store';

import { TaskList } from './task-list';

interface TrackViewWidgetProps {
  slug: string;
}

export function TrackViewWidget({ slug }: TrackViewWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const track = useTrackStore((s) => s.track);
  const phases = useTrackStore((s) => s.phases);
  const sessions = useTrackStore((s) => s.sessions);
  const selectedPhaseId = useTrackStore((s) => s.selectedPhaseId);
  const setTrack = useTrackStore((s) => s.setTrack);
  const setPhases = useTrackStore((s) => s.setPhases);
  const setSessions = useTrackStore((s) => s.setSessions);
  const selectPhase = useTrackStore((s) => s.selectPhase);

  const loadTrack = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrackBySlug(slug);
      if (!data) {
        setError('Track not found');
        return;
      }
      setTrack(data);
      setPhases(data.phases);
      setSessions(data.sessions);
      // Auto-select first non-completed phase, or first phase
      const firstActive = data.phases.find((p) => p.status !== 'COMPLETED');
      selectPhase((firstActive ?? data.phases[0])?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load track');
    } finally {
      setLoading(false);
    }
  }, [slug, setTrack, setPhases, setSessions, selectPhase]);

  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? null;
  const accentColor = track?.accent_color ?? '#f59e0b';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/[0.08] border-t-zinc-400" />
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-zinc-400">{error ?? 'Track not found'}</p>
        <Link
          href="/"
          className="rounded-md border border-white/[0.06] px-4 py-2 text-sm text-zinc-300 hover:bg-white/[0.04]"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 6px ${accentColor}80`,
              }}
            />
            <h1 className="text-sm font-medium tracking-tight text-zinc-100">
              {track.name}
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
              {track.template}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SessionTimer trackId={track.id} accentColor={accentColor} />
          <button
            onClick={() => setFocusMode((v) => !v)}
            title={focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300"
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.04] hover:text-zinc-300">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden in focus mode */}
        {!focusMode && (
          <aside className="w-72 shrink-0 border-r border-white/[0.06] bg-card/30">
            <PhaseList
              phases={phases}
              selectedPhaseId={selectedPhaseId}
              onSelectPhase={selectPhase}
              accentColor={accentColor}
            />
          </aside>
        )}

        {/* Main content */}
        <main
          className="flex-1 overflow-hidden transition-all"
          style={focusMode ? { maxWidth: '720px', margin: '0 auto', width: '100%' } : undefined}
        >
          <TaskList
            phase={selectedPhase}
            accentColor={accentColor}
            onTaskAdded={loadTrack}
          />
        </main>
      </div>

      {/* Focus mode dim overlay for header/sidebar context */}
      {focusMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none fixed inset-0 z-10 bg-black/40"
          style={{ clipPath: 'inset(0 0 0 0)' }}
        />
      )}
    </div>
  );
}
