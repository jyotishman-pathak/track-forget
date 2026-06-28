'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

const NAV = [
  { id: 'data-model', label: 'Data Model' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'track-view', label: 'Track View' },
  { id: 'phases', label: 'Phases' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'session-timer', label: 'Session Timer' },
  { id: 'pomodoro', label: 'Pomodoro Mode' },
  { id: 'command-palette', label: 'Command Palette' },
  { id: 'heatmap', label: 'Activity Heatmap' },
  { id: 'streak', label: 'Streak System' },
  { id: 'focus-mode', label: 'Focus Mode' },
  { id: 'import', label: 'Markdown Import' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'config', label: 'Configuration' },
  { id: 'roadmap', label: 'Roadmap' },
];

export function DocsPage() {
  const [active, setActive] = useState('data-model');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto border-r border-white/[0.06] bg-card/30 py-8 scrollbar-thin">
        <div className="px-5 mb-6">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-4">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-zinc-100">TrackForge Docs</span>
          </div>
          <p className="mt-1 text-[10px] text-zinc-600 font-mono uppercase tracking-wider">v0.1</p>
        </div>

        <nav className="px-3 space-y-0.5">
          {NAV.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setActive(id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors',
                active === id
                  ? 'bg-amber-400/10 text-amber-300'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
              )}
            >
              {active === id && <ChevronRight className="h-3 w-3 shrink-0" />}
              {active !== id && <span className="w-3" />}
              {label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-10 py-16">
          {/* Hero */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b80]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Documentation</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">TrackForge</h1>
            <p className="mt-3 text-lg text-zinc-400 leading-relaxed">
              A personal learning roadmap tracker. Define structured tracks with phases and tasks, log timed study sessions, and monitor your progress over time.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Next.js 16', 'Supabase', 'Zustand', 'Tailwind v4', 'Framer Motion'].map((t) => (
                <span key={t} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">{t}</span>
              ))}
            </div>
          </div>

          {/* Sections */}
          <Section id="data-model" title="1. Core Data Model">
            <P>TrackForge is built around four primary entities stored in Supabase.</P>

            <H3>Track</H3>
            <P>The top-level learning goal — e.g. <Code>Master DSA</Code>, <Code>Learn Redis</Code>.</P>
            <Table
              headers={['Field', 'Type', 'Description']}
              rows={[
                ['id', 'UUID', 'Primary key'],
                ['name', 'string', 'Display name'],
                ['slug', 'string', 'URL-safe identifier (e.g. node, dsa)'],
                ['accent_color', 'string', 'Hex color for UI accenting'],
                ['template', 'GAUNTLET | PROJECT | READING', 'Track type'],
                ['status', 'ACTIVE | PAUSED | COMPLETED', 'Overall progress state'],
                ['deadline', 'ISO date?', 'Optional target completion date'],
                ['total_tasks / completed_tasks', 'number', 'Aggregate task counts'],
              ]}
            />

            <H3>Phase</H3>
            <P>A chapter or module within a track. Progress: <Code>NOT_STARTED → IN_PROGRESS → COMPLETED</Code>.</P>
            <Table
              headers={['Field', 'Type', 'Description']}
              rows={[
                ['number', 'integer', 'Phase order (1, 2, 3…)'],
                ['title', 'string', 'Phase name'],
                ['status', 'PhaseStatus', 'Computed from task completion'],
                ['total_tasks / completed_tasks', 'number', 'Task counts'],
                ['completed_at', 'ISO date?', 'When the phase reached 100%'],
              ]}
            />

            <H3>Task</H3>
            <P>An atomic unit of work within a phase.</P>
            <Table
              headers={['Field', 'Type', 'Description']}
              rows={[
                ['description', 'string', 'What to do'],
                ['completed', 'boolean', 'Done or not'],
                ['resource_url', 'string?', 'Link to article, video, or doc'],
                ['difficulty', 'easy | medium | hard', 'Optional difficulty tag'],
                ['cold_redo', 'boolean?', 'Needs re-attempting from cold memory'],
                ['time_spent_sec', 'number', 'Logged seconds'],
              ]}
            />

            <H3>Session</H3>
            <P>A timed study block logged against a track.</P>
            <Table
              headers={['Field', 'Type', 'Description']}
              rows={[
                ['track_id', 'UUID', 'Which track was studied'],
                ['started_at', 'ISO datetime', 'Session start'],
                ['ended_at', 'ISO datetime?', 'Session end'],
                ['duration_sec', 'number', 'Total elapsed seconds'],
                ['notes', 'string?', 'Optional session notes'],
              ]}
            />
          </Section>

          <Section id="dashboard" title="2. Dashboard">
            <P>Route: <Code>/</Code> — The Command Center: overview of all tracks and global stats.</P>

            <H3>Global Stats Bar</H3>
            <Table
              headers={['Stat', 'Description']}
              rows={[
                ['Active Tracks', 'Total number of imported tracks'],
                ['Tasks Done', '{completed}/{total} across all tracks'],
                ['Total Time', 'All session time formatted (e.g. 12h 40m)'],
                ['Day Streak 🔥', 'Consecutive days with at least one session. Glows amber at ≥3 days'],
              ]}
            />

            <H3>Activity Heatmap</H3>
            <P>A collapsible GitHub-style contribution grid showing 18 weeks of session activity. Cell intensity scales with minutes studied. Hover for date + time tooltip. Today's cell is outlined with the accent color.</P>

            <H3>Track Grid</H3>
            <P>All tracks as cards in a responsive 1→2→3 column grid. Each card shows: accent dot, name, template badge, circular progress ring, time today, session count, and status badge. Clicking navigates to <Code>/track/[slug]</Code>.</P>

            <H3>Command Palette</H3>
            <P>A <Code>⌘K</Code> search bar in the header. See <a href="#command-palette" className="text-amber-400 hover:underline">Command Palette</a> section.</P>
          </Section>

          <Section id="track-view" title="3. Track View">
            <P>Route: <Code>/track/[slug]</Code> — A two-panel layout: phase sidebar (left) + task list (right).</P>

            <H3>Top Bar</H3>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-400 list-none pl-0">
              {[
                'Back link → Dashboard',
                'Track identity — accent dot, name, template badge',
                'Session Timer / Pomodoro (right side)',
                'Focus Mode toggle — maximize/minimize icon',
                'Options menu — ⋯ placeholder',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <H3>State Management</H3>
            <P>All track state is in a single Zustand store (<Code>useTrackStore</Code>): track, phases, sessions, selectedPhaseId, activeSessionId, and updater functions. On mount, <Code>fetchTrackBySlug(slug)</Code> populates the store and auto-selects the first non-completed phase.</P>
          </Section>

          <Section id="phases" title="4. Phases">
            <P>The phase sidebar (<Code>w-72</Code>) renders all phases with status, progress, and collapse toggle.</P>

            <H3>Phase Row</H3>
            <Table
              headers={['Element', 'Description']}
              rows={[
                ['Selection bar', '2px accent vertical bar — visible when selected'],
                ['Status icon', '✓ emerald (COMPLETED) | ⟳ amber (IN_PROGRESS) | ○ zinc (NOT_STARTED)'],
                ['Phase number', 'P1, P2… in monospace'],
                ['Task counter', '{completed}/{total} right-aligned'],
              ]}
            />

            <H3>Phase Progress Bar</H3>
            <P>When selected and expanded, an animated bar slides in below the row. It fills proportional to <Code>completed_tasks / total_tasks</Code> using the accent color.</P>

            <H3>Auto-selection</H3>
            <P>On track load, the first non-COMPLETED phase is auto-selected. If all phases are complete, the first phase is selected.</P>
          </Section>

          <Section id="tasks" title="5. Tasks">
            <P>The task list occupies the main content area with a phase header, task rows, and an add-task input.</P>

            <H3>Task Row</H3>
            <Table
              headers={['Element', 'Description']}
              rows={[
                ['Checkbox', 'Custom animated checkbox with accent fill on completion'],
                ['Description', 'Strikethrough + dimmed when completed'],
                ['Difficulty badge', 'easy=emerald, medium=amber, hard=rose — colored pill'],
                ['Cold Redo flag', '🔥 flame icon — task needs cold re-attempt'],
                ['Time spent', 'Clock icon + minutes if time_spent_sec > 0'],
                ['Resource link', 'External link icon if resource_url is set'],
              ]}
            />

            <H3>Optimistic Updates</H3>
            <P>Toggling a task updates the UI immediately and reverts on failure. Phase progress counters and status are recomputed in-state instantly without a full reload.</P>

            <H3>Adding Tasks</H3>
            <P>Bottom input bar — press Enter or click Add. Disabled while in-flight. Triggers a full track reload on success.</P>
          </Section>

          <Section id="session-timer" title="6. Session Timer">
            <P>Located in the track view top bar. Logs timed study blocks against the current track.</P>
            <Table
              headers={['Action', 'Description']}
              rows={[
                ['Start Session', 'Calls startSession(trackId), records session ID in store'],
                ['Timer', 'Counts up. Format: Xs / Xm / Xh Xm'],
                ['Blinking dot', 'Accent-colored pulse while session is active'],
                ['Stop', 'Calls endSession(activeSessionId), resets timer'],
              ]}
            />
          </Section>

          <Section id="pomodoro" title="7. Pomodoro Mode">
            <P>An upgrade to the Session Timer, selectable via a mode switcher dropdown (disabled while running).</P>

            <H3>Cycle</H3>
            <ol className="mt-3 space-y-2 text-sm text-zinc-400 list-decimal list-inside">
              <li>Click <strong className="text-zinc-300">Focus</strong> — 25-minute countdown begins</li>
              <li>At 25:00 — auto-switches to <strong className="text-emerald-400">Break</strong> (5 min, green theme)</li>
              <li>At 5:00 — returns to <strong className="text-zinc-300">Work</strong> phase</li>
              <li>Each completed block adds a 🟡 dot badge (capped at 4 + overflow count)</li>
            </ol>

            <H3>Visual Feedback</H3>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-400 list-none pl-0">
              {[
                'SVG border ring drains as the block elapses (strokeDashoffset animation)',
                'Break phase: emerald green, coffee icon, "break" label',
                'Work phase: uses the track accent color',
                'Audio: plays /sounds/bell.mp3 on phase switch (add file to public/ to enable)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="command-palette" title="8. Command Palette">
            <P>Global search accessible from anywhere. Shortcut: <Kbd>⌘K</Kbd> / <Kbd>Ctrl+K</Kbd>. Press <Kbd>Esc</Kbd> to close.</P>

            <H3>Commands</H3>
            <Table
              headers={['Category', 'Commands']}
              rows={[
                ['Tracks', 'One entry per imported track — navigates to /track/[slug]'],
                ['Navigation', 'Go to Dashboard → /'],
              ]}
            />

            <H3>Keyboard Navigation</H3>
            <Table
              headers={['Key', 'Action']}
              rows={[
                ['↑ / ↓', 'Move selection'],
                ['Enter', 'Execute selected command'],
                ['Esc', 'Close palette'],
                ['Mouse hover', 'Update selection'],
              ]}
            />
          </Section>

          <Section id="heatmap" title="9. Activity Heatmap">
            <P>GitHub-style contribution grid of all study sessions on the dashboard (collapsible panel).</P>
            <Table
              headers={['Feature', 'Description']}
              rows={[
                ['18 weeks', 'Configurable via weeks prop. Columns = weeks, rows = days'],
                ['Cell color', 'opacity = 0.15 + (minutes/max) * 0.85 in accent color'],
                ['Empty cells', 'Faint gray — rgba(255,255,255,0.04)'],
                ['Today ring', '1px accent-colored outline around today\'s cell'],
                ['Tooltip', 'Native title: {Date}: {X}m on hover'],
                ['Labels', 'Month labels above grid, M/W/F day labels on left'],
                ['Animation', 'Staggered scale+fade per cell via Framer Motion'],
              ]}
            />
          </Section>

          <Section id="streak" title="10. Streak System">
            <P>Consecutive-day study streak calculated from all sessions across all tracks.</P>
            <H3>Algorithm</H3>
            <ol className="mt-3 space-y-2 text-sm text-zinc-400 list-decimal list-inside">
              <li>Collect all unique calendar dates from session <Code>started_at</Code> timestamps</li>
              <li>Starting from today, walk backwards day-by-day</li>
              <li>Count consecutive days with at least one session</li>
              <li>Stop at the first gap</li>
            </ol>
            <H3>Display</H3>
            <P>Shown in the Day Streak stat card. Streak ≥ 3 days: amber border + <Code>text-amber-300</Code> value. Value format: <Code>{'{n}d 🔥'}</Code>.</P>
          </Section>

          <Section id="focus-mode" title="11. Focus Mode">
            <P>Distraction-free mode for the track view. Toggle via the <strong className="text-zinc-300">⤢</strong> button in the top bar.</P>
            <Table
              headers={['Element', 'Normal', 'Focus Mode']}
              rows={[
                ['Phase sidebar', 'Visible (272px)', 'Hidden'],
                ['Task list', 'Fills remaining space', 'Centered, max-width 720px'],
                ['Background', 'Normal', 'Dark overlay bg-black/40'],
                ['Toggle button', 'Shows ⤢ (expand)', 'Shows ⤡ (compress)'],
              ]}
            />
          </Section>

          <Section id="import" title="12. Markdown Import">
            <P>Define an entire track in plain Markdown and import it via the <strong className="text-zinc-300">Import Track</strong> button on the dashboard.</P>

            <H3>Format</H3>
            <CodeBlock>{`## PHASE 1: Foundations
An optional description for this phase.

- [ ] Understand Big O notation [easy]
- [ ] Learn arrays and linked lists [medium](https://example.com)
- [ ] Practice 20 easy LeetCode problems [hard]

## PHASE 2: Core Data Structures

- [ ] Trees and graphs [medium]
- [ ] Hash maps [easy](https://cs.stanford.edu/hashmaps)`}</CodeBlock>

            <H3>Parsing Rules</H3>
            <Table
              headers={['Syntax', 'Parsed As']}
              rows={[
                ['## PHASE N: Title', 'New phase with number and title'],
                ['Line after header (not a task)', 'Phase description'],
                ['- [ ] description', 'Incomplete task'],
                ['- [x] description', 'Completed task'],
                ['[easy], [medium], [hard]', 'Difficulty tag'],
                ['[easy](https://...)', 'Difficulty + resource URL'],
              ]}
            />
          </Section>

          <Section id="architecture" title="13. Architecture">
            <P>TrackForge follows <strong className="text-zinc-300">Feature-Sliced Design (FSD)</strong>.</P>
            <CodeBlock>{`src/
├── entities/        # Pure data access (API calls, types)
│   ├── track/       # fetchTrackBySlug, fetchTracks
│   ├── phase/       # updatePhaseStatus
│   ├── task/        # toggleTask, createTask
│   └── session/     # startSession, endSession
│
├── features/        # User interactions (use-cases)
│   ├── toggle-task/ # TaskRow, TaskCheckbox, useTrackStore
│   ├── start-session/ # SessionTimer + Pomodoro
│   └── import-track/  # ImportTrackDrawer, parseMarkdown
│
├── widgets/         # Assembled UI blocks
│   ├── dashboard/   # DashboardWidget, TrackCard, ProgressRing
│   └── track-view/  # TrackViewWidget, PhaseList, TaskList
│
├── screens/         # Page-level wrappers (thin)
│   ├── dashboard/
│   └── track/
│
└── shared/          # Utilities, types, tokens
    ├── types/       # All TypeScript interfaces
    ├── config/      # Constants & enums
    ├── lib/         # formatDuration, calculateStreak, cn
    └── widgets/     # CommandPalette, ActivityHeatmap`}</CodeBlock>
            <H3>Key Technologies</H3>
            <Table
              headers={['Layer', 'Technology']}
              rows={[
                ['Framework', 'Next.js 16 (App Router, Turbopack)'],
                ['Database', 'Supabase (PostgreSQL)'],
                ['State', 'Zustand (single store per track view)'],
                ['Styling', 'Tailwind CSS v4 + CSS custom properties'],
                ['Animation', 'Framer Motion'],
                ['Icons', 'Lucide React'],
              ]}
            />
          </Section>

          <Section id="config" title="14. Configuration">
            <H3>Track Accent Colors</H3>
            <Table
              headers={['Slug', 'Color', 'Hex']}
              rows={[
                ['dsa', 'Amber', '#f59e0b'],
                ['node', 'Emerald', '#10b981'],
                ['redis', 'Rose', '#f43f5e'],
                ['webrtc', 'Violet', '#8b5cf6'],
                ['ml', 'Cyan', '#06b6d4'],
              ]}
            />
            <H3>Environment Variables</H3>
            <Table
              headers={['Variable', 'Description']}
              rows={[
                ['NEXT_PUBLIC_SUPABASE_URL', 'Your Supabase project URL'],
                ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anonymous (public) key'],
              ]}
            />
          </Section>

          <Section id="roadmap" title="15. Roadmap">
            <H3>Phase 2 — Engagement</H3>
            <RoadmapList items={[
              'XP & Leveling — earn XP per completed task/phase, unlock badges',
              'Badge System — "First Task", "7-Day Streak", "100 Hours Logged"',
              'Weekly Report Card — auto-generated Monday summary',
              'Daily Goal — target tasks/hours with a filling progress ring',
              'Task Notes — inline markdown notes per task',
              'Drag to Reorder — drag tasks and phases within a track',
            ]} />

            <H3>Phase 3 — Power Features</H3>
            <RoadmapList items={[
              'AI Track Generator — describe a goal, receive a full phased roadmap',
              'Track Templates Marketplace — browse and import community tracks',
              'Sub-tasks — nested tasks for granular breakdowns',
              'Task Dependencies — Task B locked until Task A is done',
              'Spaced Repetition — auto-schedule review tasks using SM-2',
              'Kanban View — toggle between list and board view per phase',
              'Session Notes — attach markdown notes to each session log',
            ]} />

            <H3>Phase 4 — Social</H3>
            <RoadmapList items={[
              'Public Track Share — one-click publish with a shareable URL',
              'Study Buddy — pair with a friend, see their progress',
              'Accountability Partner — missed-day notifications between pairs',
              'Leaderboard — compare total hours and streaks',
            ]} />

            <H3>Phase 5 — Integrations</H3>
            <RoadmapList items={[
              'GitHub Activity Overlay — show commits alongside session heatmap',
              'Google Calendar Sync — block study time on your calendar',
              'Obsidian Export — export track structure + notes as a vault',
              'Discord Bot — /log session, streak nudges in a server',
            ]} />
          </Section>

          <div className="mt-16 border-t border-white/[0.06] pt-8 text-center font-mono text-xs text-zinc-700">
            TrackForge Docs · v0.1 · June 2026
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Shared components ── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20 scroll-mt-8">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-100 border-b border-white/[0.06] pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 mb-3 text-base font-semibold text-zinc-200">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-400 leading-relaxed">{children}</p>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-amber-300">
      {children}
    </code>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/[0.12] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">
      {children}
    </kbd>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/40 p-5 font-mono text-xs text-zinc-300 leading-relaxed scrollbar-thin">
      {children}
    </pre>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn('border-b border-white/[0.04] last:border-0', i % 2 === 1 && 'bg-white/[0.01]')}>
              {row.map((cell, j) => (
                <td key={j} className={cn('px-4 py-2.5 text-xs leading-relaxed', j === 0 ? 'font-mono text-amber-300/80' : 'text-zinc-400')}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoadmapList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-700 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
