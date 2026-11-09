import { openDB, type IDBPDatabase } from 'idb';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { createSeedPlan } from '../data/seed-plan';
import { moveWorkout, withGeneratedSchedule } from '../lib/schedule';
import type { AppView, Plan, SetEntry, WorkoutLog } from '../types/plan';

type ThemeMode = 'light' | 'dark';

interface ComebackState {
  hydrated: boolean;
  theme: ThemeMode;
  view: AppView;
  plan: Plan;
  logs: WorkoutLog[];
  setHydrated: (value: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setView: (view: AppView) => void;
  setPlan: (plan: Plan) => void;
  updatePlan: (updater: (plan: Plan) => Plan) => void;
  moveSession: (fromDate: string, toDate: string) => void;
  upsertSet: (
    date: string,
    templateId: string,
    entry: SetEntry,
  ) => void;
  getLog: (date: string) => WorkoutLog | undefined;
  exportData: () => string;
  importData: (json: string) => void;
  resetToSeed: () => void;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (typeof indexedDB === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB('the-comeback', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      },
    });
  }
  return dbPromise;
}

const idbStorage: StateStorage = {
  getItem: async (name) => {
    const db = getDb();
    if (!db) return null;
    return (await (await db).get('kv', name)) ?? null;
  },
  setItem: async (name, value) => {
    const db = getDb();
    if (!db) return;
    await (await db).put('kv', value, name);
  },
  removeItem: async (name) => {
    const db = getDb();
    if (!db) return;
    await (await db).delete('kv', name);
  },
};

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem('the-comeback-theme', theme);
  } catch {
    /* ignore */
  }
}

export const useComebackStore = create<ComebackState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      theme: 'light',
      view: { name: 'calendar' },
      plan: createSeedPlan(),
      logs: [],
      setHydrated: (value) => set({ hydrated: value }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setView: (view) => set({ view }),
      setPlan: (plan) => set({ plan: withGeneratedSchedule(plan) }),
      updatePlan: (updater) =>
        set((state) => ({ plan: withGeneratedSchedule(updater(state.plan)) })),
      moveSession: (fromDate, toDate) =>
        set((state) => ({
          plan: {
            ...state.plan,
            schedule: moveWorkout(state.plan.schedule, fromDate, toDate),
          },
        })),
      upsertSet: (date, templateId, entry) =>
        set((state) => {
          const existing = state.logs.find((l) => l.date === date);
          if (!existing) {
            const log: WorkoutLog = {
              id: `log-${date}`,
              date,
              templateId,
              entries: [entry],
            };
            return { logs: [...state.logs, log] };
          }

          const entries = [...existing.entries];
          const idx = entries.findIndex(
            (e) => e.exerciseId === entry.exerciseId && e.setIndex === entry.setIndex,
          );
          if (idx >= 0) entries[idx] = entry;
          else entries.push(entry);

          return {
            logs: state.logs.map((l) =>
              l.date === date ? { ...l, templateId, entries } : l,
            ),
          };
        }),
      getLog: (date) => get().logs.find((l) => l.date === date),
      exportData: () =>
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            plan: get().plan,
            logs: get().logs,
            theme: get().theme,
          },
          null,
          2,
        ),
      importData: (json) => {
        const data = JSON.parse(json) as {
          plan?: Plan;
          logs?: WorkoutLog[];
          theme?: ThemeMode;
        };
        if (!data.plan) throw new Error('Missing plan in import');
        set({
          plan: withGeneratedSchedule(data.plan),
          logs: data.logs ?? [],
          theme: data.theme ?? get().theme,
        });
        if (data.theme) applyTheme(data.theme);
      },
      resetToSeed: () =>
        set({
          plan: createSeedPlan(),
          logs: [],
          view: { name: 'calendar' },
        }),
    }),
    {
      name: 'the-comeback-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        theme: state.theme,
        plan: state.plan,
        logs: state.logs,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
          state.setHydrated(true);
        }
      },
    },
  ),
);
