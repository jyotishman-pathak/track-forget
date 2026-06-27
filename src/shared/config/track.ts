export const TRACK_ACCENTS = {
  dsa: '#f59e0b',
  node: '#10b981',
  redis: '#f43f5e',
  webrtc: '#8b5cf6',
  ml: '#06b6d4',
} as const;

export type TrackAccentKey = keyof typeof TRACK_ACCENTS;

export const TRACK_TEMPLATES = {
  GAUNTLET: 'GAUNTLET',
  PROJECT: 'PROJECT',
  READING: 'READING',
} as const;

export type TrackTemplate = keyof typeof TRACK_TEMPLATES;

export const TRACK_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
} as const;

export type TrackStatus = keyof typeof TRACK_STATUS;

export const PHASE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type PhaseStatus = keyof typeof PHASE_STATUS;

export const TASK_DIFFICULTY = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
} as const;

export type TaskDifficulty = keyof typeof TASK_DIFFICULTY;
