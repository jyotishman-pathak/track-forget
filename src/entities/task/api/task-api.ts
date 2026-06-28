import { supabase } from '@/src/shared/api/client';
import type { Task } from '@/src/shared/types';

export async function toggleTask(taskId: string, completed: boolean): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function createTask(input: {
  phase_id: string;
  description: string;
  notes?: string | null;
  difficulty?: string | null;
  resource_url?: string | null;
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      phase_id: input.phase_id,
      description: input.description,
      notes: input.notes ?? null,
      difficulty: input.difficulty ?? null,
      resource_url: input.resource_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTaskNotes(taskId: string, notes: string | null): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ notes })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function updateTaskTime(taskId: string, additionalSec: number): Promise<void> {
  const { error } = await supabase.rpc('increment_task_time', {
    task_id: taskId,
    additional_seconds: additionalSec,
  });
  if (error) throw error;
}
