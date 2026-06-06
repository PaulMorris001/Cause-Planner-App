import { Task, Class } from '@/types';

/**
 * Builds the padded day array for a month calendar grid.
 * Leading `null` values fill the empty cells before the 1st of the month
 * so that the 1st always lands on the correct day-of-week column (Sun = 0).
 */
export function getMonthDays(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  return days;
}

/**
 * Returns all tasks whose dueDate falls on the given date.
 * Uses local-timezone date formatting to avoid the UTC-midnight shift that
 * occurs when you pass a bare "YYYY-MM-DD" string to `new Date()`.
 */
export function getTasksForDate(date: Date | null, tasks: Task[]): Task[] {
  if (!date) return [];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return tasks.filter(t => t.dueDate === `${y}-${m}-${d}`);
}

/**
 * Returns the deduplicated list of classes that occur on the given date.
 * Checks three conditions:
 *   1. The class runs on this day of the week (e.g. "Monday")
 *   2. The date is on or after the class semester start date
 *   3. The date is on or before the class semester end date
 */
export function getClassesForDate(date: Date | null, classes: Class[]): Class[] {
  if (!date) return [];
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  const filtered = classes.filter(cls => {
    if (!cls.daysOfWeek.includes(dayName)) return false;

    const [sY, sM, sD] = cls.startDate.split('-').map(Number);
    const classStart = new Date(sY, sM - 1, sD, 0, 0, 0, 0);

    const [eY, eM, eD] = cls.endDate.split('-').map(Number);
    const classEnd = new Date(eY, eM - 1, eD, 23, 59, 59, 999);

    const check = new Date(date);
    check.setHours(0, 0, 0, 0);

    return check >= classStart && check <= classEnd;
  });

  return Array.from(new Map(filtered.map(cls => [cls.id, cls])).values());
}
