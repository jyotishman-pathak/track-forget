import { create } from 'zustand';
import type { Track, Phase, Task, Session } from '@/src/shared/types';

interface TrackState {
  track: Track | null;
  phases: Phase[];
  sessions: Session[];
  selectedPhaseId: string | null;
  activeSessionId: string | null;
  setTrack: (track: Track | null) => void;
  setPhases: (phases: Phase[]) => void;
  setSessions: (sessions: Session[]) => void;
  selectPhase: (phaseId: string | null) => void;
  setActiveSession: (sessionId: string | null) => void;
  updateTaskInState: (taskId: string, updates: Partial<Task>) => void;
  updatePhaseInState: (phaseId: string, updates: Partial<Phase>) => void;
  updateTrackInState: (updates: Partial<Track>) => void;
  addSession: (session: Session) => void;
}

export const useTrackStore = create<TrackState>((set) => ({
  track: null,
  phases: [],
  sessions: [],
  selectedPhaseId: null,
  activeSessionId: null,
  setTrack: (track) => set({ track }),
  setPhases: (phases) => set({ phases }),
  setSessions: (sessions) => set({ sessions }),
  selectPhase: (phaseId) => set({ selectedPhaseId: phaseId }),
  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
  updateTaskInState: (taskId, updates) =>
    set((state) => ({
      phases: state.phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks?.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        ),
      })),
    })),
  updatePhaseInState: (phaseId, updates) =>
    set((state) => ({
      phases: state.phases.map((phase) =>
        phase.id === phaseId ? { ...phase, ...updates } : phase,
      ),
    })),
  updateTrackInState: (updates) =>
    set((state) => ({ track: state.track ? { ...state.track, ...updates } : null })),
  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
}));
