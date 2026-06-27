export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatTimeToday(sessions: { started_at: string; duration_sec: number }[]): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalSec = sessions
    .filter((s) => new Date(s.started_at) >= today)
    .reduce((sum, s) => sum + s.duration_sec, 0);
  return formatDuration(totalSec);
}

export function calculateStreak(sessions: { started_at: string }[]): number {
  if (sessions.length === 0) return 0;
  const days = new Set<string>();
  for (const s of sessions) {
    const d = new Date(s.started_at);
    d.setHours(0, 0, 0, 0);
    days.add(d.toISOString().split('T')[0]);
  }
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.toISOString().split('T')[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function progressPercent(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
