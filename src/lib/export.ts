import type { Task, Tag, Person } from '../types/task';

export interface ExportData {
  version: string;
  exportDate: string;
  tasks: Task[];
  tags: Tag[];
  people: Person[];
}

/**
 * Export all data as JSON
 */
export function exportAsJSON(tasks: Task[], tags: Tag[], people: Person[]): string {
  const data: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    tasks,
    tags,
    people,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Export tasks as CSV
 */
export function exportAsCSV(tasks: Task[], tags: Tag[], people: Person[]): string {
  // Create a map of tag IDs to names for easier lookup
  const tagMap = new Map(tags.map((tag) => [tag.id, tag.name]));
  // Create a map of people IDs to names for easier lookup
  const peopleMap = new Map(people.map((person) => [person.id, person.name]));

  // CSV header
  const headers = [
    'Title',
    'Description',
    'Quadrant',
    'Completed',
    'Due Date',
    'Tags',
    'People',
    'Created At',
    'Updated At',
    'Completed At',
  ];

  // CSV rows
  const rows = tasks.map((task) => {
    const tagNames = task.tags.map((tagId) => tagMap.get(tagId) || tagId).join('; ');
    const peopleNames = task.people?.map((personId) => peopleMap.get(personId) || personId).join('; ') || '';

    return [
      escapeCSV(task.title),
      escapeCSV(task.description || ''),
      escapeCSV(task.quadrant),
      task.completed ? 'Yes' : 'No',
      task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
      escapeCSV(tagNames),
      escapeCSV(peopleNames),
      new Date(task.createdAt).toLocaleDateString(),
      new Date(task.updatedAt).toLocaleDateString(),
      task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '',
    ];
  });

  // Combine headers and rows
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csv;
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download data as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp (includes date and time)
 */
export function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `${prefix}-${date}-${time}.${extension}`;
}
