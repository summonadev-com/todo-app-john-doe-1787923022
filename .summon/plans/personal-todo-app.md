---
status: implemented
title: Personal Todo App with Due Dates and In-App Reminders
---

## Context

The project directory is currently empty — no `package.json`, no `src/`. Step 1 therefore establishes the standard app shell before any feature work. All later steps assume the conventions listed below.

Conventions to follow throughout:
- All source under `src/`, imports via the `@/` alias (never relative `../../`).
- Routes are file-based in `src/routes/`; `src/routeTree.gen.ts` is generated and must never be hand-edited.
- Styling is Tailwind utility classes only; `src/styles/global.css` contains exactly `@import "tailwindcss";` and is imported once in `src/main.tsx`.

## Non-goals (v1)

Explicitly out of scope — do not build, do not stub UI for:
1. Accounts, login, multi-user, sharing.
2. Any backend, database, or network requests.
3. Projects, folders, tags/labels, priorities.
4. Subtasks / checklists.
5. Recurring tasks.
6. Statistics, streaks, charts, productivity reports.
7. Push notifications while the app is closed. This is technically impossible without a backend (a push service requires a server to send messages to the browser's push endpoint). v1 supports only in-app reminder surfacing plus optional `Notification` API alerts that fire while a tab is open.
8. Drag-and-drop manual reordering (sorting is derived from due date).

---

## Steps

1. **Scaffold the application shell.**
   Create `package.json` (npm, ESM, `type: "module"`) with React, TypeScript, Vite, `@tanstack/react-router`, `@tanstack/router-plugin`, `tailwindcss`, `@tailwindcss/vite`. Create `vite.config.ts` registering the TanStack Router plugin and the Tailwind Vite plugin, plus the `@/` → `src/` alias. Create `tsconfig.json` (and `tsconfig.node.json` if needed) with matching `paths`. Create `index.html`, `src/main.tsx` (creates the router from the generated route tree, renders it, imports the stylesheet once), and `src/styles/global.css` containing only the Tailwind import. Add `.gitignore`.
   *Outcome:* `npm run dev` serves a blank routed app; `src/routeTree.gen.ts` is generated automatically.

2. **Define shared types.**
   Create `src/types/task.ts` with a `Task` type: `id` (string, uuid), `title` (string, required, trimmed non-empty), `notes` (string, optional), `dueAt` (ISO string or null — a single field storing date and optional time), `hasTime` (boolean, distinguishes "due Friday" from "due Friday 09:00"), `completed` (boolean), `completedAt` (ISO string or null), `createdAt` (ISO string). Also define a `TaskFilter` union: `"today" | "upcoming" | "overdue" | "completed" | "all"`, and a `TaskDraft` type for create/edit form values.
   *Outcome:* one canonical task shape imported everywhere; no ad-hoc inline shapes.

3. **Date helpers.**
   Create `src/lib/date.ts` with pure functions: `startOfToday`, `endOfToday`, `isOverdue(task, now)` (incomplete AND `dueAt` before now; date-only tasks are overdue only after end of their day), `isDueToday`, `isUpcoming` (after today, includes tasks with no due date at the end), `formatDueLabel` (returns "Today 09:00", "Tomorrow", "Overdue · Mon 3 Mar", "No due date"), and `compareByDue` for sorting. Keep all "now" values injected as arguments so the functions are testable and deterministic.
   *Outcome:* all date logic lives in one file; components never compute date math inline.

4. **Local persistence layer.**
   Create `src/lib/storage.ts` exposing `loadTasks()` and `saveTasks(tasks)` against `localStorage` under a versioned key such as `todo.tasks.v1`. `loadTasks` must be defensive: wrap `JSON.parse` in try/catch, validate that the result is an array, drop entries missing `id`/`title`, and return `[]` on any failure rather than throwing. `saveTasks` must swallow quota/private-mode errors. Also store a schema `version` field to make future migrations possible.
   *Outcome:* corrupt or absent storage never white-screens the app.

5. **Task state hook.**
   Create `src/hooks/useTasks.ts` — the single source of truth for task state. It initialises from `loadTasks()` (lazy `useState` initialiser, not an effect, so the first paint already has data), persists to storage in an effect whenever tasks change, and exposes `tasks`, `addTask(draft)`, `updateTask(id, patch)`, `toggleComplete(id)`, `deleteTask(id)`, and `undoDelete()` (holds the last deleted task in a ref for a short-lived undo). IDs come from `crypto.randomUUID()`.
   *Outcome:* tasks survive refresh; all mutations flow through one API.

6. **Share state across routes.**
   Create `src/lib/tasksContext.tsx` with a `TasksProvider` that calls `useTasks` once and a `useTasksContext` consumer hook that throws outside the provider. Wrap the app in the provider inside `src/routes/__root.tsx`.
   *Outcome:* the list route and the reminder watcher read the same state; no duplicated storage writes.

7. **Ticking clock hook.**
   Create `src/hooks/useNow.ts` returning a `Date` that updates on an interval (~30s) and on `visibilitychange`/`focus`, clearing the timer on unmount.
   *Outcome:* a task silently crossing into "Overdue" re-renders without a manual refresh.

8. **Root layout.**
   Create `src/routes/__root.tsx`: page background, centred max-width column, app header with the title and a live "Today / Overdue" count summary, the `TasksProvider`, the reminder watcher (step 15), an `<Outlet />`, and a `NotFound` component for unmatched URLs.
   *Outcome:* consistent chrome on every screen.

9. **Routes / screens.**
   - `src/routes/index.tsx` — the main task list. Reads the active filter from a validated search param (`?filter=today|upcoming|overdue|completed|all`, defaulting to `today`) so filters are linkable and back-button friendly.
   - `src/routes/settings.tsx` — small screen for reminder permission state, an "enable browser notifications" button, a "clear all completed" action, and a "clear all data" action with confirmation.
   *Outcome:* two screens only; the list screen does all core work.

10. **Presentational components.**
    Create under `src/components/`:
    - `QuickAdd.tsx` — always-visible single-line input at the top of the list.
    - `TaskList.tsx` — receives grouped sections and renders headings plus items.
    - `TaskItem.tsx` — checkbox, title, due label, notes indicator, edit and delete buttons.
    - `TaskEditor.tsx` — modal/inline form for title, notes, due date, optional due time, and clear-due-date.
    - `FilterTabs.tsx` — links (not buttons) to each filter, marking the active one.
    - `EmptyState.tsx` — icon slot, headline, sub-line, optional action.
    - `UndoToast.tsx` — transient "Task deleted · Undo" bar.
    *Outcome:* each file has one responsibility and takes props; no component reaches into storage directly.

11. **Add flow (keyboard-first).**
    `QuickAdd` is autofocused on mount. Enter creates the task and keeps focus in the field for rapid entry; Escape clears it. Blank/whitespace-only input is ignored. Include a lightweight natural-language date suffix parser in `src/lib/parseQuickAdd.ts` recognising only `today`, `tomorrow`, weekday names, and `HH:mm` — the matched phrase is stripped from the title and shown as a live "will be due …" hint under the input. Anything unrecognised stays part of the title. A "more options" affordance opens `TaskEditor` prefilled with the typed text.
    *Outcome:* a dated task can be created without touching the mouse.

12. **Edit, complete, delete flows.**
    Clicking a task title (or pressing Enter on a focused row) opens `TaskEditor`; Save patches via `updateTask`, Cancel/Escape discards. The checkbox calls `toggleComplete`, sets `completedAt`, and shows a brief strike-through/fade before the item leaves its group. Delete removes immediately and shows `UndoToast` for ~6 seconds wired to `undoDelete`. Ensure every interactive element is a real `button`/`input`/`a` with a visible focus ring and an accessible label.
    *Outcome:* full CRUD, reversible deletes, fully operable via keyboard.

13. **Filtering, grouping, sorting.**
    Create `src/lib/taskViews.ts` with a pure `selectTasks(tasks, filter, now)` returning ordered sections:
    - `today` → Overdue section first, then Today.
    - `upcoming` → sections by day for the next dated tasks, then "No due date" last.
    - `overdue` → single section, oldest due first.
    - `completed` → most recently completed first.
    - `all` → Overdue, Today, Upcoming, No due date, Completed (collapsed).
    Within a section sort by `dueAt` ascending (timed before date-only on the same day), then `createdAt`. Memoise the call in the route with `useMemo` keyed on tasks, filter, and the ticking now.
    *Outcome:* one tested pure function drives every view; no filtering logic in JSX.

14. **Empty states.**
    Distinct copy per case: no tasks at all ("Nothing here yet — add your first task above"), nothing due today ("You're clear for today"), no overdue ("Nothing overdue — nice"), no upcoming, no completed yet, and an all-filtered-out state. Each renders through `EmptyState`.
    *Outcome:* no blank panels anywhere.

15. **Reminders.**
    Create `src/hooks/useReminders.ts`, mounted once in the root. Primary mechanism is visual: overdue tasks get a red accent border/badge, tasks due within the next hour get an amber accent, and the header count updates live via `useNow`. Optional layer: if `Notification.permission === "granted"`, fire one notification per task as its `dueAt` passes, tracking already-notified IDs in a persisted set (`todo.notified.v1`) so a refresh does not re-alert. Never call `requestPermission()` on load — only from the explicit button in `src/routes/settings.tsx`; handle `denied` and unsupported-API cases by showing an explanatory line and continuing with visual-only reminders.
    *Outcome:* reminders always work visually; notifications are a graceful enhancement that never blocks or nags.

16. **Visual / UX direction (Tailwind).**
    Calm, single-accent, light-first design: neutral `slate`/`zinc` surfaces, one indigo accent for primary actions and the active filter, `red-500` reserved exclusively for overdue, `amber-500` for due-soon. Card-style list with `rounded-xl`, subtle `ring-1 ring-black/5`, generous `py-3` rows, `text-sm` metadata in muted foreground. Content constrained to `max-w-2xl mx-auto px-4`. Mobile-first: filter tabs scroll horizontally, quick-add stays pinned at the top, tap targets ≥44px. Use `transition-colors`/`opacity` for completion feedback and respect `motion-reduce`. Define accent and semantic colours as Tailwind v4 theme tokens in `src/styles/global.css` via `@theme` so `red`/`amber` semantics are named, not scattered.
    *Outcome:* one cohesive look; overdue state is unmistakable at a glance.

17. **Phased build order and milestones.**
    - **M1 — Runs:** steps 1–2. Blank routed app boots, types defined.
    - **M2 — Persists:** steps 3–6. Tasks can be added from a throwaway input and survive a hard refresh.
    - **M3 — Core CRUD:** steps 9–12 (list route, components, add/edit/complete/delete + undo).
    - **M4 — Due-date views:** steps 7, 13, 14. Filters, grouping, sorting, empty states all working.
    - **M5 — Reminders:** step 15 plus the settings route.
    - **M6 — Polish:** step 16, keyboard pass, mobile pass, defensive-storage sanity check (manually corrupt the localStorage value and confirm the app still loads).
    *Outcome:* each milestone is independently demoable.

18. **Adding sync later (note, not v1 work).**
    The design keeps this cheap: `src/lib/storage.ts` is the only module that touches `localStorage`, and `src/hooks/useTasks.ts` is the only mutation surface. To add sync you would (a) swap `storage.ts` for an async client and make `useTasks` handle loading/error states, likely via TanStack Query, (b) add `updatedAt` and a soft-delete `deletedAt` to `Task` for last-write-wins conflict resolution, (c) replace `crypto.randomUUID()` client IDs with server-reconciled IDs or keep client UUIDs as the primary key, (d) add auth and a user scope, and (e) only then move reminders server-side with Web Push so notifications fire with the app closed. No component or view logic would need to change.
