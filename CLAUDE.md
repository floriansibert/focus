# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Focus is an Eisenhower Priority Matrix task management application built with React, TypeScript, and Vite. It helps users organize tasks across four quadrants (Urgent/Important, Not Urgent/Important, Urgent/Not Important, Not Urgent/Not Important) with support for time tracking, recurring tasks with template management, advanced view modes (Today/Completed), analytics, and offline-first functionality.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (creates single HTML file)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

**Build Output**: The app uses `vite-plugin-singlefile` to bundle everything into a single HTML file for easy deployment and offline use. App version, build time, and author are injected as constants via Vite's `define` config.

## Core Architecture

### State Management (Zustand)

The app uses Zustand for state management with four primary stores:

- **`taskStore`** (`src/store/taskStore.ts`): Manages tasks, tags, time tracking, subtask operations (reparenting, detachment), template pause/resume, and persistence to IndexedDB
- **`uiStore`** (`src/store/uiStore.ts`): Handles UI state (theme, active view including templates, filters, view modes, command palette, export reminders)
- **`historyStore`** (`src/store/historyStore.ts`): Manages undo/redo functionality
- **`eventHistoryStore`** (`src/store/eventHistoryStore.ts`): Manages history view filtering and display

All stores automatically sync to appropriate storage (IndexedDB for tasks/tags, localStorage for UI preferences).

### Data Persistence

- **IndexedDB (Dexie)**: Primary data store for tasks, tags, time entries, and history (`src/lib/db.ts`)
- **Storage Manager**: Debounced sync operations (300ms) to prevent excessive writes (`src/lib/storage.ts`)
- **Data Flow**: User action → Store update → Debounced sync to IndexedDB
- **Offline Support**: Service worker registered in `public/sw.js` for PWA functionality

### Component Organization

```
src/components/
├── analytics/     # Charts and analytics dashboard (uses Recharts)
├── export/        # Import/export modals (JSON/CSV)
├── filters/       # Search bar and filter panel
├── layout/        # Header, command palette, keyboard shortcuts
├── matrix/        # Main 4-quadrant grid and task cards (uses @dnd-kit)
├── task/          # Task modal, tag selector/manager, timer, recurring config, parent selector, instance list
├── templates/     # Templates dashboard for recurring task management
└── ui/            # Reusable components (Button, Modal, Input, Badge, etc.)
```

### Drag and Drop

Uses `@dnd-kit` for task movement between quadrants:
- Main implementation in `src/components/matrix/Matrix.tsx`
- Tasks can be dragged between any quadrant
- Movement triggers `moveTask` action in taskStore which updates both quadrant and order

### Task System

**Task Types** (defined in `src/types/task.ts`):
- `STANDARD`: Regular one-time tasks
- `RECURRING_PARENT`: Parent template for recurring tasks (not shown in matrix)
- `RECURRING_INSTANCE`: Generated instances from recurring parents
- `SUBTASK`: Child task of a parent task

**Subtasks**:
- Only `STANDARD`, `RECURRING_INSTANCE`, and `RECURRING_PARENT` tasks can have subtasks
- Subtasks inherit the parent's quadrant
- Parent tasks auto-complete when all subtasks are completed
- Parent auto-uncompletes if any subtask is uncompleted
- Subtasks can be reparented to a different parent via `moveSubtaskToParent(subtaskId, newParentId)`
- Subtasks can be detached to become standalone tasks via `detachSubtask(subtaskId)`
- Template subtasks are automatically copied to generated instances

**Templates (Recurring Parents)**:
- RECURRING_PARENT tasks are managed in the dedicated Templates view (Ctrl+T)
- Templates never appear in the matrix - they generate instances
- Templates can have subtasks that are copied to all generated instances
- Templates can be paused to stop instance generation via `toggleTemplatePause`
- Template stats tracked via `getTemplateStats` from `src/utils/templateHelpers.ts`
- Instances are linked via `parentTaskId` and can be viewed in TaskSidePanel
- Deleting a template converts all instances to standalone tasks

### Recurring Tasks

**Template Management**:
- Templates (RECURRING_PARENT) are managed in dedicated Templates view (accessible via Ctrl+T)
- Hook `useRecurringTasks` checks every 60s for tasks needing new instances
- Templates can be paused/resumed via `isPaused` flag to control instance generation
- Use `toggleTemplatePause(templateId)` to pause/resume templates

**Configuration**:
- 10+ presets available in RecurringTaskConfig component:
  - Common: Daily, Weekdays, Weekly, Bi-weekly, Monthly, Quarterly
  - Advanced: 1st Monday, 15th of month, Last Friday, Last day of month
- Complex patterns supported: Nth weekday of month, specific dates, custom intervals
- Date calculation utilities in `src/utils/date.ts`

**Instance Management**:
- Child instances created with `parentTaskId` reference and `taskType: RECURRING_INSTANCE`
- Template subtasks automatically copied to new instances
- Deleting template converts instances to standalone tasks

### View Modes

The app supports specialized filter modes that provide focused task views:

**Today View** (`ViewMode.TODAY`):
- Activated via filter panel "Today's View" toggle
- Three configurable components (OR logic):
  - **Overdue tasks**: Tasks with due dates before today
  - **Due soon**: Tasks due today or within N days (0-30 days or infinity)
  - **Starred tasks**: All starred tasks regardless of due date
- Configure via `todayViewDaysAhead` and `todayViewComponents` in uiStore
- Respects standard filters (tags, people, search)

**Completed View** (`ViewMode.COMPLETED`):
- Activated via filter panel "Completed Tasks" toggle
- Shows only completed tasks within selected timeframe
- Timeframe presets: today, yesterday, this week, last week, 2 weeks ago, this month, last month, custom range
- Date range calculated via `calculateCompletedViewDateRange` utility
- State managed via `completedViewTimeframe` and `completedViewCustomRange`

### Keyboard Shortcuts

Defined in `App.tsx` using `useKeyboardShortcuts` hook:
- `Ctrl+K`: Command palette
- `Ctrl+/` or `?`: Show shortcuts help
- `Ctrl+M`: Matrix view
- `Ctrl+A`: Analytics view
- `Ctrl+H`: History view
- `Ctrl+T`: Templates view
- `Ctrl+1/2/3/4`: Add task to quadrant 1/2/3/4
- `Ctrl+D`: Toggle dark mode
- `Ctrl+L`: Clear filters
- `Ctrl+P`: Toggle Pomodoro timer
- `Ctrl+Z/Shift+Z`: Undo/redo
- `Escape`: Exit focus mode
- `F1`: Open help

### Filtering System

Filter state lives in `uiStore`:
- Search query (searches title/description)
- Selected tags and people
- Show/hide completed tasks
- Date range
- Per-quadrant starred filter
- Completed-only mode with date range
- View mode state (`activeFilterMode`: 'today' | 'completed' | null)
- Today view configuration (days ahead, component toggles)
- Completed view timeframe and custom range

Applied in `useTaskFilters` hook with multi-phase filtering logic that handles parent-child relationships and view modes.

### Theming

- Dark mode support via Tailwind's `class` strategy
- Theme preference persisted to localStorage
- Auto-detects system preference on first load
- Theme applied to `document.documentElement.classList`

### Type System

Key types in `src/types/`:
- **task.ts**: Task, Tag, Person, RecurrenceConfig, FilterState, QuadrantType, TaskType, ViewMode, HistoryEntry, DataOperation

QuadrantType and TaskType use const object pattern for type-safe enums.

## Important Implementation Details

### Date Handling

- All dates stored as Date objects in memory
- Converted to/from ISO strings during JSON import/export
- Use `date-fns` for date manipulation (imported in components as needed)

### ID Generation

Simple timestamp + random string pattern: `Date.now()-${random}`
Used consistently across tasks, tags, and people.

### IndexedDB Schema

Current version 9 schema in `src/lib/db.ts`:
- `tasks`: Indexed by id, quadrant, completed, createdAt, dueDate, tags (multi), people (multi), parentTaskId, taskType, isStarred
- `tags`: Indexed by id, name
- `people`: Indexed by id, name
- `history`: Auto-increment id, indexed by timestamp, action, taskId
- `dataOperations`: Auto-increment id, indexed by timestamp, operationType

**Important**: When modifying schema, increment version number and provide upgrade logic.

### PWA Configuration

- Manifest at `public/manifest.json`
- Service worker at `public/sw.js`
- Icons in `public/` directory
- Configured for standalone display mode

### History Tracking

- All task operations logged to `history` table via `historyLogger` (`src/lib/historyLogger.ts`)
- Action types include: task_added, task_updated, task_deleted, task_completed, task_moved, task_starred, subtask_added, parent_auto_completed
- Field-level change tracking for updates
- Automatic cleanup based on `historyRetentionDays` setting (default 7 days)

### Pomodoro Integration

- Pomodoro state lives in `uiStore`
- Hook `usePomodoroTimer` handles timer tick every second
- Overlay component in `src/components/pomodoro/PomodoroOverlay.tsx`
- Can be linked to specific tasks via `focusedTaskId`

### Export Reminders

- Configurable reminder system to encourage regular data backups
- Hook `useExportReminder` checks last export from `dataOperationLogger`
- State in `uiStore`: `exportReminderEnabled`, `exportReminderFrequencyDays` (7/14/30/90 days)
- Banner component `ExportReminderBanner` with Export/Snooze/Dismiss actions
- Export operations logged to `dataOperations` table via `dataOperationLogger`

## Common Development Patterns

### Adding a New Task Action

1. Add method to `TaskStore` interface and implementation
2. Call `get().syncToDB()` after state update
3. Update components to use new action
4. Add history logging via `historyLogger` if appropriate
5. Consider undo/redo support via historyStore

### Creating a New Modal

1. Create component in appropriate directory
2. Use `Modal` from `src/components/ui/Modal.tsx` as base
3. Add state and handler in parent component (usually App.tsx)
4. Register keyboard shortcut if needed in App.tsx

### Adding Analytics

1. Create chart component in `src/components/analytics/`
2. Use Recharts library (already imported)
3. Add to `AnalyticsDashboard.tsx`
4. Query task data from `useTaskStore`

### Modifying Database Schema

1. Update type definitions in `src/types/task.ts`
2. Increment version in `src/lib/db.ts`
3. Add migration logic in `.upgrade()` if needed
4. Update serialization in `src/lib/storage.ts` for import/export

### Working with Subtasks

- Use utility functions from `src/utils/taskHelpers.ts`:
  - `canHaveSubtasks(task)`: Check if task can have subtasks
  - `hasSubtasks(task, tasks)`: Check if task has any subtasks
  - `areAllSubtasksCompleted(task, tasks)`: Check completion status
  - `isSubtask(task)`: Check if task is a subtask
- Parent completion auto-updates are handled in taskStore via `updateParentCompletionStatus`

### Working with Templates

**Creating a Template:**
1. Set `taskType: TaskType.RECURRING_PARENT` and `isRecurring: true`
2. Configure `recurrence` object with pattern, interval, and optional constraints
3. Use presets from `RecurringTaskConfig.RECURRING_PRESETS` or custom config
4. Templates automatically hidden from matrix view
5. Add subtasks to template - they'll be copied to all instances

**Managing Template Lifecycle:**
- Pause/resume: `toggleTemplatePause(templateId)` - stops instance generation
- View instances: Use `getInstances(templateId)` from taskStore
- Get statistics: Use `getTemplateStats(template, allTasks)` from templateHelpers
- Delete template: Instances automatically converted to standalone tasks

**Instance Generation:**
- Automatic via `useRecurringTasks` hook (60s interval)
- Respects `isPaused` flag and `endDate`/`endAfterOccurrences` limits
- Subtasks cloned from template with proper parentTaskId references

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS with dark mode
- **State**: Zustand with persist middleware
- **Database**: Dexie (IndexedDB wrapper)
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Icons**: lucide-react
- **Notifications**: react-hot-toast
- **Date Utils**: date-fns
- **Immutability**: immer
- **Command Palette**: cmdk
