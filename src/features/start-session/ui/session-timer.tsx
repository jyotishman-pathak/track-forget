'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Timer, Coffee, ChevronDown } from 'lucide-react';
import { startSession, endSession } from '@/src/entities/session';
import { useTrackStore } from '@/src/features/toggle-task/store';
import { formatDuration } from '@/src/shared/lib/format';
import { cn } from '@/src/shared/lib/utils';

interface SessionTimerProps {
  trackId: string;
  accentColor: string;
}

type PomodoroMode = 'session' | 'pomodoro';
const POMODORO_DURATION = 25 * 60; // 25 min
const BREAK_DURATION = 5 * 60;     // 5 min

export function SessionTimer({ trackId, accentColor }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<PomodoroMode>('session');
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeSessionId = useTrackStore((s) => s.activeSessionId);
  const setActiveSession = useTrackStore((s) => s.setActiveSession);
  const addSession = useTrackStore((s) => s.addSession);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        // Pomodoro auto-switch
        if (mode === 'pomodoro') {
          const target = pomodoroPhase === 'work' ? POMODORO_DURATION : BREAK_DURATION;
          if (next >= target) {
            // Play a subtle notification
            try { new Audio('/sounds/bell.mp3').play().catch(() => {}); } catch {}
            if (pomodoroPhase === 'work') {
              setPomodoroPhase('break');
              setPomodoroCount((c) => c + 1);
            } else {
              setPomodoroPhase('work');
            }
            return 0;
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, pomodoroPhase]);

  const handleStart = useCallback(async () => {
    try {
      const session = await startSession(trackId);
      setActiveSession(session.id);
      addSession(session);
      setElapsed(0);
      setIsRunning(true);
      if (mode === 'pomodoro') setPomodoroPhase('work');
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  }, [trackId, setActiveSession, addSession, mode]);

  const handleStop = useCallback(async () => {
    if (!activeSessionId) return;
    setIsRunning(false);
    try {
      const ended = await endSession(activeSessionId);
      addSession(ended);
      setActiveSession(null);
      setElapsed(0);
      setPomodoroPhase('work');
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, [activeSessionId, setActiveSession, addSession]);

  // Pomodoro: remaining time vs elapsed
  const displayTime = mode === 'pomodoro'
    ? (pomodoroPhase === 'work' ? POMODORO_DURATION : BREAK_DURATION) - elapsed
    : elapsed;

  const pomodoroProgress = mode === 'pomodoro'
    ? elapsed / (pomodoroPhase === 'work' ? POMODORO_DURATION : BREAK_DURATION)
    : 0;

  const isBreak = mode === 'pomodoro' && pomodoroPhase === 'break';

  return (
    <div className="flex items-center gap-2">
      {/* Mode switcher */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowModeMenu((v) => !v)}
          disabled={isRunning}
          className={cn(
            'flex items-center gap-1 rounded-md border border-white/[0.06] px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
            isRunning ? 'cursor-not-allowed opacity-40' : 'text-zinc-500 hover:text-zinc-300 hover:border-white/[0.12]',
          )}
        >
          {mode === 'pomodoro' ? <Coffee className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
          {mode === 'pomodoro' ? 'Pomodoro' : 'Session'}
          <ChevronDown className="h-2.5 w-2.5" />
        </button>

        <AnimatePresence>
          {showModeMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-900 shadow-xl"
            >
              {(['session', 'pomodoro'] as PomodoroMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setShowModeMenu(false); setElapsed(0); setPomodoroPhase('work'); }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors',
                    mode === m ? 'text-zinc-100 bg-white/[0.04]' : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200',
                  )}
                >
                  {m === 'pomodoro' ? <Coffee className="h-3 w-3" /> : <Timer className="h-3 w-3" />}
                  {m === 'pomodoro' ? 'Pomodoro (25m)' : 'Free Session'}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timer display */}
      <div
        className={cn(
          'relative flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors',
          isRunning
            ? isBreak
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-white/[0.08] bg-white/[0.03]'
            : 'border-white/[0.04] bg-transparent',
        )}
      >
        {/* Pomodoro progress ring inset */}
        {mode === 'pomodoro' && isRunning && (
          <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none">
            <rect
              x="0" y="0" width="100%" height="100%"
              rx="6" ry="6"
              fill="none"
              stroke={isBreak ? '#34d399' : accentColor}
              strokeWidth="1"
              strokeOpacity={0.25}
              strokeDasharray="1000"
              strokeDashoffset={`${(1 - pomodoroProgress) * 1000}`}
              pathLength="1000"
            />
          </svg>
        )}

        {isBreak ? (
          <Coffee className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Timer
            className={cn('h-3.5 w-3.5', isRunning ? 'text-zinc-300' : 'text-zinc-500')}
            style={isRunning && !isBreak ? { color: accentColor } : undefined}
          />
        )}

        <span className="font-mono text-sm tabular-nums text-zinc-200">
          {formatDuration(displayTime)}
        </span>

        {/* Pomodoro count badges */}
        {mode === 'pomodoro' && pomodoroCount > 0 && (
          <span className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(pomodoroCount, 4) }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
            ))}
            {pomodoroCount > 4 && (
              <span className="font-mono text-[9px] text-amber-400/60">+{pomodoroCount - 4}</span>
            )}
          </span>
        )}

        {isRunning && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: isBreak ? '#34d399' : accentColor }}
          />
        )}

        {isBreak && isRunning && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400/70">break</span>
        )}
      </div>

      <button
        onClick={isRunning ? handleStop : handleStart}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]',
          isRunning
            ? 'border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10'
            : 'border border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05]',
        )}
      >
        {isRunning ? (
          <>
            <Square className="h-3 w-3 fill-current" />
            Stop
          </>
        ) : (
          <>
            <Play className="h-3 w-3 fill-current" />
            {mode === 'pomodoro' ? 'Focus' : 'Start Session'}
          </>
        )}
      </button>
    </div>
  );
}
