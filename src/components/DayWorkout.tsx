import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { useComebackStore } from '../app/store';
import { getTemplateForDate, getWeekForDate } from '../lib/schedule';
import type { Exercise, LoadValue, TrackedLift } from '../types/plan';

function plannedLoad(
  lift: TrackedLift | undefined,
  loads: Record<TrackedLift, LoadValue> | undefined,
  cleanLoad: LoadValue | undefined,
  exerciseId: string,
): string | null {
  if (!lift || !loads) return null;
  const value = loads[lift];
  if (value === 'deload') return 'Deload · ~80–85% prior / half sets';
  if (value === 'assess') return 'Assess / test week';
  if (exerciseId === 'clean-tech' && typeof cleanLoad === 'number') {
    const tech = Math.floor((cleanLoad * 0.65) / 5) * 5;
    return `${tech} lb tech`;
  }
  if (typeof value === 'number') return `${value} lb`;
  return null;
}

function parseRepHint(reps: string): number | null {
  const match = reps.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function DayWorkout({ date }: { date: string }) {
  const plan = useComebackStore((s) => s.plan);
  const logs = useComebackStore((s) => s.logs);
  const upsertSet = useComebackStore((s) => s.upsertSet);
  const moveSession = useComebackStore((s) => s.moveSession);
  const setView = useComebackStore((s) => s.setView);

  const template = getTemplateForDate(plan, date);
  const week = getWeekForDate(plan, date);
  const log = logs.find((l) => l.date === date);
  const [moveTo, setMoveTo] = useState('');

  const entryMap = useMemo(() => {
    const map = new Map<string, { weight: number | null; reps: number | null; done: boolean }>();
    for (const e of log?.entries ?? []) {
      map.set(`${e.exerciseId}-${e.setIndex}`, e);
    }
    return map;
  }, [log]);

  function updateSet(
    exercise: Exercise,
    setIndex: number,
    patch: Partial<{ weight: number | null; reps: number | null; done: boolean }>,
  ) {
    if (!template) return;
    const key = `${exercise.id}-${setIndex}`;
    const current = entryMap.get(key) ?? {
      weight: null as number | null,
      reps: parseRepHint(exercise.reps),
      done: false,
    };

    let weight = patch.weight !== undefined ? patch.weight : current.weight;
    if (weight == null && exercise.trackedLift && week) {
      const planned = week.loads[exercise.trackedLift];
      if (typeof planned === 'number') {
        weight =
          exercise.id === 'clean-tech'
            ? Math.floor((planned * 0.65) / 5) * 5
            : planned;
      }
    }

    upsertSet(date, template.id, {
      exerciseId: exercise.id,
      setIndex,
      weight,
      reps: patch.reps !== undefined ? patch.reps : current.reps,
      done: patch.done !== undefined ? patch.done : current.done,
    });
  }

  function bumpWeight(exercise: Exercise, setIndex: number, delta: number) {
    const key = `${exercise.id}-${setIndex}`;
    const current = entryMap.get(key);
    const base =
      current?.weight ??
      (exercise.trackedLift && typeof week?.loads[exercise.trackedLift] === 'number'
        ? (week.loads[exercise.trackedLift] as number)
        : 0);
    updateSet(exercise, setIndex, { weight: Math.max(0, base + delta) });
  }

  function copyPrev(exercise: Exercise, setIndex: number) {
    if (setIndex === 0) return;
    const prev = entryMap.get(`${exercise.id}-${setIndex - 1}`);
    if (!prev) return;
    updateSet(exercise, setIndex, {
      weight: prev.weight,
      reps: prev.reps,
    });
  }

  function handleMove() {
    if (!moveTo || !template) return;
    moveSession(date, moveTo);
    setView({ name: 'day', date: moveTo });
  }

  if (!template) {
    return (
      <div className="animate-fade-up space-y-4">
        <button
          type="button"
          onClick={() => setView({ name: 'calendar' })}
          className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]"
        >
          ← Calendar
        </button>
        <div className="aj-panel rounded-sm p-6">
          <h2 className="font-display text-4xl">{format(parseISO(date), 'EEEE, MMM d')}</h2>
          <p className="mt-2 text-[var(--text-muted)]">Rest day — no session scheduled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setView({ name: 'calendar' })}
          className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]"
        >
          ← Calendar
        </button>
        {week && (
          <span className="rounded-sm bg-[var(--accent)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Week {week.week} · {week.phase}
          </span>
        )}
      </div>

      <div className="aj-panel overflow-hidden rounded-sm">
        <div className="aj-stripe h-2" />
        <div className="space-y-1 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Average Joe&apos;s Floor · {format(parseISO(date), 'EEEE, MMM d')}
          </p>
          <h2 className="font-display text-5xl text-[var(--accent)]">{template.name}</h2>
        </div>
      </div>

      <div className="aj-panel space-y-3 rounded-sm p-4">
        <h3 className="font-display text-2xl">Move workout</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-[var(--text-muted)]">New date</span>
            <input
              type="date"
              value={moveTo}
              min={plan.startDate}
              max={plan.endDate}
              onChange={(e) => setMoveTo(e.target.value)}
              className="rounded-sm border-2 border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={!moveTo}
            onClick={handleMove}
            className="rounded-sm bg-[var(--aj-navy)] px-4 py-2 font-bold uppercase tracking-wide text-white disabled:opacity-40 dark:bg-[var(--stripe)] dark:text-[var(--aj-navy)]"
          >
            Move / swap
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {template.exercises.map((exercise) => {
          const hint = plannedLoad(
            exercise.trackedLift,
            week?.loads,
            week?.loads.clean,
            exercise.id,
          );
          return (
            <section key={exercise.id} className="aj-panel rounded-sm p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-3xl leading-none">{exercise.name}</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {exercise.sets} × {exercise.reps}
                    {exercise.optional ? ' · optional' : ''}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{exercise.cue}</p>
                </div>
                {hint && (
                  <div className="rounded-sm border-2 border-[var(--accent)] px-2 py-1 text-sm font-bold text-[var(--accent)]">
                    Target {hint}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {Array.from({ length: exercise.sets }, (_, i) => {
                  const key = `${exercise.id}-${i}`;
                  const entry = entryMap.get(key);
                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-sm bg-[var(--bg-muted)] p-2 sm:grid-cols-[3rem_1fr_1fr_auto_auto]"
                    >
                      <span className="font-display text-2xl text-[var(--accent)]">
                        {i + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="h-10 w-10 rounded-sm border-2 border-[var(--border)] bg-[var(--bg-elevated)] text-lg font-bold"
                          onClick={() => bumpWeight(exercise, i, -5)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="lb"
                          value={entry?.weight ?? ''}
                          onChange={(e) =>
                            updateSet(exercise, i, {
                              weight: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="w-full min-w-0 rounded-sm border-2 border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-2 text-center text-lg font-bold"
                        />
                        <button
                          type="button"
                          className="h-10 w-10 rounded-sm border-2 border-[var(--border)] bg-[var(--bg-elevated)] text-lg font-bold"
                          onClick={() => bumpWeight(exercise, i, 5)}
                        >
                          +
                        </button>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="reps"
                        value={entry?.reps ?? ''}
                        onChange={(e) =>
                          updateSet(exercise, i, {
                            reps: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        className="w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-2 text-center text-lg font-bold"
                      />
                      {i > 0 && (
                        <button
                          type="button"
                          className="hidden rounded-sm border-2 border-[var(--border)] px-2 py-2 text-xs font-bold uppercase sm:block"
                          onClick={() => copyPrev(exercise, i)}
                        >
                          Copy
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          updateSet(exercise, i, {
                            done: !entry?.done,
                            weight: entry?.weight ?? null,
                            reps: entry?.reps ?? parseRepHint(exercise.reps),
                          })
                        }
                        className={[
                          'rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-wide',
                          entry?.done
                            ? 'bg-[var(--success)] text-white'
                            : 'border-2 border-[var(--border)] bg-[var(--bg-elevated)]',
                        ].join(' ')}
                      >
                        {entry?.done ? 'Done' : 'Mark'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
