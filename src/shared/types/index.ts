import type { TrackTemplate, TrackStatus, PhaseStatus, TaskDifficulty, } from '../config/track';


export interface Track {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent_color: string;
  category: string;
  template: TrackTemplate;
  total_tasks: number;
  completed_tasks: number;
  metadata: Record<string, unknown>;
  status: TrackStatus;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  phases?: Phase[];
  sessions?: Session[];
  notes?: Note[];
}

export interface Phase {
  id: string;
  track_id: string;
  number: number;
  title: string;
  description: string | null;
  status: PhaseStatus;
  total_tasks: number;
  completed_tasks: number;
  completed_at: string | null;
  created_at: string;
  tasks?: Task[];
  notes?: Note[];
}

export interface Task {
  id: string;
  phase_id: string;
  description: string;
  completed: boolean;
  resource_url: string | null;
  difficulty: TaskDifficulty | null;
  cold_redo: boolean | null;
  time_spent_sec: number;
  completed_at: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  content: string;
  track_id: string | null;
  phase_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  track_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number;
  notes: string | null;
  created_at: string;
}

export interface TrackWithRelations extends Track {
  phases: Phase[];
  sessions: Session[];
}

export interface PhaseWithTasks extends Phase {
  tasks: Task[];
}
