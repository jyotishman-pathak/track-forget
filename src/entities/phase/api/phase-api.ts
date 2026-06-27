import { supabase } from '@/src/shared/api/client';
import type { Phase, PhaseWithTasks } from '@/src/shared/types';

export async function fetchPhasesByTrack(trackId: string): Promise<Phase[]> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('track_id', trackId)
    .order('number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Phase[];
}

export async function fetchPhaseWithTasks(phaseId: string): Promise<PhaseWithTasks | null> {
  const { data: phase, error } = await supabase
    .from('phases')
    .select('*')
    .eq('id', phaseId)
    .maybeSingle();
  if (error) throw error;
  if (!phase) return null;

  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('phase_id', phaseId)
    .order('created_at', { ascending: true });
  if (tasksErr) throw tasksErr;

  return { ...phase, tasks: tasks ?? [] } as PhaseWithTasks;
}

export async function createPhase(input: {
  track_id: string;
  number: number;
  title: string;
  description?: string;
}): Promise<Phase> {
  const { data, error } = await supabase
    .from('phases')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Phase;
}

export async function updatePhaseStatus(phaseId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('phases')
    .update({ status, completed_at: status === 'COMPLETED' ? new Date().toISOString() : null })
    .eq('id', phaseId);
  if (error) throw error;
}
