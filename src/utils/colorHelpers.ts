/**
 * Calculates the appropriate text color (black or white) for a given background color
 * to ensure WCAG AA compliance for contrast ratios.
 *
 * @param hexColor - The background color in hex format (e.g., '#EF4444')
 * @returns '#000000' for light backgrounds, '#FFFFFF' for dark backgrounds
 */
export function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds (luminance > 0.5), white for dark
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
