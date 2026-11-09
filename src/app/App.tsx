import { useEffect } from 'react';
import { CalendarView } from '../components/CalendarView';
import { DayWorkout } from '../components/DayWorkout';
import { PlanEditor } from '../components/PlanEditor';
import { ProgressCharts } from '../components/ProgressCharts';
import { ThemeToggle } from '../components/ThemeToggle';
import { useComebackStore } from './store';

const nav = [
  { id: 'calendar' as const, label: 'Calendar' },
  { id: 'progress' as const, label: 'Progress' },
  { id: 'plan' as const, label: 'Plan' },
];

export default function App() {
  const hydrated = useComebackStore((s) => s.hydrated);
  const view = useComebackStore((s) => s.view);
  const setView = useComebackStore((s) => s.setView);
  const theme = useComebackStore((s) => s.theme);
  const setHydrated = useComebackStore((s) => s.setHydrated);
  const plan = useComebackStore((s) => s.plan);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Fallback if persist finishes without firing (rare / private mode)
    const t = window.setTimeout(() => {
      if (!useComebackStore.getState().hydrated) setHydrated(true);
    }, 400);
    return () => window.clearTimeout(t);
  }, [theme, setHydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="aj-panel rounded-sm px-8 py-6 text-center">
          <div className="aj-stripe mb-4 h-2 w-40" />
          <p className="font-display text-4xl text-[var(--accent)]">THE COMEBACK</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Loading the floor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <header className="aj-panel mb-6 overflow-hidden rounded-sm">
        <div className="aj-stripe h-3" />
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--text-muted)]">
              Average Joe&apos;s Gym
            </p>
            <h1 className="font-display text-6xl leading-none text-[var(--accent)] sm:text-7xl">
              THE COMEBACK
            </h1>
            <p className="mt-2 max-w-xl text-[var(--text-muted)]">{plan.name}</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex flex-wrap gap-2 border-t-2 border-[var(--border)] bg-[var(--bg-muted)] p-3">
          {nav.map((item) => {
            const active =
              view.name === item.id || (item.id === 'calendar' && view.name === 'day');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView({ name: item.id })}
                className={[
                  'rounded-sm px-4 py-2 font-display text-2xl tracking-wide transition',
                  active
                    ? 'bg-[var(--accent)] text-white'
                    : 'border-2 border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)]',
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main>
        {view.name === 'calendar' && <CalendarView />}
        {view.name === 'day' && <DayWorkout date={view.date} />}
        {view.name === 'progress' && <ProgressCharts />}
        {view.name === 'plan' && <PlanEditor />}
      </main>
    </div>
  );
}
