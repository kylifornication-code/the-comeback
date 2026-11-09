import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useComebackStore } from '../app/store';
import { bestWorkingWeight, goalProgress } from '../lib/stats';

export function ProgressCharts() {
  const plan = useComebackStore((s) => s.plan);
  const logs = useComebackStore((s) => s.logs);

  return (
    <div className="animate-fade-up space-y-4">
      <div>
        <h2 className="font-display text-4xl text-[var(--accent)]">Goal board</h2>
        <p className="text-[var(--text-muted)]">
          Working-set tops for each tracked lift vs your January targets.
        </p>
      </div>

      <div className="grid gap-4">
        {plan.goals.map((goal) => {
          const points = bestWorkingWeight(logs, plan, goal.lift);
          const { latest, pct } = goalProgress(goal, points);
          const chartData =
            points.length > 0
              ? points
              : [{ date: plan.startDate, weight: goal.startLoad, reps: 10 }];

          return (
            <section key={goal.id} className="aj-panel rounded-sm p-4">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="font-display text-3xl">{goal.label}</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Start {goal.startLoad} lb · Goal {goal.target1RM} lb 1RM
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl text-[var(--accent)]">{latest} lb</div>
                  <div className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
                    {pct.toFixed(0)}% of path
                  </div>
                </div>
              </div>

              <div className="mb-3 h-2 overflow-hidden rounded-sm bg-[var(--bg-muted)]">
                <div
                  className="h-full bg-[var(--accent)] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11 }}
                      stroke="var(--text-muted)"
                      width={42}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '2px solid var(--border)',
                        borderRadius: 2,
                      }}
                    />
                    <ReferenceLine
                      y={goal.target1RM}
                      stroke="var(--accent)"
                      strokeDasharray="4 4"
                      label={{ value: '1RM goal', fill: 'var(--accent)', fontSize: 11 }}
                    />
                    <ReferenceLine
                      y={goal.startLoad}
                      stroke="var(--text-muted)"
                      strokeDasharray="2 2"
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="var(--accent)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'var(--accent)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
