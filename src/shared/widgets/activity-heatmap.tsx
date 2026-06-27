'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Session } from '@/src/shared/types';

interface ActivityHeatmapProps {
  sessions: Session[];
  accentColor?: string;
  weeks?: number;
}

function getDayKey(date: Date) {
  return date.toISOString().split('T')[0];
}

export function ActivityHeatmap({
  sessions,
  accentColor = '#f59e0b',
  weeks = 18,
}: ActivityHeatmapProps) {
  const { grid, maxCount, monthLabels } = useMemo(() => {
    // Build map of date → total seconds
    const dateMap: Record<string, number> = {};
    for (const s of sessions) {
      const key = getDayKey(new Date(s.started_at));
      dateMap[key] = (dateMap[key] ?? 0) + s.duration_sec;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Align to Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

    const cols: { date: Date; seconds: number }[][] = [];
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < weeks; w++) {
      const col: { date: Date; seconds: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        const key = getDayKey(date);
        col.push({ date, seconds: dateMap[key] ?? 0 });

        if (date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth();
          monthLabels.push({
            label: date.toLocaleString('default', { month: 'short' }),
            col: w,
          });
        }
      }
      cols.push(col);
    }

    const allSeconds = Object.values(dateMap);
    const maxCount = allSeconds.length > 0 ? Math.max(...allSeconds) : 1;

    return { grid: cols, maxCount, monthLabels };
  }, [sessions, weeks]);

  function getCellOpacity(seconds: number): number {
    if (seconds === 0) return 0;
    const ratio = Math.min(seconds / maxCount, 1);
    return 0.15 + ratio * 0.85;
  }

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="w-full overflow-hidden">
      <div className="flex items-start gap-2 overflow-x-auto scrollbar-thin pb-2">
        {/* Day labels */}
        <div className="mt-5 flex shrink-0 flex-col gap-[3px]">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="flex h-[11px] items-center">
              {i % 2 !== 0 && (
                <span className="font-mono text-[9px] text-zinc-700">{d}</span>
              )}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-col">
          {/* Month labels */}
          <div className="relative mb-1 flex h-4">
            {monthLabels.map(({ label, col }) => (
              <div
                key={`${label}-${col}`}
                className="absolute font-mono text-[9px] text-zinc-600"
                style={{ left: `${col * 14}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-[3px]">
            {grid.map((col, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {col.map(({ date, seconds }, di) => {
                  const opacity = getCellOpacity(seconds);
                  const isToday =
                    getDayKey(date) === getDayKey(new Date());
                  const isFuture = date > new Date();

                  return (
                    <motion.div
                      key={di}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.002, duration: 0.15 }}
                      title={
                        seconds > 0
                          ? `${date.toDateString()}: ${Math.round(seconds / 60)}m`
                          : date.toDateString()
                      }
                      className="h-[11px] w-[11px] rounded-[2px] transition-transform hover:scale-125"
                      style={{
                        backgroundColor: isFuture
                          ? 'transparent'
                          : seconds === 0
                          ? 'rgba(255,255,255,0.04)'
                          : accentColor,
                        opacity: isFuture ? 0 : opacity,
                        outline: isToday ? `1px solid ${accentColor}` : 'none',
                        outlineOffset: '1px',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-2">
        <span className="font-mono text-[9px] text-zinc-700">Less</span>
        {[0, 0.2, 0.45, 0.7, 1].map((op, i) => (
          <div
            key={i}
            className="h-[10px] w-[10px] rounded-[2px]"
            style={{
              backgroundColor: op === 0 ? 'rgba(255,255,255,0.04)' : accentColor,
              opacity: op === 0 ? 1 : 0.15 + op * 0.85,
            }}
          />
        ))}
        <span className="font-mono text-[9px] text-zinc-700">More</span>
      </div>
    </div>
  );
}
