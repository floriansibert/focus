import { useRef, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Users, Filter, BarChart3, Download, Keyboard, AlertCircle, Calendar, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useUIStore } from '../../store/uiStore';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: string;
  onOpenShortcuts?: () => void;
}

type Section = 'getting-started' | 'managing-tasks' | 'advanced-features' | 'search-filters' | 'analytics-history' | 'data-privacy' | 'keyboard-shortcuts';

export function HelpModal({ isOpen, onClose, initialSection, onOpenShortcuts }: HelpModalProps) {
  const { helpModalSection, setHelpModalSection } = useUIStore();
  const activeSection = (helpModalSection || initialSection || 'getting-started') as Section;
  const contentRef = useRef<HTMLDivElement>(null);
  const isClickScrolling = useRef(false);
  const hasScrolledOnOpen = useRef(false);

  // Scroll to saved section when modal first opens
  useEffect(() => {
    if (isOpen && contentRef.current && !hasScrolledOnOpen.current) {
      const sectionElement = contentRef.current.querySelector(`#${activeSection}`);
      if (sectionElement) {
        sectionElement.scrollIntoView({
          behavior: 'instant',
          block: 'start'
        });
        hasScrolledOnOpen.current = true;
      }
    }

    // Reset when modal closes
    if (!isOpen) {
      hasScrolledOnOpen.current = false;
    }
  }, [isOpen, activeSection]);

  // Scroll to section when user clicks navigation (only)
  useEffect(() => {
    if (isOpen && contentRef.current && isClickScrolling.current) {
      const sectionElement = contentRef.current.querySelector(`#${activeSection}`);
      if (sectionElement) {
        sectionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Reset flag after scrolling completes
        setTimeout(() => {
          isClickScrolling.current = false;
        }, 1000);
      }
    }
  }, [activeSection, isOpen]);

  // Track scroll position and update active section
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update active section while user is clicking to scroll
        if (isClickScrolling.current) return;

        // Find the most visible section
        let mostVisibleEntry = entries[0];
        let maxVisibility = 0;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxVisibility) {
            maxVisibility = entry.intersectionRatio;
            mostVisibleEntry = entry;
          }
        });

        if (mostVisibleEntry && mostVisibleEntry.isIntersecting) {
          const sectionId = mostVisibleEntry.target.id as Section;
          setHelpModalSection(sectionId);
        }
      },
      {
        root: contentRef.current,
        rootMargin: '-20% 0px -70% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe all sections
    const sections = contentRef.current.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [isOpen, setHelpModalSection]);

  const handleSectionClick = (sectionId: Section) => {
    isClickScrolling.current = true;
    setHelpModalSection(sectionId);
  };

  const sections = [
    { id: 'getting-started' as Section, label: 'Getting Started', icon: BookOpen },
    { id: 'managing-tasks' as Section, label: 'Managing Tasks', icon: CheckCircle },
    { id: 'advanced-features' as Section, label: 'Advanced Features', icon: Clock },
    { id: 'search-filters' as Section, label: 'Search & Filters', icon: Filter },
    { id: 'analytics-history' as Section, label: 'Analytics & History', icon: BarChart3 },
    { id: 'data-privacy' as Section, label: 'Data & Privacy', icon: Download },
    { id: 'keyboard-shortcuts' as Section, label: 'Keyboard Shortcuts', icon: Keyboard },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Help & Documentation"
      size="xl"
    >
      <div className="flex gap-6 h-[600px]">
        {/* Sidebar Navigation */}
        <nav className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-4">
          <ul className="space-y-1 sticky top-0">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content Area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto pr-2 space-y-8">
          {/* Getting Started */}
          <section id="getting-started" className="scroll-mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BookOpen size={24} />
              Getting Started
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  What is the Eisenhower Matrix?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  The Eisenhower Matrix, also known as the Urgent-Important Matrix, is a productivity framework named after President Dwight D. Eisenhower. It helps you prioritize tasks by categorizing them based on two factors: urgency and importance.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This simple yet powerful tool enables you to focus on what truly matters by distinguishing between tasks that demand immediate attention and those that contribute to long-term goals.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Understanding the Four Quadrants
                </h3>

                {/* Visual Quadrant Diagram */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                      <h4 className="font-semibold text-sm text-red-900 dark:text-red-100">Urgent & Important</h4>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium mb-1">DO FIRST</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Handle immediately. Crises, deadlines, emergencies.</p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Not Urgent & Important</h4>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">SCHEDULE</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Plan and prioritize. Strategic work, development.</p>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border-2 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={18} className="text-amber-600 dark:text-amber-400" />
                      <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Urgent & Not Important</h4>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">DELEGATE</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Delegate if possible. Interruptions, some emails.</p>
                  </div>

                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle size={18} className="text-gray-600 dark:text-gray-400" />
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Not Urgent & Not Important</h4>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">ELIMINATE</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Minimize or eliminate. Time wasters, busy work.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Your First Tasks
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Click <strong className="text-gray-900 dark:text-gray-100">"+ Add Task"</strong> in any quadrant to create a new task</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Choose the right quadrant by asking: Is this urgent? Is this important?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Focus on Quadrant 2 (Not Urgent & Important) for long-term success</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Double-click a quadrant header to enter focus mode for that quadrant</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Managing Tasks */}
          <section id="managing-tasks" className="scroll-mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <CheckCircle size={24} />
              Managing Tasks
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Creating Tasks
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Title</strong>: Give your task a clear, actionable name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Description</strong>: Add details, context, or notes (optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Due Date</strong>: Set a deadline to stay on track</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Tags</strong>: Categorize with custom tags (work, personal, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">People</strong>: Assign tasks to team members or collaborators</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Organizing Tasks
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Drag & Drop</strong>: Move tasks between quadrants by dragging them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Reorder</strong>: Drag tasks within a quadrant to change priority</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Star Tasks</strong>: Click the star icon to highlight important tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Collapse/Expand</strong>: Use quadrant controls to manage screen space</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Task Actions
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Complete</strong>: Click the checkbox to mark tasks as done</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Edit</strong>: Click on a task card to open the edit modal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Delete</strong>: Open task details and click the delete button</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Undo/Redo</strong>: Use <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Z</kbd> and <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+Z</kbd></span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Advanced Features */}
          <section id="advanced-features" className="scroll-mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clock size={24} />
              Advanced Features
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Recurring Tasks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Automatically create repeating tasks for habits, routines, or regular responsibilities.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Patterns</strong>: Daily, weekly, monthly, or custom intervals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Parent Task</strong>: The template that generates new instances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Instances</strong>: Individual tasks created from the parent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>The app automatically generates new instances based on your schedule</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Subtasks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Break down complex tasks into smaller, manageable steps.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Click the subtask icon on a task card to add subtasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Parent task shows progress: "2 of 5 subtasks completed"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Parent task auto-completes when all subtasks are done</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Pomodoro Timer
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Stay focused with the built-in Pomodoro timer. Work in focused 25-minute sessions with regular breaks.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Start Timer</strong>: Click the clock icon on any task card, or open Tools menu (wrench icon) in header → Pomodoro Timer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Session Types</strong>: 25-min work sessions, 5-min short breaks, 15-min long break after 4 sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Task Focus</strong>: View task details, subtasks, and parent tasks in the timer overlay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Minimize</strong>: Close overlay while timer runs - countdown appears in header</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Header Controls</strong>: Hover over header countdown to pause/resume or reset</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Shortcuts</strong>: <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> to play/pause, <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">S</kbd> to skip, <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">R</kbd> to restart session</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Tags & People
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Manage Tags</strong>: Go to Settings → Manage Tags to create custom tags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Manage People</strong>: Go to Settings → Manage People to add team members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Assign multiple tags and people to any task</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Use custom colors to visually organize your work</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Search & Filters */}
          <section id="search-filters" className="scroll-mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Filter size={24} />
              Search & Filters
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Search Bar
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+F</kbd> to focus the search bar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Search across task titles and descriptions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Results highlight matching tasks across all quadrants</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Filter Panel
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Tags</strong>: Filter tasks by one or more tags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">People</strong>: Show only tasks assigned to specific people</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Completed Tasks</strong>: Toggle visibility of completed tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Date Range</strong>: Filter completed tasks by date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Clear All</strong>: Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+L</kbd> to clear filters</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Analytics & History */}
          <section id="analytics-history" className="scroll-mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BarChart3 size={24} />
              Analytics & History
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Analytics Dashboard
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Access analytics from the header toolbar to visualize your productivity.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Quadrant Distribution</strong>: See how tasks are distributed across quadrants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Weekly Completions</strong>: Track your completion rate over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Completion Trends</strong>: See completion percentages across quadrants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Summary Stats</strong>: Total tasks, completed, active, and overdue counts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Use insights to optimize your workflow and priorities</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  History View
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>View a timeline of all task changes and activities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Filter history by action type or date range</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Track task creations, updates, completions, moves, and deletions</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data & Privacy */}
          <section id="data-privacy" className="scroll-mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Download size={24} />
              Data & Privacy
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Import & Export
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Backup your data or transfer between devices using import/export.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Export JSON</strong>: Full data backup with all metadata (recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Export CSV</strong>: Simplified format for spreadsheets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Import Merge</strong>: Add imported tasks to existing data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Import Replace</strong>: Replace all data with imported file</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <strong>Tip:</strong> Export regularly to create backups and prevent data loss.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Privacy & Local Storage
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">Offline-First</strong>: All data is stored locally in your browser</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">No Cloud Sync</strong>: Your data never leaves your device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">IndexedDB</strong>: Browser database persists across sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong className="text-gray-900 dark:text-gray-100">PWA Support</strong>: Install as a standalone app on your device</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-xs text-green-900 dark:text-green-100">
                    <strong>Privacy Guaranteed:</strong> Focus respects your privacy. No tracking, no analytics, no data collection.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section id="keyboard-shortcuts" className="scroll-mt-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Keyboard size={24} />
              Keyboard Shortcuts
            </h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Speed up your workflow with these essential keyboard shortcuts:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">General</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Open command palette</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+K</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Show keyboard shortcuts</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+/</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Toggle dark mode</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+D</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Open help (this modal)</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">F1</kbd>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Navigation</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Switch to matrix view</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+M</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Switch to analytics view</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+A</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Switch to history view</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+H</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Close modal/focus mode</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Quick Task Entry</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Add to Urgent & Important</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+1</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Add to Not Urgent & Important</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+2</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Add to Urgent & Not Important</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+3</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Add to Not Urgent & Not Important</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+4</kbd>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Search & Filters</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Focus search bar</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+F</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Clear all filters</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+L</kbd>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Task Management</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Undo</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Z</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Redo</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+Z</kbd>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Save task (in modal)</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Enter</kbd>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    <strong>Note:</strong> On macOS, use <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">⌘ Cmd</kbd> instead of <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl</kbd> for most shortcuts.
                  </p>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (onOpenShortcuts) {
                        onClose();
                        onOpenShortcuts();
                      }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View complete keyboard shortcuts reference →
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}
