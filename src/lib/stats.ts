import type { Goal, Plan, TrackedLift, WorkoutLog } from '../types/plan';

export interface LiftPoint {
  date: string;
  weight: number;
  reps: number;
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
