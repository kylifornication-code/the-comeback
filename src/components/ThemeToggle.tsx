import { useComebackStore } from '../app/store';

export function ThemeToggle() {
  const theme = useComebackStore((s) => s.theme);
  const setTheme = useComebackStore((s) => s.setTheme);
  const next = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="rounded-sm border-2 border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-[var(--text)] transition hover:border-[var(--accent)]"
      aria-label={`Switch to ${next} mode`}
    >
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
}
