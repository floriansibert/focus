import type { Task, Tag, Person } from '../types/task';

export interface ImportResult {
  success: boolean;
  tasks?: Task[];
  tags?: Tag[];
  people?: Person[];
  error?: string;
  warnings?: string[];
}

/**
 * Import data from JSON
 */
export function importFromJSON(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString);

    // Validate structure
    if (!data.tasks || !Array.isArray(data.tasks)) {
      return {
        success: false,
        error: 'Invalid JSON format: missing or invalid tasks array',
      };
    }

    if (!data.tags || !Array.isArray(data.tags)) {
      return {
        success: false,
        error: 'Invalid JSON format: missing or invalid tags array',
      };
    }

    // Validate and sanitize tasks
    const warnings: string[] = [];
    const validatedTasks: Task[] = [];

    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];

      // Validate required fields
      if (!task.id || !task.title || !task.quadrant) {
        warnings.push(`Task ${i + 1}: Missing required fields, skipping`);
        continue;
      }

      // Convert date strings back to Date objects
      const validatedTask: Task = {
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        tags: task.tags || [],
        people: task.people || [],
        isRecurring: task.isRecurring || false,
      };

      validatedTasks.push(validatedTask);
    }

    // Validate tags
    const validatedTags: Tag[] = data.tags.filter((tag: any) => {
      if (!tag.id || !tag.name) {
        warnings.push(`Invalid tag found, skipping`);
        return false;
      }
      return true;
    });

    // Validate people (optional for backwards compatibility)
    const validatedPeople: Person[] = data.people ? data.people.filter((person: any) => {
      if (!person.id || !person.name) {
        warnings.push(`Invalid person found, skipping`);
        return false;
      }
      return true;
    }) : [];

    return {
      success: true,
      tasks: validatedTasks,
      tags: validatedTags,
      people: validatedPeople,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse JSON',
    };
  }
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Merge imported data with existing data
 */
export function mergeData(
  existing: { tasks: Task[]; tags: Tag[]; people: Person[] },
  imported: { tasks: Task[]; tags: Tag[]; people: Person[] }
): { tasks: Task[]; tags: Tag[]; people: Person[] } {
  // Create maps for deduplication
  const taskMap = new Map(existing.tasks.map((task) => [task.id, task]));
  const tagMap = new Map(existing.tags.map((tag) => [tag.id, tag]));
  const peopleMap = new Map(existing.people.map((person) => [person.id, person]));

  // Add imported items (newer items override older ones)
  imported.tasks.forEach((task) => {
    taskMap.set(task.id, task);
  });

  imported.tags.forEach((tag) => {
    tagMap.set(tag.id, tag);
  });

  imported.people.forEach((person) => {
    peopleMap.set(person.id, person);
  });

  return {
    tasks: Array.from(taskMap.values()),
    tags: Array.from(tagMap.values()),
    people: Array.from(peopleMap.values()),
  };
}
