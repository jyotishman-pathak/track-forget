export interface ParsedPhase {
  number: number;
  title: string;
  description?: string;
  notes?: string; // full rich content of the phase (code, gotchas, concepts)
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
 *   ## PHASE 1 — Title         -> phase (em-dash variant)
 *   ### Optional description   -> phase description
 *   - [ ] task                 -> incomplete task
 *   - [ ] task [easy]          -> task with difficulty
 *   - [ ] task [hard](url)     -> task with difficulty + resource url
 *
 * Additionally captures ALL non-task content within a phase as `notes`
 * (code blocks, gotchas, concepts, etc.) so it can be stored as rich markdown.
 */
export function parseTrackMarkdown(markdown: string): ParsedPhase[] {
  const lines = markdown.split('\n');
  const phases: ParsedPhase[] = [];
  let currentPhase: ParsedPhase | null = null;
  let notesLines: string[] = [];

  // Matches: ## PHASE 1: Title, ## PHASE 1 — Title, ## PHASE 1 - Title, ## 1: Title
  // Also: ## PHASE 1 (no separator), ## SETUP — ... (non-numeric, gets phase 0)
  const phaseRegex = /^#{1,3}\s*(?:PHASE\s+)?(\d+)\s*[:\-—–]?\s*(.*)$/i;
  const taskRegex = /^[-*]\s*\[[\s xX]\]\s+(.*)$/;
  const difficultyRegex = /\[(easy|medium|hard)\](?:\(([^)]+)\))?/i;

  function flushNotes() {
    if (currentPhase && notesLines.length > 0) {
      // Trim leading/trailing empty lines
      while (notesLines.length > 0 && !notesLines[0].trim()) notesLines.shift();
      while (notesLines.length > 0 && !notesLines[notesLines.length - 1].trim()) notesLines.pop();
      if (notesLines.length > 0) {
        currentPhase.notes = notesLines.join('\n');
      }
      notesLines = [];
    }
  }

  let inCodeBlock = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Track fenced code blocks so we don't match headers inside them
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentPhase) notesLines.push(rawLine);
      continue;
    }

    if (inCodeBlock) {
      if (currentPhase) notesLines.push(rawLine);
      continue;
    }

    // Phase header detection (only outside code blocks)
    const phaseMatch = line.match(phaseRegex);
    if (phaseMatch && !line.match(taskRegex) && line.startsWith('#')) {
      // Save notes of previous phase
      flushNotes();

      const number = parseInt(phaseMatch[1], 10);
      const rawTitle = phaseMatch[2].trim();

      // Strip emoji and cleanup title
      const title = rawTitle
        .replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\s—\-–]+/u, '')
        .trim() || rawTitle || `Phase ${number}`;

      currentPhase = { number, title, tasks: [] };
      phases.push(currentPhase);
      notesLines = [];
      continue;
    }

    if (!currentPhase) continue;

    const taskMatch = line.match(taskRegex);
    if (taskMatch) {
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

      currentPhase.tasks.push({
        description: rest,
        difficulty,
        resourceUrl,
      });

      // Don't add task lines to notes
      continue;
    }

    // Everything else (concepts, code, gotchas, descriptions) goes to notes
    // Skip pure horizontal rules at the phase boundary
    if (line === '---') {
      notesLines.push(rawLine);
      continue;
    }

    // Skip the phase title line itself (already parsed)
    notesLines.push(rawLine);
  }

  // Flush the last phase's notes
  flushNotes();

  return phases.filter((p) => p.tasks.length > 0 || p.title);
}
