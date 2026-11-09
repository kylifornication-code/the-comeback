import { useRef, useState } from 'react';
import { useComebackStore } from '../app/store';
import { withGeneratedSchedule } from '../lib/schedule';
import type { LoadValue, Plan, TrackedLift } from '../types/plan';

function loadToInput(value: LoadValue): string {
  if (typeof value === 'number') return String(value);
  return value;
}

function inputToLoad(value: string): LoadValue {
  if (value === 'deload' || value === 'assess') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function PlanEditor() {
  const plan = useComebackStore((s) => s.plan);
  const setPlan = useComebackStore((s) => s.setPlan);
  const exportData = useComebackStore((s) => s.exportData);
  const importData = useComebackStore((s) => s.importData);
  const resetToSeed = useComebackStore((s) => s.resetToSeed);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function patchPlan(updater: (draft: Plan) => Plan) {
    setPlan(updater(structuredClone(plan)));
  }

  function downloadExport() {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `the-comeback-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded.');
  }

  async function onImportFile(file: File) {
    try {
      const text = await file.text();
      importData(text);
      setMessage('Import successful.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed.');
    }
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className="font-display text-4xl text-[var(--accent)]">Plan editor</h2>
        <p className="text-[var(--text-muted)]">
          Tweak this cycle or shape the next one. Saving regenerates the calendar schedule from
          weekdays unless you already moved sessions.
        </p>
      </div>

      {message && (
        <div className="rounded-sm border-2 border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-elevated))] px-3 py-2 text-sm font-semibold">
          {message}
        </div>
      )}

      <section className="aj-panel space-y-3 rounded-sm p-4">
        <h3 className="font-display text-2xl">Cycle</h3>
        <label className="block text-sm font-semibold">
          Name
          <input
            value={plan.name}
            onChange={(e) => patchPlan((p) => ({ ...p, name: e.target.value }))}
            className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg)] px-3 py-2"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Start
            <input
              type="date"
              value={plan.startDate}
              onChange={(e) =>
                patchPlan((p) =>
                  withGeneratedSchedule({
                    ...p,
                    startDate: e.target.value,
                    schedule: [],
                  }),
                )
              }
              className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            End
            <input
              type="date"
              value={plan.endDate}
              onChange={(e) =>
                patchPlan((p) =>
                  withGeneratedSchedule({
                    ...p,
                    endDate: e.target.value,
                    schedule: [],
                  }),
                )
              }
              className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg)] px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="aj-panel space-y-3 rounded-sm p-4">
        <h3 className="font-display text-2xl">Goals</h3>
        <div className="space-y-3">
          {plan.goals.map((goal, idx) => (
            <div key={goal.id} className="grid gap-2 rounded-sm bg-[var(--bg-muted)] p-3 sm:grid-cols-3">
              <label className="text-sm font-semibold">
                Lift
                <input
                  value={goal.label}
                  onChange={(e) =>
                    patchPlan((p) => {
                      const goals = [...p.goals];
                      goals[idx] = { ...goal, label: e.target.value };
                      return { ...p, goals };
                    })
                  }
                  className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5"
                />
              </label>
              <label className="text-sm font-semibold">
                Start load
                <input
                  type="number"
                  value={goal.startLoad}
                  onChange={(e) =>
                    patchPlan((p) => {
                      const goals = [...p.goals];
                      goals[idx] = { ...goal, startLoad: Number(e.target.value) };
                      return { ...p, goals };
                    })
                  }
                  className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5"
                />
              </label>
              <label className="text-sm font-semibold">
                1RM goal
                <input
                  type="number"
                  value={goal.target1RM}
                  onChange={(e) =>
                    patchPlan((p) => {
                      const goals = [...p.goals];
                      goals[idx] = { ...goal, target1RM: Number(e.target.value) };
                      return { ...p, goals };
                    })
                  }
                  className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="aj-panel space-y-3 rounded-sm p-4">
        <h3 className="font-display text-2xl">Weekly loads</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--border)] text-left">
                <th className="p-2">Wk</th>
                <th className="p-2">Monday</th>
                <th className="p-2">Phase</th>
                <th className="p-2">Bench</th>
                <th className="p-2">Squat</th>
                <th className="p-2">Deadlift</th>
                <th className="p-2">Clean</th>
              </tr>
            </thead>
            <tbody>
              {plan.weeks.map((week, idx) => (
                <tr key={week.week} className="border-b border-[var(--border)]">
                  <td className="p-2 font-bold">{week.week}</td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={week.startMonday}
                      onChange={(e) =>
                        patchPlan((p) => {
                          const weeks = [...p.weeks];
                          weeks[idx] = { ...week, startMonday: e.target.value };
                          return { ...p, weeks };
                        })
                      }
                      className="w-full rounded-sm border border-[var(--border)] bg-[var(--bg)] px-1 py-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={week.phase}
                      onChange={(e) =>
                        patchPlan((p) => {
                          const weeks = [...p.weeks];
                          weeks[idx] = {
                            ...week,
                            phase: e.target.value as typeof week.phase,
                          };
                          return { ...p, weeks };
                        })
                      }
                      className="w-full rounded-sm border border-[var(--border)] bg-[var(--bg)] px-1 py-1"
                    />
                  </td>
                  {(['bench', 'squat', 'deadlift', 'clean'] as TrackedLift[]).map((lift) => (
                    <td key={lift} className="p-2">
                      <input
                        value={loadToInput(week.loads[lift])}
                        onChange={(e) =>
                          patchPlan((p) => {
                            const weeks = [...p.weeks];
                            weeks[idx] = {
                              ...week,
                              loads: {
                                ...week.loads,
                                [lift]: inputToLoad(e.target.value),
                              },
                            };
                            return { ...p, weeks };
                          })
                        }
                        className="w-full rounded-sm border border-[var(--border)] bg-[var(--bg)] px-1 py-1"
                        placeholder="lb / deload / assess"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="aj-panel space-y-3 rounded-sm p-4">
        <h3 className="font-display text-2xl">Templates</h3>
        {plan.templates.map((template, tIdx) => (
          <div key={template.id} className="rounded-sm border-2 border-[var(--border)] p-3">
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Name
                <input
                  value={template.name}
                  onChange={(e) =>
                    patchPlan((p) => {
                      const templates = [...p.templates];
                      templates[tIdx] = { ...template, name: e.target.value };
                      return withGeneratedSchedule({ ...p, templates, schedule: [] });
                    })
                  }
                  className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
                />
              </label>
              <label className="text-sm font-semibold">
                Weekday (1=Mon … 7=Sun)
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={template.weekday}
                  onChange={(e) =>
                    patchPlan((p) => {
                      const templates = [...p.templates];
                      templates[tIdx] = {
                        ...template,
                        weekday: Number(e.target.value),
                      };
                      return withGeneratedSchedule({ ...p, templates, schedule: [] });
                    })
                  }
                  className="mt-1 w-full rounded-sm border-2 border-[var(--border)] bg-[var(--bg)] px-2 py-1.5"
                />
              </label>
            </div>
            <div className="space-y-2">
              {template.exercises.map((exercise, eIdx) => (
                <div
                  key={exercise.id}
                  className="grid gap-2 rounded-sm bg-[var(--bg-muted)] p-2 sm:grid-cols-4"
                >
                  <input
                    value={exercise.name}
                    onChange={(e) =>
                      patchPlan((p) => {
                        const templates = structuredClone(p.templates);
                        templates[tIdx].exercises[eIdx].name = e.target.value;
                        return { ...p, templates };
                      })
                    }
                    className="rounded-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1"
                  />
                  <input
                    type="number"
                    value={exercise.sets}
                    onChange={(e) =>
                      patchPlan((p) => {
                        const templates = structuredClone(p.templates);
                        templates[tIdx].exercises[eIdx].sets = Number(e.target.value);
                        return { ...p, templates };
                      })
                    }
                    className="rounded-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1"
                    aria-label="Sets"
                  />
                  <input
                    value={exercise.reps}
                    onChange={(e) =>
                      patchPlan((p) => {
                        const templates = structuredClone(p.templates);
                        templates[tIdx].exercises[eIdx].reps = e.target.value;
                        return { ...p, templates };
                      })
                    }
                    className="rounded-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1"
                    aria-label="Reps"
                  />
                  <input
                    value={exercise.cue}
                    onChange={(e) =>
                      patchPlan((p) => {
                        const templates = structuredClone(p.templates);
                        templates[tIdx].exercises[eIdx].cue = e.target.value;
                        return { ...p, templates };
                      })
                    }
                    className="rounded-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1"
                    aria-label="Cue"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="aj-panel flex flex-wrap gap-2 rounded-sm p-4">
        <button
          type="button"
          onClick={downloadExport}
          className="rounded-sm bg-[var(--accent)] px-4 py-2 font-bold uppercase tracking-wide text-white"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-sm border-2 border-[var(--border)] px-4 py-2 font-bold uppercase tracking-wide"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset plan and wipe all logged workouts?')) {
              resetToSeed();
              setMessage('Reset to seeded 12-week plan.');
            }
          }}
          className="rounded-sm border-2 border-[var(--accent)] px-4 py-2 font-bold uppercase tracking-wide text-[var(--accent)]"
        >
          Reset to seed
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImportFile(file);
            e.target.value = '';
          }}
        />
      </section>
    </div>
  );
}
