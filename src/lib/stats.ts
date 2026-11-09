import type { Goal, Plan, TrackedLift, WorkoutLog, WorkoutTemplate } from '../types/plan';

export type DayCompletion = 'none' | 'partial' | 'done';

export interface LiftPoint {
  date: string;
  weight: number;
  reps: number;
}

/** Required (non-optional) exercises must have every set marked done for `done`. */
export function getDayCompletion(
  template: WorkoutTemplate | undefined,
  log: WorkoutLog | undefined,
): DayCompletion {
  if (!template) return 'none';

  const required = template.exercises.filter((exercise) => !exercise.optional);
  if (required.length === 0) return 'none';

  const doneKeys = new Set(
    (log?.entries ?? [])
      .filter((entry) => entry.done)
      .map((entry) => `${entry.exerciseId}-${entry.setIndex}`),
  );

  let requiredDone = 0;
  let requiredTotal = 0;

  for (const exercise of required) {
    for (let setIndex = 0; setIndex < exercise.sets; setIndex += 1) {
      requiredTotal += 1;
      if (doneKeys.has(`${exercise.id}-${setIndex}`)) requiredDone += 1;
    }
  }

  if (requiredDone === 0) {
    // Optional-only progress still counts as partial
    const anyDone = (log?.entries ?? []).some((entry) => entry.done);
    return anyDone ? 'partial' : 'none';
  }

  if (requiredDone === requiredTotal) return 'done';
  return 'partial';
}

export function bestWorkingWeight(
  logs: WorkoutLog[],
  plan: Plan,
  lift: TrackedLift,
): LiftPoint[] {
  const exerciseIds = new Set(
    plan.templates.flatMap((t) =>
      t.exercises.filter((e) => e.trackedLift === lift).map((e) => e.id),
    ),
  );

  const byDate = new Map<string, LiftPoint>();

  for (const log of logs) {
    for (const entry of log.entries) {
      if (!exerciseIds.has(entry.exerciseId)) continue;
      if (!entry.done || entry.weight == null || entry.reps == null) continue;
      const prev = byDate.get(log.date);
      if (!prev || entry.weight > prev.weight) {
        byDate.set(log.date, {
          date: log.date,
          weight: entry.weight,
          reps: entry.reps,
        });
      }
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function goalProgress(goal: Goal, points: LiftPoint[]) {
  const latest = points.at(-1)?.weight ?? goal.startLoad;
  const span = Math.max(goal.target1RM - goal.startLoad, 1);
  const pct = Math.min(100, Math.max(0, ((latest - goal.startLoad) / span) * 100));
  return { latest, pct };
}

export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}
