# SPEC.md — Openclaw Dashboard

Full system specification for building the Openclaw admin dashboard from its current UI scaffold into a production-ready application connected to the Openclaw gateway.

---

## 1. Project Overview

**Openclaw Dashboard** is an admin UI for operating and monitoring the Openclaw agentic system. It provides full visibility into agents, tasks, workflows, the system file structure, and all system operations.

**Current state:** All UI is fully built with mock data imported from `src/data/mock.ts`. Every page renders correctly but no real data flows in and no actions are wired to a backend.

**Goals for implementation:**
1. Authenticate users to the dashboard with a secure login flow
2. Connect all pages to live data from the Openclaw gateway API
3. Enable interactive workflow creation, editing, and management

**Non-goals:**
- Mobile/responsive layouts
- Multi-tenant support
- Third-party identity providers (OAuth/SSO)

**Deployment context:** The dashboard is served by the same server process as the Openclaw gateway. All API calls are same-origin (`/api/...`). This enables secure httpOnly cookie auth — no tokens ever touch JavaScript.

---

## 2. Directory Structure

The following directories are **added** to the existing `src/` tree. No existing files are deleted; they are modified in-place.

```
src/
├── api/                          # API layer — one module per resource
│   ├── client.ts                 # Base request function used by all modules
│   ├── auth.api.ts               # login, logout, refresh, getMe
│   ├── agents.api.ts             # CRUD + control actions for agents
│   ├── tasks.api.ts              # Task queries + cancel action
│   ├── workflows.api.ts          # Workflow CRUD + run/pause/history
│   ├── operations.api.ts         # Operation log queries
│   ├── files.api.ts              # File tree queries
│   └── settings.api.ts           # Settings get + update
│
├── auth/                         # Authentication infrastructure
│   ├── AuthContext.tsx           # React context type definition
│   ├── AuthProvider.tsx          # Context provider with state + methods
│   ├── useAuth.ts                # Hook to read auth context
│   └── ProtectedRoute.tsx        # Route guard component
│
├── hooks/                        # Data-fetching hooks (one per resource)
│   ├── useAgents.ts
│   ├── useTasks.ts
│   ├── useWorkflows.ts
│   ├── useOperations.ts
│   ├── useFileTree.ts
│   └── useSettings.ts
│
├── ws/                           # WebSocket layer
│   ├── wsClient.ts               # Connection manager class
│   └── useOperationsStream.ts    # React hook for live event stream
│
├── components/
│   ├── layout/                   # Existing: Layout.tsx, Topbar.tsx, Sidebar.tsx
│   ├── ui/                       # Shared primitives (all new)
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBanner.tsx
│   │   ├── Modal.tsx
│   │   └── ConfirmDialog.tsx
│   └── workflow/                 # Workflow builder sub-components (all new)
│       ├── AgentSelector.tsx
│       ├── StepList.tsx
│       ├── TriggerInput.tsx
│       └── WorkflowBuilderModal.tsx
│
├── pages/
│   ├── Login.tsx                 # NEW — login form page
│   └── [all existing pages]      # MODIFIED — replace mock imports with hooks
│
├── types/
│   └── index.ts                  # EXTENDED — new types added
│
└── utils/
    └── workflow.utils.ts         # NEW — pure utility functions for workflow builder
```

---

## 3. Environment Variables

All environment variables are prefixed with `VITE_` to be accessible in Vite's browser bundle.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE` | `/api` | Base path prepended to all API calls |
| `VITE_WS_PATH` | `/ws` | WebSocket endpoint path |

**Rules:**
- These are stored in `.env.local` (git-ignored, never committed)
- `.env.example` must exist in the repo with placeholder comments so new developers know what to fill in
- `VITE_API_BASE` defaults to `/api` for same-server deployment. Override to `http://localhost:8000/api` for local dev against a remote gateway.
- No secret values (tokens, API keys) should ever appear in any `VITE_*` variable — they would be visible in the browser bundle.

---

## 4. Type System Extensions

All new types are added to `src/types/index.ts`. Existing types are not removed.

### `AuthUser`
```
{
  id: string
  username: string
  role: 'admin'
}
```

### `AuthState`
```
{
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean           // true during initial session check on mount
}
```

### `AuthContextType`
```
{
  authState: AuthState
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
```

### `ApiError`
```
{
  status: number               // HTTP status code
  message: string              // Human-readable message
  code?: string                // Optional machine-readable error code from gateway
}
```

### `SystemSettings`
```
{
  systemName: string
  defaultModel: string
  maxConcurrentTasks: number
  taskTimeoutSeconds: number
  logRetentionDays: number
  outputStoragePath: string
  autoPurgeCompleted: boolean
  requireAuth: boolean
  auditLogging: boolean
  sandboxExecution: boolean
  agentPollingInterval: number   // milliseconds
  maxTokensPerTask: number
  emailAlertsEnabled: boolean
  slackWebhookEnabled: boolean
  alertOnTaskFailure: boolean
  alertOnAgentOffline: boolean
}
```

### `WorkflowStep`
```
{
  id: string                               // unique within workflow
  agentId: string                          // ID of agent to run at this step
  label: string                            // display name for this step
  config: Record<string, unknown>          // agent-specific config key/values
  dependsOn: string[]                      // IDs of steps that must complete first
}
```

### `WorkflowCreatePayload`
```
{
  name: string
  description: string
  trigger: string                          // cron expression or event name
  steps: WorkflowStep[]
}
```

### `WorkflowUpdatePayload`
```
Partial<WorkflowCreatePayload>             // all fields optional for PATCH-like semantics
```

### `WorkflowRun`
```
{
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  startedAt: string                        // ISO 8601
  completedAt?: string                     // ISO 8601, absent if still running
  triggeredBy: string                      // 'cron' | 'manual' | event name
}
```

### `TaskFilters`
```
{
  status?: TaskStatus
  agentId?: string
  workflowId?: string
}
```

### `OperationFilters`
```
{
  level?: LogLevel
  limit?: number
  offset?: number
}
```

### `WsEventType`
```
'operation' | 'agent_status' | 'task_progress'
```

### `WsEvent`
```
{ type: 'operation';     data: Operation }
{ type: 'agent_status';  data: { id: string; status: AgentStatus } }
{ type: 'task_progress'; data: { id: string; progress: number; status: TaskStatus } }
```

---

## 5. Authentication System

### 5a. Overview

The dashboard runs on the same origin as the Openclaw gateway. Authentication uses **httpOnly cookies set by the server** — JavaScript never reads or writes a token.

Two cookies are managed entirely by the server:
- `oc_access` — short-lived JWT (15-minute TTL), `HttpOnly`, `Secure`, `SameSite=Strict`
- `oc_refresh` — long-lived JWT (7-day TTL), `HttpOnly`, `Secure`, `SameSite=Strict`, path `/api/auth/refresh`

### 5b. Login Flow

1. User submits username + password on `/login` page
2. Frontend calls `POST /api/auth/login` with `credentials: 'include'`
3. Server validates credentials, sets `oc_access` and `oc_refresh` cookies in response
4. Response body: `{ user: AuthUser }` — no token in body
5. Frontend stores `user` in `AuthContext` state, navigates to `/dashboard`

### 5c. Session Check on Mount

1. `AuthProvider` mounts → calls `GET /api/auth/me` with `credentials: 'include'`
2. If `200`: set `authState.user` and `isAuthenticated = true`
3. If `401`: set `isAuthenticated = false`, `isLoading = false`
4. `isLoading` is `true` during this check — `ProtectedRoute` shows `<LoadingSpinner />` until resolved

### 5d. Token Refresh (handled inside `apiRequest`)

1. Any API call returns `401`
2. `apiRequest` automatically calls `POST /api/auth/refresh` with `credentials: 'include'`
3. Server reads `oc_refresh` cookie, validates it, rotates both cookies
4. `apiRequest` retries the original request once
5. If `/api/auth/refresh` itself returns `401`: call `logout()` and redirect to `/login`
6. Refresh is only attempted once per original request — no infinite loops

### 5e. Logout Flow

1. User clicks logout
2. Frontend calls `POST /api/auth/logout` with `credentials: 'include'`
3. Server clears both cookies
4. Frontend resets `authState` to `{ user: null, isAuthenticated: false, isLoading: false }`
5. React Router navigates to `/login`

### 5f. CSRF Protection

All mutating requests (POST, PUT, DELETE) include the header:
```
X-Requested-With: XMLHttpRequest
```
The server must validate this header on mutating endpoints. This is defense-in-depth alongside `SameSite=Strict` cookies (which already prevent cross-origin requests from sending cookies on most browsers).

---

## 6. API Client (`src/api/client.ts`)

### Constants
- `API_BASE`: read from `import.meta.env.VITE_API_BASE`, default `'/api'`

### Function: `apiRequest`

**Signature:** `apiRequest<T>(method: string, path: string, body?: unknown): Promise<T>`

**Behavior:**
1. Build full URL: `${API_BASE}${path}`
2. Set headers:
   - `Content-Type: application/json` (if body present)
   - `X-Requested-With: XMLHttpRequest`
3. Set `credentials: 'include'` on all requests
4. If response is `401`: call `refreshRequest()`, then retry the original request once
5. If retry also `401`: call `authContext.logout()` and throw `ApiError` with status `401`
6. If response is not ok (any non-2xx): parse response body as `{ message, code }`, throw `ApiError`
7. Parse and return response body as `T`

**Note:** `apiRequest` needs access to `logout()` from `AuthContext` to handle the refresh-failure case. This means `client.ts` must either import a singleton context reference, or the auth context's `logout` is stored in a module-level variable that `AuthProvider` sets on mount.

---

## 7. Resource API Modules

Each module in `src/api/` exports named async functions. All functions call `apiRequest` — they never call `fetch` directly.

### `src/api/auth.api.ts`

| Function | Method + Path | Returns |
|---|---|---|
| `loginRequest(username, password)` | `POST /auth/login` | `{ user: AuthUser }` |
| `refreshRequest()` | `POST /auth/refresh` | `void` |
| `logoutRequest()` | `POST /auth/logout` | `void` |
| `getMeRequest()` | `GET /auth/me` | `AuthUser` |

### `src/api/agents.api.ts`

| Function | Method + Path | Returns |
|---|---|---|
| `getAgents()` | `GET /agents` | `Agent[]` |
| `getAgent(id)` | `GET /agents/:id` | `Agent` |
| `startAgent(id)` | `POST /agents/:id/start` | `Agent` |
| `stopAgent(id)` | `POST /agents/:id/stop` | `Agent` |
| `restartAgent(id)` | `POST /agents/:id/restart` | `Agent` |

### `src/api/tasks.api.ts`

| Function | Method + Path | Returns |
|---|---|---|
| `getTasks(filters?: TaskFilters)` | `GET /tasks` | `Task[]` |
| `getTask(id)` | `GET /tasks/:id` | `Task` |
| `cancelTask(id)` | `POST /tasks/:id/cancel` | `Task` |

### `src/api/workflows.api.ts`

| Function | Method + Path | Returns |
|---|---|---|
| `getWorkflows()` | `GET /workflows` | `Workflow[]` |
| `getWorkflow(id)` | `GET /workflows/:id` | `Workflow` |
| `createWorkflow(payload)` | `POST /workflows` | `Workflow` |
| `updateWorkflow(id, payload)` | `PUT /workflows/:id` | `Workflow` |
| `deleteWorkflow(id)` | `DELETE /workflows/:id` | `void` |
| `runWorkflow(id)` | `POST /workflows/:id/run` | `Workflow` |
| `pauseWorkflow(id)` | `POST /workflows/:id/pause` | `Workflow` |
| `getWorkflowRuns(id)` | `GET /workflows/:id/runs` | `WorkflowRun[]` |

### `src/api/operations.api.ts`

| Function | Method + Path | Returns |
|---|---|---|
| `getOperations(filters?: OperationFilters)` | `GET /operations` | `Operation[]` |

### `src/api/files.api.ts`

| Function | Method + Path | Returns |
|---|---|---|
| `getFileTree()` | `GET /files` | `FileNode` |
| `getFileNode(path)` | `GET /files?path=<path>` | `FileNode` |

### `src/api/settings.api.ts`

| Function | Method + Path | Returns |
|---|---|---|
| `getSettings()` | `GET /settings` | `SystemSettings` |
| `updateSettings(partial)` | `PUT /settings` | `SystemSettings` |

---

## 8. Gateway REST API Contract

The Openclaw gateway **must** implement the following endpoints. This section is the contract between the dashboard and the backend.

All endpoints are under the `/api` prefix. All requests include `credentials: 'include'` (cookies). Authenticated endpoints reject requests without a valid `oc_access` cookie with `401`.

### Auth Endpoints

```
POST   /api/auth/login
  Body:     { username: string, password: string }
  Response: 200 { user: AuthUser }
            Sets cookies: oc_access (15m), oc_refresh (7d, path=/api/auth/refresh)
            401 { message: "Invalid credentials" }

POST   /api/auth/refresh
  Body:     (none — reads oc_refresh cookie)
  Response: 200 { success: true }
            Rotates both cookies with new TTLs
            401 { message: "Refresh token expired or invalid" }

POST   /api/auth/logout
  Body:     (none)
  Response: 200 { success: true }
            Clears oc_access and oc_refresh cookies (sets Max-Age=0)

GET    /api/auth/me
  Response: 200 AuthUser
            401 (if oc_access missing or expired)
```

### Agent Endpoints

```
GET    /api/agents                     → Agent[]
GET    /api/agents/:id                 → Agent
POST   /api/agents/:id/start           → Agent  (updated status)
POST   /api/agents/:id/stop            → Agent
POST   /api/agents/:id/restart         → Agent
```

### Task Endpoints

```
GET    /api/tasks                      → Task[]
  Query: status?, agentId?, workflowId?

GET    /api/tasks/:id                  → Task
POST   /api/tasks/:id/cancel           → Task  (status set to 'failed')
```

### Workflow Endpoints

```
GET    /api/workflows                  → Workflow[]
GET    /api/workflows/:id              → Workflow
POST   /api/workflows                  → Workflow  (body: WorkflowCreatePayload)
PUT    /api/workflows/:id              → Workflow  (body: WorkflowUpdatePayload)
DELETE /api/workflows/:id              → { success: true }
POST   /api/workflows/:id/run          → Workflow  (status → 'active')
POST   /api/workflows/:id/pause        → Workflow  (status → 'inactive')
GET    /api/workflows/:id/runs         → WorkflowRun[]  (most recent first)
```

### Other Endpoints

```
GET    /api/operations                 → Operation[]
  Query: level?, limit? (default 50), offset? (default 0)

GET    /api/files                      → FileNode  (full tree)
GET    /api/files?path=<path>          → FileNode  (subtree)

GET    /api/settings                   → SystemSettings
PUT    /api/settings                   → SystemSettings  (body: Partial<SystemSettings>)
```

### Error Response Format

All error responses must follow:
```json
{
  "message": "Human-readable description",
  "code": "MACHINE_READABLE_CODE"
}
```

---

## 9. WebSocket Contract

**Path:** `VITE_WS_PATH` (default `/ws`)

**Auth:** Browser sends `oc_access` cookie automatically on WebSocket upgrade (same-origin). Server validates it on the upgrade request. If invalid, server closes with code `4401`.

**Message format (server → client):**
All messages are JSON strings. The `type` field discriminates the payload.

```json
{ "type": "operation",    "data": <Operation> }
{ "type": "agent_status", "data": { "id": "<agentId>", "status": "<AgentStatus>" } }
{ "type": "task_progress","data": { "id": "<taskId>", "progress": 0-100, "status": "<TaskStatus>" } }
```

**Client behavior:**
- Connect on app mount (after auth is confirmed)
- Reconnect on unexpected close with exponential backoff: 1s → 2s → 5s → stop after 3 attempts
- Disconnect cleanly on logout

---

## 10. Data Hooks (`src/hooks/`)

### Shared Pattern

Every hook in `src/hooks/` follows this exact interface:

```
{
  data: T | null
  isLoading: boolean
  error: string | null       // null when no error, error message string otherwise
  refetch: () => void        // manually trigger a new fetch
}
```

### Polling

Hooks that display live system state (`useAgents`, `useTasks`, `useOperations`) poll at the interval defined in `SystemSettings.agentPollingInterval`. Default: `5000` ms.

Polling is implemented with `setInterval` inside a `useEffect`. The interval is cleared on component unmount.

Hooks do not poll while the browser tab is hidden (`document.visibilityState === 'hidden'`) to save resources.

### `useSettings` additions

In addition to the base interface, `useSettings` also exposes:
```
saveSettings: (partial: Partial<SystemSettings>) => Promise<void>
isSaving: boolean
saveError: string | null
```

---

## 11. WebSocket Client (`src/ws/wsClient.ts`)

### Class: `WsClient`

A singleton instance is created at module level and exported as `wsClient`.

**Methods:**

| Method | Description |
|---|---|
| `connect()` | Open WebSocket to `VITE_WS_PATH`. Cookies sent automatically. |
| `disconnect()` | Close connection cleanly (code `1000`). |
| `on(eventType: WsEventType, handler: (data) => void)` | Register event listener |
| `off(eventType: WsEventType, handler: (data) => void)` | Remove event listener |

**Reconnect behavior:**
- On `close` event with code other than `1000` (normal): schedule reconnect
- Backoff delays: `[1000, 2000, 5000]` ms — attempt index maps to delay
- After 3 failed attempts: stop retrying, set `wsClient.status` to `'failed'`
- Successful reconnect resets attempt counter

**Internal state:**
- `status: 'connected' | 'disconnected' | 'reconnecting' | 'failed'`
- `listeners: Map<WsEventType, Set<handler>>`

---

## 12. Auth Infrastructure Components

### `src/auth/AuthContext.tsx`

Exports:
- `AuthContext` — `React.createContext<AuthContextType | null>(null)`

### `src/auth/AuthProvider.tsx`

Props: `{ children: React.ReactNode }`

State:
- `authState: AuthState` — initialized as `{ user: null, isAuthenticated: false, isLoading: true }`

On mount:
1. Call `getMeRequest()`
2. On success: set `authState` to `{ user, isAuthenticated: true, isLoading: false }`
3. On failure: set `authState` to `{ user: null, isAuthenticated: false, isLoading: false }`

Functions provided via context:
- `login(username, password)`: calls `loginRequest`, on success updates `authState`
- `logout()`: calls `logoutRequest`, resets `authState`, disconnects `wsClient`

### `src/auth/useAuth.ts`

Calls `useContext(AuthContext)`. If context is `null` (called outside provider), throws `Error('useAuth must be used within AuthProvider')`.

### `src/auth/ProtectedRoute.tsx`

Reads `authState` from `useAuth()`.
- If `isLoading`: render `<LoadingSpinner />`
- If `!isAuthenticated`: render `<Navigate to="/login" replace />`
- Otherwise: render `<Outlet />`

---

## 13. Shared UI Components (`src/components/ui/`)

### `LoadingSpinner.tsx`

Props: `{ size?: 'sm' | 'md' | 'lg' }` (default: `'md'`)

Renders an animated circular spinner centered in its container. Uses Tailwind `animate-spin`.

### `ErrorBanner.tsx`

Props: `{ message: string; onDismiss?: () => void }`

Renders a red-tinted dismissible banner at the top of a section. If `onDismiss` is provided, shows a close button.

### `Modal.tsx`

Props: `{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }`

Renders via `ReactDOM.createPortal` into `document.body`. Includes:
- Dark overlay (`bg-black/60`)
- Centered panel with title and close button
- Closes on overlay click or Escape key

### `ConfirmDialog.tsx`

Props: `{ isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; isDestructive?: boolean }`

Uses `Modal` internally. Shows `message` and two buttons: cancel (gray) and confirm (red if `isDestructive`, blue otherwise).

---

## 14. Workflow Builder Components (`src/components/workflow/`)

### `AgentSelector.tsx`

Props:
```
{
  agents: Agent[]
  selectedIds: string[]
  onToggle: (agentId: string) => void
}
```

Renders a searchable list of agents. Each row shows:
- Status dot (color from `AgentStatus`)
- Agent name
- Agent type badge
- Checkbox or highlight if selected

Internal state: `searchQuery: string`

Filters `agents` by `name.toLowerCase().includes(searchQuery.toLowerCase())` or `type`.

### `StepList.tsx`

Props:
```
{
  steps: WorkflowStep[]
  agents: Agent[]                          // for resolving agent name from step.agentId
  onReorder: (fromIndex: number, toIndex: number) => void
  onRemove: (stepId: string) => void
}
```

Each step renders as a draggable row using HTML5 drag-and-drop API:
- `draggable={true}` on each row
- `onDragStart`: set `dragIndex` in local state
- `onDragOver`: prevent default
- `onDrop`: call `onReorder(dragIndex, dropIndex)`

Row content: drag handle icon (left) | step number + agent name (center) | remove button (right).

### `TriggerInput.tsx`

Props: `{ value: string; onChange: (value: string) => void }`

Internal state: `mode: 'cron' | 'event'`

- Cron mode: text input with hint label `"e.g. 0 8 * * 1 (Every Monday at 08:00 UTC)"`
- Event mode: text input with hint label `"e.g. new-document-submitted"`
- Toggle button switches between modes and clears `value`

### `WorkflowBuilderModal.tsx`

Props:
```
{
  isOpen: boolean
  onClose: () => void
  existingWorkflow?: Workflow
  agents: Agent[]
  onSaved: () => void                      // called after successful create/update
}
```

Internal state: `builderState: WorkflowCreatePayload` (pre-filled from `existingWorkflow` if provided)

Internal state: `isSaving: boolean`, `saveError: string | null`

Sections:
1. **Basic Info** — `name` text input (required), `description` textarea
2. **Trigger** — `<TriggerInput>` for `trigger` field
3. **Steps** — `<AgentSelector>` to add agents, `<StepList>` to reorder/remove

On save:
1. Call `validateWorkflowPayload(builderState)` from `workflow.utils.ts`
2. If invalid: display errors, do not submit
3. If valid and `existingWorkflow` provided: call `updateWorkflow(existingWorkflow.id, builderState)`
4. If valid and no `existingWorkflow`: call `createWorkflow(builderState)`
5. On success: call `onSaved()`, call `onClose()`
6. On error: set `saveError`, show `<ErrorBanner>`

---

## 15. Utility Functions (`src/utils/workflow.utils.ts`)

### `generateStepId(): string`

Returns a unique string (e.g. `'step_' + Date.now() + '_' + Math.random().toString(36).slice(2)`). Used when adding a new step in the builder.

### `validateWorkflowPayload(payload: WorkflowCreatePayload): { valid: boolean; errors: string[] }`

Validation rules:
- `name` must be non-empty (error: `"Workflow name is required"`)
- `steps` must have at least one item (error: `"At least one step is required"`)
- Each `step.agentId` must be a non-empty string (error: `"Step {index + 1} has no agent assigned"`)
- `trigger` must be non-empty (error: `"Trigger is required"`)

### `reorderSteps(steps: WorkflowStep[], fromIndex: number, toIndex: number): WorkflowStep[]`

Returns a new array with the item at `fromIndex` moved to `toIndex`. Does not mutate the input array.

---

## 16. Page Modifications Summary

| Page | Mock import removed | Hook used | New actions wired |
|---|---|---|---|
| `Dashboard.tsx` | agents, tasks, workflows, operations | useAgents, useTasks, useWorkflows, useOperationsStream | none |
| `Agents.tsx` | agents | useAgents | startAgent, stopAgent, restartAgent |
| `Workflows.tsx` | workflows | useWorkflows | runWorkflow, pauseWorkflow, deleteWorkflow, createWorkflow, updateWorkflow |
| `Tasks.tsx` | tasks | useTasks | cancelTask |
| `FileSystem.tsx` | fileTree | useFileTree | lazy-load subtrees on expand |
| `Operations.tsx` | operations | useOperationsStream + useOperations fallback | none |
| `Settings.tsx` | (static) | useSettings | saveSettings |

All pages must:
1. Show `<LoadingSpinner />` while `isLoading` is true
2. Show `<ErrorBanner message={error} />` if `error` is non-null
3. Render normal content once data is loaded

---

## 17. Security Requirements

| Requirement | Implementation |
|---|---|
| No token in JavaScript | httpOnly cookies — set by server, never readable by JS |
| Cookies scoped correctly | `SameSite=Strict`, `Secure`, `HttpOnly` on both `oc_access` and `oc_refresh` |
| CSRF defense | `X-Requested-With: XMLHttpRequest` on all requests via `apiRequest` |
| No secrets in frontend code | `VITE_API_BASE` is a URL path, not a secret |
| Single auth code path | All API calls go through `apiRequest` — no inline fetch in components |
| Token refresh loop prevention | Refresh attempted once per original request only |
| Logout on refresh failure | `apiRequest` calls `logout()` if `/auth/refresh` returns 401 |
| Rate limiting | Handled server-side by the Openclaw gateway |
| Password field | Login form uses `type="password"` |
