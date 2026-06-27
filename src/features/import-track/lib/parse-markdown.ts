export interface ParsedPhase {
  number: number;
  title: string;
  description?: string;
  tasks: ParsedTask[];
}

export interface ParsedTask {
  description: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  resourceUrl?: string;
}

/**
 * Parses a markdown string into phases + tasks.
 * Supports:
 *   ## PHASE 1: Title          -> phase
 *   ### Optional description   -> phase description
 *   - [ ] task                 -> incomplete task
 *   - [ ] task [easy]          -> task with difficulty
 *   - [ ] task [hard](url)     -> task with difficulty + resource url
 */
export function parseTrackMarkdown(markdown: string): ParsedPhase[] {
  const lines = markdown.split('\n');
  const phases: ParsedPhase[] = [];
  let currentPhase: ParsedPhase | null = null;

  const phaseRegex = /^#{1,3}\s*(?:PHASE\s+)?(\d+)[:.]?\s*(.*)$/i;
  const taskRegex = /^[-*]\s*\[[\s xX]\]\s+(.*)$/;
  const difficultyRegex = /\[(easy|medium|hard)\](?:\(([^)]+)\))?/i;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const phaseMatch = line.match(phaseRegex);
    if (phaseMatch && !line.match(taskRegex)) {
      const number = parseInt(phaseMatch[1], 10);
      const title = phaseMatch[2].trim() || `Phase ${number}`;
      currentPhase = { number, title, tasks: [] };
      phases.push(currentPhase);
      continue;
    }

    // Description: a line right after phase that's not a task
    if (currentPhase && currentPhase.tasks.length === 0 && !line.match(taskRegex) && !line.startsWith('#')) {
      if (!currentPhase.description) {
        currentPhase.description = line;
      }
      continue;
    }

    const taskMatch = line.match(taskRegex);
    if (taskMatch && currentPhase) {
      let rest = taskMatch[1].trim();

      const diffMatch = rest.match(difficultyRegex);
      const difficulty = diffMatch
        ? (diffMatch[1].toLowerCase() as 'easy' | 'medium' | 'hard')
        : undefined;
      const resourceUrl = diffMatch?.[2] || undefined;

      // Remove the difficulty/link markers from description
      if (diffMatch) {
        rest = rest.replace(diffMatch[0], '').trim();
      }

      // Extract standalone markdown link as resource URL
      const linkMatch = rest.match(linkRegex);
      if (linkMatch && !resourceUrl) {
        // Keep the link text, use URL as resource
      }

      currentPhase.tasks.push({
        description: rest,
        difficulty,
        resourceUrl,
      });
    }
  }

  return phases.filter((p) => p.tasks.length > 0 || p.title);
}
