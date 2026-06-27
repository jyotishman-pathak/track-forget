'use client';

import { motion } from 'framer-motion';

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  percent,
  size = 64,
  strokeWidth = 4,
  color,
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/[0.06]"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 4px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        {label && (
          <span className="font-mono text-sm font-medium tabular-nums text-zinc-100">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
