export type TrackedLift = 'bench' | 'squat' | 'deadlift' | 'clean';

export type Phase =
  | 'Foundation'
  | 'Deload'
  | 'Strength'
  | 'Intensify'
  | 'Test / assess';

export type LoadValue = number | 'deload' | 'assess';

export interface Goal {
  id: string;
  lift: TrackedLift;
  label: string;
  startLoad: number;
  target1RM: number;
  unit: 'lb';
}

export interface WeekLoads {
  bench: LoadValue;
  squat: LoadValue;
  deadlift: LoadValue;
  clean: LoadValue;
}

export interface PlanWeek {
  week: number;
  startMonday: string;
  phase: Phase;
  loads: WeekLoads;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  cue: string;
  trackedLift?: TrackedLift;
  optional?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  /** 1 = Monday … 7 = Sunday */
  weekday: number;
  exercises: Exercise[];
}

export interface ScheduleEntry {
  date: string;
  templateId: string;
}

export interface Plan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goals: Goal[];
  weeks: PlanWeek[];
  templates: WorkoutTemplate[];
  schedule: ScheduleEntry[];
}

export interface SetEntry {
  exerciseId: string;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  done: boolean;
}

export interface WorkoutLog {
  id: string;
  date: string;
  templateId: string;
  entries: SetEntry[];
}

export type AppView =
  | { name: 'calendar' }
  | { name: 'day'; date: string }
  | { name: 'progress' }
  | { name: 'plan' };
