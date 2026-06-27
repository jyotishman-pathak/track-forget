
import { supabase } from '@/src/shared/api/client';
import type { Track, TrackWithRelations,PhaseWithTasks   } from '@/src/shared/types';

export async function fetchTracks(): Promise<Track[]> {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Track[];
}

export async function fetchTrackBySlug(slug: string): Promise<TrackWithRelations | null> {
  const { data: track, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!track) return null;

  const [phasesRes, sessionsRes] = await Promise.all([
    supabase.from('phases').select('*').eq('track_id', track.id).order('number', { ascending: true }),
    supabase.from('sessions').select('*').eq('track_id', track.id).order('started_at', { ascending: false }),
  ]);

  if (phasesRes.error) throw phasesRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  const phases = phasesRes.data ?? [];
  const sessions = sessionsRes.data ?? [];

  const phasesWithTasks: PhaseWithTasks[] = await Promise.all(
    phases.map(async (phase) => {
      const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('phase_id', phase.id)
        .order('created_at', { ascending: true });
      if (tasksErr) throw tasksErr;
      return { ...phase, tasks: tasks ?? [] } as PhaseWithTasks;
    }),
  );

  return { ...track, phases: phasesWithTasks, sessions } as TrackWithRelations;
}

export async function createTrack(input: {
  name: string;
  slug: string;
  description?: string;
  accent_color: string;
  category?: string;
  template?: string;
}): Promise<Track> {
  const { data, error } = await supabase
    .from('tracks')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Track;
}
