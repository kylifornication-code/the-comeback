import { addDays, format, parseISO } from 'date-fns';
import type { Plan, ScheduleEntry, WorkoutTemplate } from '../types/plan';

export function generateSchedule(
  startDate: string,
  endDate: string,
  templates: WorkoutTemplate[],
): ScheduleEntry[] {
  const byWeekday = new Map(templates.map((t) => [t.weekday, t.id]));
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const schedule: ScheduleEntry[] = [];

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    // date-fns: Sunday = 0 … Saturday = 6 → convert to Mon=1 … Sun=7
    const jsDay = cursor.getDay();
    const weekday = jsDay === 0 ? 7 : jsDay;
    const templateId = byWeekday.get(weekday);
    if (templateId) {
      schedule.push({ date: format(cursor, 'yyyy-MM-dd'), templateId });
    }
  }

  return schedule;
}

export function withGeneratedSchedule(plan: Omit<Plan, 'schedule'> & { schedule?: ScheduleEntry[] }): Plan {
  return {
    ...plan,
    schedule: plan.schedule?.length
      ? plan.schedule
      : generateSchedule(plan.startDate, plan.endDate, plan.templates),
  };
}

/** Move a workout from one date to another. Swaps if the target already has a session. */
export function moveWorkout(
  schedule: ScheduleEntry[],
  fromDate: string,
  toDate: string,
): ScheduleEntry[] {
  if (fromDate === toDate) return schedule;

  const next = schedule.map((entry) => ({ ...entry }));
  const fromIdx = next.findIndex((e) => e.date === fromDate);
  if (fromIdx < 0) return schedule;

  const toIdx = next.findIndex((e) => e.date === toDate);
  const moving = next[fromIdx];

  if (toIdx >= 0) {
    const target = next[toIdx];
    next[fromIdx] = { date: fromDate, templateId: target.templateId };
    next[toIdx] = { date: toDate, templateId: moving.templateId };
  } else {
    next[fromIdx] = { date: toDate, templateId: moving.templateId };
  }

  return next.sort((a, b) => a.date.localeCompare(b.date));
}

export function getTemplateForDate(plan: Plan, date: string): WorkoutTemplate | undefined {
  const entry = plan.schedule.find((s) => s.date === date);
  if (!entry) return undefined;
  return plan.templates.find((t) => t.id === entry.templateId);
}

export function getWeekForDate(plan: Plan, date: string) {
  const d = parseISO(date);
  return plan.weeks.find((week) => {
    const start = parseISO(week.startMonday);
    const end = addDays(start, 6);
    return d >= start && d <= end;
  });
}
