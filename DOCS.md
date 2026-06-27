# TrackForge — Complete Feature Documentation

> **TrackForge** is a personal learning roadmap tracker. You define structured learning tracks with phases and tasks, log study sessions, and monitor your progress over time. Built with Next.js 16, Supabase, Zustand, Tailwind CSS v4, and Framer Motion.

---

## Table of Contents

1. [Core Data Model](#1-core-data-model)
2. [Dashboard](#2-dashboard)
3. [Track View](#3-track-view)
4. [Phases](#4-phases)
5. [Tasks](#5-tasks)
6. [Session Timer](#6-session-timer)
7. [Pomodoro Mode](#7-pomodoro-mode)
8. [Command Palette](#8-command-palette)
9. [Activity Heatmap](#9-activity-heatmap)
10. [Streak System](#10-streak-system)
11. [Focus Mode](#11-focus-mode)
12. [Markdown Import](#12-markdown-import)
13. [Architecture Overview](#13-architecture-overview)
14. [Configuration Reference](#14-configuration-reference)
15. [Roadmap — Planned Features](#15-roadmap--planned-features)

---

## 1. Core Data Model

TrackForge is built around four primary entities stored in Supabase:

### Track

A **Track** is the top-level learning goal. Examples: *"Master DSA"*, *"Learn Redis"*, *"Read DDIA"*.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | Display name of the track |
| `slug` | string | URL-safe identifier (e.g. `node`, `dsa`) |
| `description` | string? | Optional summary |
| `accent_color` | string | Hex color used for UI accenting |
| `category` | string | General category label |
| `template` | `GAUNTLET \| PROJECT \| READING` | Track template type |
| `status` | `ACTIVE \| PAUSED \| COMPLETED` | Overall track status |
| `deadline` | ISO date? | Optional target completion date |
| `total_tasks` | number | Aggregate count of all tasks |
| `completed_tasks` | number | Aggregate count of completed tasks |
| `metadata` | JSON | Arbitrary extra data |

**Templates:**
- `GAUNTLET` — Rigorous, sequential curriculum-style track
- `PROJECT` — Goal-driven project with milestone phases
- `READING` — Book or paper reading schedule

### Phase

A **Phase** is a chapter or module within a track. Phases are ordered by `number` and progress through `NOT_STARTED → IN_PROGRESS → COMPLETED`.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `track_id` | UUID | Parent track |
| `number` | integer | Phase order (1, 2, 3…) |
| `title` | string | Phase name |
| `description` | string? | Optional context |
| `status` | `NOT_STARTED \| IN_PROGRESS \| COMPLETED` | Computed from task completion |
| `total_tasks` | number | Tasks in this phase |
| `completed_tasks` | number | Completed tasks in this phase |
| `completed_at` | ISO date? | When the phase reached 100% |

### Task

A **Task** is an atomic unit of work within a phase.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `phase_id` | UUID | Parent phase |
| `description` | string | What to do |
| `completed` | boolean | Done or not |
| `resource_url` | string? | Linked resource (article, video, doc) |
| `difficulty` | `easy \| medium \| hard` | Optional difficulty tag |
| `cold_redo` | boolean? | Flag: needs revisiting cold |
| `time_spent_sec` | number | Logged seconds (manual or session) |
| `completed_at` | ISO date? | Completion timestamp |

### Session

A **Session** is a timed study block logged against a track.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `track_id` | UUID | Which track was studied |
| `started_at` | ISO datetime | When the session began |
| `ended_at` | ISO datetime? | When the session ended |
| `duration_sec` | number | Total elapsed seconds |
| `notes` | string? | Optional session notes |

---

## 2. Dashboard

**Route:** `/`

The dashboard is the **Command Center** — an overview of all your active tracks and global stats.

### Global Stats Bar

Four stat cards displayed at a glance:

| Stat | Description |
|---|---|
| **Active Tracks** | Total number of tracks imported |
| **Tasks Done** | `{completed}/{total}` across all tracks |
| **Total Time** | All session time formatted (e.g. `12h 40m`) |
| **Day Streak** 🔥 | Consecutive days with at least one session |

The **Day Streak** card glows amber when the streak is 3 or more days, applying a highlight border and amber-colored text.

### Activity Heatmap

A GitHub-style contribution grid showing **18 weeks** of session activity. It sits below the stats bar in a collapsible panel labeled **Activity**.

- Click the panel header to expand/collapse with a smooth animation
- Cell color intensity scales from faint (few minutes) to full accent color (max activity)
- Hover over any cell to see the date + minutes studied
- Today's cell is outlined with the accent color ring
- Month labels float above the grid
- A legend (Less → More) sits at the bottom right

### Track Grid

All tracks are displayed as cards in a responsive `1 → 2 → 3` column grid.

Each **TrackCard** shows:
- Accent color indicator dot
- Track name and template badge
- Circular progress ring (tasks completed %)
- Time studied today
- Session count
- Status badge (`ACTIVE`, `PAUSED`, `COMPLETED`)
- Clicking navigates to `/track/[slug]`

### Import Track Button

Opens the **Import Track Drawer** — see [Markdown Import](#12-markdown-import).

### Command Palette

A `⌘K` shortcut search bar is present in the dashboard header — see [Command Palette](#8-command-palette).

### Empty State

When no tracks exist, a dashed placeholder with an **Import Track** call-to-action is shown.

---

## 3. Track View

**Route:** `/track/[slug]`

The track view is a two-panel layout: a **phase sidebar** on the left and a **task list** on the right.

### Top Bar

- **Back link** → Dashboard (arrow left icon)
- **Track identity** — accent dot, track name, template badge
- **Session Timer** (or Pomodoro) — right side
- **Focus Mode toggle** — maximize/minimize icon
- **Options menu** — `⋯` button (currently a placeholder for future actions)

### URL and Routing

Dynamic route: `/track/[slug]`. The `slug` is awaited from Next.js 16's Promise-based `params` API before being passed to the widget.

### State Management

All track state is managed in a single **Zustand store** (`useTrackStore`):
- `track` — the current Track object
- `phases` — array of phases with nested tasks
- `sessions` — sessions for this track
- `selectedPhaseId` — which phase is active in the sidebar
- `activeSessionId` — the in-progress session ID
- Updater functions: `updateTaskInState`, `updatePhaseInState`, `updateTrackInState`, `addSession`

On mount, `fetchTrackBySlug(slug)` populates the store and auto-selects the first non-completed phase.

---

## 4. Phases

The **Phase Sidebar** (`w-72`, left panel) renders all phases for the track.

### Phase List Items

Each phase row shows:
- **Selection indicator** — a 2px accent-colored vertical bar, visible when selected
- **Collapse chevron** — rotates 90° when expanded
- **Status icon**:
  - `✓` (emerald) — `COMPLETED`
  - `⟳` (amber) — `IN_PROGRESS`
  - `○` (zinc) — `NOT_STARTED`
- **Phase number** (`P1`, `P2`…) in monospace
- **Phase title** — truncated for long names
- **Task counter** — `{completed}/{total}` right-aligned

### Phase Progress Bar

When a phase is **selected and expanded**, an animated progress bar slides in below the row. It fills from left to right with the accent color, proportional to `completed_tasks / total_tasks`.

### Auto-selection

On track load, the first phase that is not `COMPLETED` is auto-selected. If all phases are complete, the first phase is selected.

---

## 5. Tasks

The **Task List** occupies the main content area (right panel).

### Phase Header

At the top of the task list:
- `PHASE {n}` label in accent color
- Phase title (large heading)
- Optional phase description
- **Progress bar** — animated fill showing `{completed}/{total}` with a checkmark icon when 100%

### Task Rows

Each task is displayed as an interactive row with:

- **Checkbox** — custom animated checkbox with accent color fill on completion
- **Description** — strikethrough + dimmed on completion
- **Difficulty badge** — color-coded pill:
  - `easy` → emerald
  - `medium` → amber
  - `hard` → rose
- **Cold Redo flag** — 🔥 flame icon + "Cold Redo" label in amber, indicating the task needs to be re-attempted from cold memory
- **Time spent** — clock icon + minutes (if `time_spent_sec > 0`)
- **Resource link** — external link icon if `resource_url` is set

### Optimistic Updates

Toggling a task is **optimistic** — the UI updates immediately and reverts if the server call fails. After toggling, phase progress counters (`completed_tasks`, `total_tasks`, `status`) are recomputed in-state without waiting for a full reload. Phase status is also persisted via `updatePhaseStatus()`.

### Adding Tasks

A bottom input bar lets you add tasks to the current phase:
- Press **Enter** or click **Add** to submit
- The input is disabled while the request is in flight
- On success, the full track data is reloaded (`onTaskAdded()` callback)

---

## 6. Session Timer

Located in the **top bar** of the track view.

### Basic Mode (Free Session)

- **Start Session** → calls `startSession(trackId)`, records session ID in the store
- Timer counts up in `HH:MM:SS` (or `Xm`, `Xh Xm` for shorter formats)
- A blinking accent dot indicates an active session
- **Stop** → calls `endSession(activeSessionId)`, stores the final session, resets timer

The elapsed display uses the shared `formatDuration(seconds)` utility:
- `< 60s` → `{n}s`
- `< 1hr` → `{n}m`
- `≥ 1hr` → `{h}h {m}m`

### Timer State

The active session ID is stored in the Zustand store (`activeSessionId`), so it persists across re-renders within the same page visit.

---

## 7. Pomodoro Mode

An upgrade to the Session Timer, selectable via a **mode switcher dropdown**.

### Switching Modes

A small pill button next to the timer shows the current mode:
- ⏱ **Session** (default) — free-running stopwatch
- ☕ **Pomodoro** — 25-minute focus blocks with 5-minute breaks

The dropdown is disabled while a session is running, preventing mode changes mid-session.

### Pomodoro Cycle

1. **Start Focus** → 25-minute countdown begins
2. At 25:00 → automatically switches to **Break** phase (5 minutes, green theme)
3. At 5:00 → automatically returns to **Work** phase
4. Each completed focus block adds a 🟡 dot badge to the timer display (capped at 4 dots + overflow count)

### Visual Feedback

- Timer border has a subtle **animated ring** that drains as the current block elapses (using `strokeDashoffset` on an SVG rect overlay)
- Break phase: timer turns **emerald green**, shows a coffee icon and "break" label
- Work phase: uses the track's accent color

### Audio Notification

On phase switch, a browser `Audio('/sounds/bell.mp3')` play is attempted silently (errors are caught). You can add a bell sound file at `public/sounds/bell.mp3` to enable audio alerts.

---

## 8. Command Palette

**Shortcut:** `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)

A global command palette accessible from anywhere in the app.

### Opening

- Keyboard shortcut `⌘K` / `Ctrl+K` toggles open/close
- A visible search trigger button in the dashboard header shows the shortcut hint
- `Esc` closes the palette

### Search

- Type to instantly filter all commands by name or sublabel
- Fuzzy matching (case-insensitive substring)

### Available Commands

| Category | Commands |
|---|---|
| **Tracks** | One entry per imported track → navigates to `/track/[slug]` |
| **Navigation** | Go to Dashboard → `/` |

Commands are grouped by category with a monospace section label.

### Keyboard Navigation

| Key | Action |
|---|---|
| `↑` / `↓` | Move selection up / down |
| `Enter` | Execute selected command |
| `Esc` | Close palette |
| Mouse hover | Update selection to hovered item |

### Design

- Centered modal overlay with `bg-black/60 backdrop-blur-sm`
- Animated entrance: scale + fade + slight upward slide
- Selected item shows an → arrow indicator on the right
- Footer shows keyboard hint legend

---

## 9. Activity Heatmap

A GitHub contribution-style heatmap of all study sessions, shown on the dashboard.

### Layout

- **18 weeks** of data displayed (configurable via `weeks` prop)
- Grid is 7 rows (days of week) × 18 columns (weeks)
- Columns go left to right, oldest to newest
- Sundays start each column

### Cell Color

Each cell's opacity scales with the session minutes logged that day:
- 0 minutes → faint gray (`rgba(255,255,255,0.04)`)
- > 0 minutes → track accent color at `opacity = 0.15 + (minutes/max) * 0.85`

This means the darkest cells represent your most active days.

### Labels

- **Month labels** float above the grid at column boundaries
- **Day labels** (M, W, F) appear to the left of even rows
- **Today** is outlined with a 1px accent-colored ring

### Tooltips

Native `title` attribute provides `{Date}: {X}m` on hover.

### Animation

Cells animate in with a staggered scale + fade using Framer Motion, with a `0.002s` delay per cell (approximately 0.25s total).

### Legend

A "Less / More" gradient bar at the bottom right shows the color scale.

---

## 10. Streak System

A consecutive-day study streak, calculated from all sessions across all tracks.

### Calculation (`calculateStreak`)

Located in `src/shared/lib/format.ts`:

1. Collect all unique calendar dates from session `started_at` timestamps
2. Starting from today, walk backwards day-by-day
3. Count consecutive days that have at least one session
4. Stop at the first gap

A session on *any* track counts toward the streak.

### Display

The streak appears in the **Day Streak** stat card on the dashboard:
- Value: `{n}d 🔥`
- When streak ≥ 3 days: card border turns amber, value text turns `text-amber-300`
- When streak is 0: displays `0d`

---

## 11. Focus Mode

A distraction-free reading/study mode for the track view.

### Activation

Click the **Maximize** icon (⤢) in the top bar of any track view to enter focus mode.

### What Changes

| Element | Normal Mode | Focus Mode |
|---|---|---|
| Phase sidebar | Visible (272px) | Hidden |
| Task list | Fills remaining space | Centered, max-width 720px |
| Background | Normal | Subtle dark overlay (`bg-black/40`) via `motion.div` |
| Toggle button | Shows `⤢` (expand) | Shows `⤡` (compress) |

### Exit

Click the **Minimize** icon (⤡) to return to the normal two-panel layout. No page reload needed.

### Use Case

Ideal for deep focus on a single phase's task list without the visual noise of the sidebar.

---

## 12. Markdown Import

**Entry point:** "Import Track" button on the dashboard → **ImportTrackDrawer**

TrackForge lets you define an entire track in plain Markdown and import it in one step.

### Markdown Format

```markdown
## PHASE 1: Foundations
An optional description for this phase.

- [ ] Understand Big O notation [easy]
- [ ] Learn arrays and linked lists [medium](https://example.com/arrays)
- [ ] Practice 20 easy LeetCode problems [hard]

## PHASE 2: Core Data Structures

- [ ] Trees and graphs [medium]
- [ ] Hash maps [easy](https://cs.stanford.edu/hashmaps)
- [ ] Heaps and priority queues [hard]
```

### Parsing Rules (`parseTrackMarkdown`)

| Syntax | Parsed As |
|---|---|
| `## PHASE N: Title` or `## N: Title` | New phase with number and title |
| Line after phase header (not a task) | Phase description |
| `- [ ] description` | Incomplete task |
| `- [x] description` | Completed task |
| `[easy]`, `[medium]`, `[hard]` in task | Difficulty tag |
| `[easy](https://...)` | Difficulty + resource URL |

Phase and task parsing is case-insensitive for phase headers and difficulty tags.

### Import Flow

1. Paste or type Markdown into the drawer textarea
2. The Markdown is parsed client-side by `parseTrackMarkdown()`
3. A preview of phases and task counts is shown
4. On confirm, the track + all phases + all tasks are persisted to Supabase in one batch
5. The dashboard reloads with the new track card

---

## 13. Architecture Overview

TrackForge follows **Feature-Sliced Design (FSD)** — a scalable frontend architecture:

```
src/
├── entities/          # Pure data access (API calls, types)
│   ├── track/         # fetchTrackBySlug, fetchTracks
│   ├── phase/         # updatePhaseStatus
│   ├── task/          # toggleTask, createTask
│   └── session/       # startSession, endSession, fetchSessionsByTrack
│
├── features/          # User interactions (use-cases)
│   ├── toggle-task/   # TaskRow, TaskCheckbox, useTrackStore (Zustand)
│   ├── start-session/ # SessionTimer (with Pomodoro)
│   └── import-track/  # ImportTrackDrawer, parseTrackMarkdown
│
├── widgets/           # Assembled UI blocks (compose features + entities)
│   ├── dashboard/     # DashboardWidget, TrackCard, ProgressRing
│   └── track-view/    # TrackViewWidget, PhaseList, TaskList
│
├── screens/           # Page-level wrappers (thin, pass props to widgets)
│   ├── dashboard/     # DashboardPage
│   └── track/         # TrackPage
│
└── shared/            # Utilities, types, design tokens
    ├── types/          # Track, Phase, Task, Session, Note interfaces
    ├── config/         # TRACK_TEMPLATES, PHASE_STATUS, TASK_DIFFICULTY, TRACK_ACCENTS
    ├── lib/            # formatDuration, calculateStreak, progressPercent, cn
    └── widgets/        # Cross-cutting UI: CommandPalette, ActivityHeatmap
```

### App Router (`app/`)

```
app/
├── layout.tsx          # Root layout (fonts, global CSS)
├── page.tsx            # → DashboardPage
├── globals.css         # Tailwind v4 config + design tokens
└── track/
    └── [slug]/
        └── page.tsx    # → TrackPage (async, awaits params)
```

### State

**Zustand** (`useTrackStore`) manages all track-view state. No prop drilling — components subscribe to slices they need. The store is reset on each track load.

### Database

**Supabase** provides PostgreSQL + realtime (future) + auth (future). All queries use the `@supabase/supabase-js` client via server-side and client-side calls.

### Styling

**Tailwind CSS v4** with CSS custom properties for theming:
- Colors defined as `--background`, `--foreground`, etc. in `:root`
- Mapped to Tailwind's `--color-*` namespace via `@theme` block
- `tw-animate-css` for animation utilities
- Custom utilities: `.glass-panel`, `.scrollbar-thin`, `.text-balance`

---

## 14. Configuration Reference

### Track Accent Colors (`TRACK_ACCENTS`)

Pre-defined accent colors for known track slugs:

| Slug | Color | Hex |
|---|---|---|
| `dsa` | Amber | `#f59e0b` |
| `node` | Emerald | `#10b981` |
| `redis` | Rose | `#f43f5e` |
| `webrtc` | Violet | `#8b5cf6` |
| `ml` | Cyan | `#06b6d4` |

Custom slugs can use any hex value stored in the `accent_color` field.

### Track Templates

| Value | Description |
|---|---|
| `GAUNTLET` | Rigorous sequential curriculum |
| `PROJECT` | Project with milestone phases |
| `READING` | Book / paper reading |

### Status Values

**Track:** `ACTIVE` · `PAUSED` · `COMPLETED`  
**Phase:** `NOT_STARTED` · `IN_PROGRESS` · `COMPLETED`  
**Task Difficulty:** `easy` · `medium` · `hard`

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

---

## 15. Roadmap — Planned Features

### Phase 2 — Engagement

- [ ] **XP & Leveling** — earn XP per completed task/phase, unlock level badges
- [ ] **Badge System** — "First Task", "7-Day Streak", "100 Hours Logged", etc.
- [ ] **Weekly Report Card** — auto-generated Monday summary (tasks, hours, pace)
- [ ] **Daily Goal** — set a target tasks/hours per day, visualized as a filling ring
- [ ] **Task Notes / Annotations** — inline markdown notes per task
- [ ] **Drag to Reorder** — drag tasks and phases within a track

### Phase 3 — Power Features

- [ ] **AI Track Generator** — describe a goal, receive a full phased roadmap
- [ ] **Track Templates Marketplace** — browse and import community tracks
- [ ] **Sub-tasks** — nested tasks for granular breakdowns
- [ ] **Task Dependencies** — Task B locked until Task A is done
- [ ] **Spaced Repetition Layer** — auto-schedule review tasks using SM-2 after completion
- [ ] **Kanban View** — toggle between list and board view per phase
- [ ] **Timeline / Gantt View** — visual timeline with projected phase completion dates
- [ ] **Session Notes** — attach markdown notes to each session log

### Phase 4 — Social & Sharing

- [ ] **Public Track Share** — one-click publish a track with a shareable URL
- [ ] **Study Buddy** — pair with a friend, see their progress on the same track
- [ ] **Accountability Partner** — missed-day notifications between pairs
- [ ] **Leaderboard** — compare total hours and streaks

### Phase 5 — Integrations

- [ ] **GitHub Activity Overlay** — show commits alongside session heatmap
- [ ] **Google Calendar Sync** — block study time directly on your calendar
- [ ] **Obsidian Export** — export track structure + notes as Obsidian vault
- [ ] **Discord Bot** — `/log session`, streak nudges in a server

---

*Documentation last updated: June 2026. This doc covers the current implemented feature set as of the TrackForge v0.1 codebase.*
