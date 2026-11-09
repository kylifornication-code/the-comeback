import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { useMemo, useState } from 'react';
import { useComebackStore } from '../app/store';
import { getTemplateForDate, getWeekForDate } from '../lib/schedule';

export function CalendarView() {
  const plan = useComebackStore((s) => s.plan);
  const logs = useComebackStore((s) => s.logs);
  const setView = useComebackStore((s) => s.setView);
  const [cursor, setCursor] = useState(() => startOfMonth(parseISO(plan.startDate)));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const loggedDates = useMemo(
    () => new Set(logs.filter((l) => l.entries.some((e) => e.done)).map((l) => l.date)),
    [logs],
  );

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-sm border-2 border-[var(--border)] px-3 py-1 font-semibold"
          onClick={() => setCursor((c) => subMonths(c, 1))}
        >
          Prev
        </button>
        <h2 className="font-display text-3xl tracking-wide text-[var(--text)] sm:text-4xl">
          {format(cursor, 'MMMM yyyy')}
        </h2>
        <button
          type="button"
          className="rounded-sm border-2 border-[var(--border)] px-3 py-1 font-semibold"
          onClick={() => setCursor((c) => addMonths(c, 1))}
        >
          Next
        </button>
      </div>

      <div className="aj-panel overflow-hidden rounded-sm">
        <div className="aj-stripe h-2" />
        <div className="grid grid-cols-7 border-b-2 border-[var(--border)] bg-[var(--bg-muted)] text-center text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="px-1 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const template = getTemplateForDate(plan, dateKey);
            const week = getWeekForDate(plan, dateKey);
            const inMonth = isSameMonth(day, cursor);
            const today = isSameDay(day, new Date());
            const done = loggedDates.has(dateKey);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setView({ name: 'day', date: dateKey })}
                className={[
                  'min-h-24 border-r border-b border-[var(--border)] p-2 text-left transition',
                  inMonth ? 'bg-[var(--bg-elevated)]' : 'bg-[var(--bg-muted)]/50 opacity-60',
                  today ? 'ring-2 ring-inset ring-[var(--accent)]' : '',
                  template ? 'hover:bg-[color-mix(in_srgb,var(--accent)_8%,var(--bg-elevated))]' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm font-bold">{format(day, 'd')}</span>
                  {done && (
                    <span className="rounded-sm bg-[var(--success)] px-1 text-[10px] font-bold uppercase text-white">
                      Done
                    </span>
                  )}
                </div>
                {template && (
                  <div className="mt-2 space-y-1">
                    <div className="font-display text-lg leading-none text-[var(--accent)]">
                      {template.name}
                    </div>
                    {week && (
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        W{week.week} · {week.phase}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        Tap a training day to log lifts. Rest days open an empty session view if you need a makeup day.
      </p>
    </div>
  );
}
