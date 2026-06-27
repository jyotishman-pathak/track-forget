'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

interface TaskCheckboxProps {
  checked: boolean;
  accentColor: string;
  onToggle: () => void;
  disabled?: boolean;
}

export function TaskCheckbox({ checked, accentColor, onToggle, disabled }: TaskCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors duration-200',
        'active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'border-transparent'
          : 'border-zinc-700 hover:border-zinc-500',
      )}
      style={
        checked
          ? { backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}40` }
          : undefined
      }
    >
      <motion.span
        initial={false}
        animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="flex items-center justify-center text-black"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </motion.span>
    </button>
  );
}
