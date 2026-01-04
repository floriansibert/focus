# Focus - Eisenhower Matrix Task Manager

A powerful, offline-first task management application built on the Eisenhower Priority Matrix framework. Focus helps you organize tasks by urgency and importance, enabling you to prioritize effectively and achieve your goals.

## Overview

Focus is a Progressive Web App (PWA) that implements the time-tested Eisenhower Matrix (also known as the Urgent-Important Matrix) for task prioritization. It provides a comprehensive set of features for managing tasks, tracking time, analyzing productivity, and maintaining focus—all while keeping your data completely private and offline.

## Key Features

- **Eisenhower Matrix**: Organize tasks across four quadrants (Urgent & Important, Not Urgent & Important, Urgent & Not Important, Not Urgent & Not Important)
- **Recurring Tasks**: Create templates with 10+ recurrence presets (Daily, Weekdays, 1st Monday, Last Friday, etc.) that automatically generate task instances
- **View Modes**:
  - **Today's View**: Focus on overdue, due soon, and starred tasks with configurable lookahead
  - **Completed View**: Review accomplishments across customizable timeframes
- **Subtasks**: Break down complex tasks with nested subtasks, progress tracking, and auto-parent completion
- **Pomodoro Timer**: Built-in focus timer with 25-minute work sessions and automatic break scheduling
- **Analytics Dashboard**: Visualize task distribution, completion trends, and productivity metrics with interactive charts
- **History Tracking**: Complete audit trail of all task operations with undo/redo support
- **Tags & People**: Categorize and assign tasks with customizable colored labels
- **Drag & Drop**: Intuitive task organization with smooth drag-and-drop between quadrants
- **Search & Filters**: Powerful filtering by tags, people, completion status, date ranges, and starred tasks
- **Offline-First**: Works completely offline with IndexedDB persistence
- **PWA Support**: Install as a standalone app on desktop and mobile devices
- **Export/Import**: Backup data in JSON or CSV formats
- **Dark Mode**: Comfortable viewing in any lighting condition
- **Keyboard Shortcuts**: Extensive keyboard shortcuts for power users

## Quick Start

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/focus.git
   cd focus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Building for Production

Build the app into a single HTML file:
```bash
npm run build
```

The production build will be created in the `dist/` directory as a single self-contained HTML file, perfect for easy deployment or offline use.

## Feature Highlights

### The Eisenhower Matrix

Focus organizes your tasks into four quadrants based on urgency and importance:

- **Do First** (Urgent & Important): Crises, deadlines, emergencies - handle immediately
- **Schedule** (Not Urgent & Important): Strategic work, development - plan and prioritize
- **Delegate** (Urgent & Not Important): Interruptions, some emails - delegate if possible
- **Eliminate** (Not Urgent & Not Important): Time wasters, busy work - minimize or eliminate

### Recurring Tasks

Create powerful recurring task templates with:
- 10+ preset patterns (Daily, Weekly, Monthly, Weekdays, Weekends, Quarterly, etc.)
- Advanced patterns like "1st Monday" or "Last Friday" of each month
- Custom intervals for any recurrence need
- Subtask templates that copy to all instances
- Pause/resume functionality
- Dedicated Templates view (Ctrl+T) for template management
- Instance tracking and navigation

### View Modes

**Today's View**: Configurable focus mode showing:
- Overdue tasks
- Tasks due within N days (0-30 or infinity)
- Starred tasks
- All components use OR logic and respect other filters

**Completed View**: Review completed tasks with presets:
- Today, Yesterday, This Week, Last Week
- This Month, Last Month, 2 Weeks Ago
- Custom date ranges

### Subtasks

Break down complex work with:
- Nested subtask support
- Progress indicators (e.g., "2 of 5 subtasks completed")
- Auto-completion of parent when all subtasks done
- Reparenting: Move subtasks to different parents
- Detaching: Convert subtasks to standalone tasks

### Analytics

Track your productivity with:
- Quadrant distribution charts
- Weekly completion trends
- Completion rates by quadrant
- Summary statistics (total, completed, active, overdue)
- Interactive charts built with Recharts

## In-App Documentation

Press **F1** or click the Help icon in the app header to access comprehensive in-app documentation covering all features, keyboard shortcuts, and best practices.

## Technology Stack

Focus is built with modern web technologies:

- **React 19** with TypeScript for type-safe component development
- **Vite 7** for lightning-fast development and optimized builds
- **Zustand** for state management with persistence
- **Dexie** (IndexedDB wrapper) for offline-first data storage
- **Tailwind CSS** for responsive styling with dark mode support
- **@dnd-kit** for accessible drag-and-drop functionality
- **Recharts** for data visualization
- **date-fns** for date manipulation
- **Lucide React** for beautiful icons
- **react-hot-toast** for notifications

## Privacy & Data

Focus respects your privacy:
- **No Cloud Sync**: All data stays on your device
- **No Tracking**: Zero analytics or data collection
- **Offline-First**: Works completely offline using browser storage (IndexedDB)
- **PWA Capable**: Install as standalone app with full offline functionality
- **Local Control**: Export data anytime in JSON or CSV formats

## Keyboard Shortcuts

Focus includes extensive keyboard shortcuts for efficient task management:

- `Ctrl+K` - Command palette
- `Ctrl+T` - Templates view
- `Ctrl+M` - Matrix view
- `Ctrl+A` - Analytics view
- `Ctrl+H` - History view
- `Ctrl+1/2/3/4` - Add task to quadrant
- `Ctrl+F` - Search
- `Ctrl+Z` / `Ctrl+Shift+Z` - Undo/Redo
- `F1` - Help documentation
- And many more...

Press `Ctrl+/` or `?` in the app to view all shortcuts.

## Development

### Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Build Output

The build process uses `vite-plugin-singlefile` to bundle the entire application (HTML, CSS, JavaScript, and assets) into a single HTML file for easy deployment and offline use.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

[Your License Here]

---

Built with focus, for focus.
