import { supabase } from '@/src/shared/api/client';
import type { Session } from '@/src/shared/types';

export async function startSession(trackId: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      track_id: trackId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}

export async function endSession(sessionId: string): Promise<Session> {
  const now = new Date().toISOString();
  const { data: session, error: fetchErr } = await supabase
    .from('sessions')
    .select('started_at')
    .eq('id', sessionId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!session) throw new Error('Session not found');

  const durationSec = Math.floor(
    (new Date(now).getTime() - new Date(session.started_at).getTime()) / 1000,
  );

  const { data, error } = await supabase
    .from('sessions')
    .update({ ended_at: now, duration_sec: durationSec })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data as Session;
}

export async function fetchSessionsByTrack(trackId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('track_id', trackId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Session[];
}
