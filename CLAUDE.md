# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Openclaw Dashboard** — an admin dashboard for operating and managing Openclaw agents, workflows, and tasks. The goal is a single, all-encompassing management interface with full insight into all Openclaw system operations, file structure, agents, and running tasks.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server (localhost:5173)
npm run build      # TypeScript check + production build (dist/)
npm run preview    # preview production build locally
```

## Architecture

**Stack:** React 18 + TypeScript, Vite, Tailwind CSS, React Router v6, Lucide React (icons).

**Layout model:** A persistent shell wraps all pages via React Router's `<Outlet>` pattern.
- `Topbar` — fixed 56px header spanning full width (brand, search, system status, user)
- `Sidebar` — fixed 220px left nav (`NavLink` per section, active state highlighted)
- `main` — offset by sidebar/topbar, renders the current route's page component

```
src/
├── components/layout/   # Shell: Layout.tsx, Topbar.tsx, Sidebar.tsx
├── pages/               # One file per sidebar section
│   ├── Dashboard.tsx    # Overview: stat cards, active tasks, agent status, recent ops
│   ├── Agents.tsx       # Agent cards with expand/collapse, status filters, controls
│   ├── Workflows.tsx    # Workflow list with progress, agent membership, run/pause
│   ├── Tasks.tsx        # Sortable/filterable task table with progress bars
│   ├── FileSystem.tsx   # Recursive file tree + detail panel
│   ├── Operations.tsx   # Live operation log with level filters, expandable details
│   └── Settings.tsx     # System config: API keys, notifications, storage, security
├── types/index.ts       # Shared TypeScript interfaces (Agent, Task, Workflow, etc.)
└── data/mock.ts         # Mock data — replace with real API calls as backend develops
```

**Routing:** All routes live under the `/` parent route handled by `Layout`. Navigate to a page by pushing to `/dashboard`, `/agents`, `/workflows`, `/tasks`, `/files`, `/operations`, `/settings`.

**Styling conventions:** Dark theme using custom CSS variables as Tailwind colors (`oc-bg`, `oc-surface`, `oc-border`, `oc-hover`). Literal hex values `#080b12`, `#0e1320`, `#1a2236`, `#141c2e` are used for the core surface stack. All status/priority/level states have a consistent `{ badge, dot/iconColor, ... }` config object pattern per page.

## Extending the Dashboard

- **New sidebar section:** Add entry to `navItems` in `Sidebar.tsx` → create `src/pages/NewPage.tsx` → add `<Route>` in `App.tsx`.
- **Real API integration:** Replace imports from `../data/mock` with `fetch`/`useEffect` hooks or a data-fetching library. All page components are already typed against `src/types/index.ts`.
- **Shared UI components:** Place reusable primitives (buttons, badges, modals) in `src/components/ui/`.
