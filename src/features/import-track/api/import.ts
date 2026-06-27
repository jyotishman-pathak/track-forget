import { supabase } from '@/src/shared/api/client';
import { parseTrackMarkdown, type ParsedPhase } from '../lib/parse-markdown';
import type { Track } from '@/src/shared/types';

export async function importTrackFromMarkdown(input: {
  name: string;
  slug: string;
  accentColor: string;
  template?: string;
  markdown: string;
}): Promise<Track> {
  const phases = parseTrackMarkdown(input.markdown);
  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);

  // Create the track
  const { data: track, error: trackErr } = await supabase
    .from('tracks')
    .insert({
      name: input.name,
      slug: input.slug,
      accent_color: input.accentColor,
      template: input.template ?? 'GAUNTLET',
      total_tasks: totalTasks,
      completed_tasks: 0,
    })
    .select()
    .single();
  if (trackErr) throw trackErr;

  // Create phases + tasks
  for (const phase of phases) {
    const { data: phaseRow, error: phaseErr } = await supabase
      .from('phases')
      .insert({
        track_id: track.id,
        number: phase.number,
        title: phase.title,
        description: phase.description ?? null,
        total_tasks: phase.tasks.length,
        completed_tasks: 0,
      })
      .select()
      .single();
    if (phaseErr) throw phaseErr;

    if (phase.tasks.length > 0) {
      const taskRows = phase.tasks.map((t) => ({
        phase_id: phaseRow.id,
        description: t.description,
        difficulty: t.difficulty ?? null,
        resource_url: t.resourceUrl ?? null,
      }));
      const { error: tasksErr } = await supabase.from('tasks').insert(taskRows);
      if (tasksErr) throw tasksErr;
    }
  }

  return track as Track;
}
