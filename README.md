# THE COMEBACK

Personal workout tracker styled like Average Joe’s Gym — calendar-first logging, goal charts, and a simple plan editor.

## Stack

- Astro 7 + React 19 + TypeScript
- Tailwind CSS 4
- Zustand + IndexedDB persistence
- Recharts for progress trends
- Static deploy on Vercel

## Requirements

- Node.js `>= 22.23.4` (see `.nvmrc`)

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH" # if needed on Apple Silicon Homebrew
node -v
```

## Local development

```bash
npm install
npm run dev
```

Open the URL Astro prints (usually `http://localhost:4321`).

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

1. Push this repo to GitHub (or import the folder in the Vercel dashboard).
2. Framework preset: **Astro** (or rely on `vercel.json`).
3. Install / build commands: `npm install` / `npm run build`.
4. Output directory: `dist`.

Or with the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## What’s included

- Seeded **12-week push/pull strength plan** (Nov 9, 2026 – Jan 31, 2027)
- Calendar navigation with workout days marked
- Fast set logging (±5 lb, copy previous set, mark done)
- Move / swap workouts between days
- Goal progress charts (bench, squat, deadlift, clean)
- In-app plan editor + JSON export/import
- Light / dark mode

Data stays in the browser (IndexedDB). Use **Plan → Export JSON** to back up or move devices.
