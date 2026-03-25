# TASKS.md — Openclaw Dashboard Implementation

Phased implementation checklist. Each task is self-contained — all variable names, file paths, function signatures, and behaviors are specified. Read `SPEC.md` for full context on any task.

Mark tasks complete as you go: change `- [ ]` to `- [x]`.

---

## Phase 1: Authentication & Security

> **Goal:** Users must log in before accessing any page. The dashboard authenticates via httpOnly cookies set by the Openclaw gateway. No tokens ever appear in JavaScript.

---

### 1.1 — Project Setup

- [x] **Install dependencies**
  Run `npm install react-hook-form zod`. Verify both appear in `package.json` under `dependencies`.

- [x] **Create `.env.local`**
  Create file at project root with the following contents (do not commit this file):
  ```
  VITE_API_BASE=/api
  VITE_WS_PATH=/ws
  ```

- [x] **Create `.env.example`**
  Create file at project root with the same keys but empty/placeholder values and a comment per line explaining each variable. This file IS committed.

- [x] **Verify `.env.local` is git-ignored**
  Check `.gitignore` contains a line for `.env.local`. If missing, add it.

---

### 1.2 — Extend Types

- [x] **Add new types to `src/types/index.ts`**
  Append the following type and interface definitions (do not remove existing ones):
  - Interface `AuthUser`: fields `id: string`, `username: string`, `role: 'admin'`
  - Interface `AuthState`: fields `user: AuthUser | null`, `isAuthenticated: boolean`, `isLoading: boolean`
  - Interface `AuthContextType`: fields `authState: AuthState`, `login: (username: string, password: string) => Promise<void>`, `logout: () => Promise<void>`
  - Interface `ApiError` (extends `Error`): fields `status: number`, `message: string`, `code?: string`
  - Interface `SystemSettings`: all fields as listed in SPEC.md §4 — `systemName`, `defaultModel`, `maxConcurrentTasks`, `taskTimeoutSeconds`, `logRetentionDays`, `outputStoragePath`, `autoPurgeCompleted`, `requireAuth`, `auditLogging`, `sandboxExecution`, `agentPollingInterval`, `maxTokensPerTask`, `emailAlertsEnabled`, `slackWebhookEnabled`, `alertOnTaskFailure`, `alertOnAgentOffline`
  - Interface `WorkflowStep`: fields `id: string`, `agentId: string`, `label: string`, `config: Record<string, unknown>`, `dependsOn: string[]`
  - Interface `WorkflowCreatePayload`: fields `name: string`, `description: string`, `trigger: string`, `steps: WorkflowStep[]`
  - Type `WorkflowUpdatePayload = Partial<WorkflowCreatePayload>`
  - Interface `WorkflowRun`: fields `id: string`, `workflowId: string`, `status: 'running' | 'completed' | 'failed'`, `startedAt: string`, `completedAt?: string`, `triggeredBy: string`
  - Interface `TaskFilters`: fields `status?: TaskStatus`, `agentId?: string`, `workflowId?: string`
  - Interface `OperationFilters`: fields `level?: LogLevel`, `limit?: number`, `offset?: number`
  - Type `WsEventType = 'operation' | 'agent_status' | 'task_progress'`
  - Type union `WsEvent` (discriminated by `type` field): three variants for `operation`, `agent_status`, `task_progress` as specified in SPEC.md §9

---

### 1.3 — Base API Client

- [x] **Create `src/api/client.ts`**

  Declare module-level const `API_BASE: string` — read from `import.meta.env.VITE_API_BASE`, fall back to `'/api'` if undefined.

  Declare module-level mutable variable `logoutHandler: (() => void) | null = null`. This is set by `AuthProvider` on mount so `apiRequest` can trigger logout on refresh failure.

  Export function `setLogoutHandler(fn: () => void): void` — assigns `fn` to `logoutHandler`.

  Export async function `apiRequest<T>(method: string, path: string, body?: unknown): Promise<T>`:

  1. Build `url = API_BASE + path`
  2. Build `headers` object:
     - `'X-Requested-With': 'XMLHttpRequest'`
     - `'Content-Type': 'application/json'` (only if `body` is defined)
  3. Call `fetch(url, { method, headers, credentials: 'include', body: body ? JSON.stringify(body) : undefined })`
  4. If response status is `401`:
     - Call `fetch(API_BASE + '/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } })`
     - If refresh response is also not ok: call `logoutHandler?.()` and throw `ApiError` with `status: 401, message: 'Session expired'`
     - Otherwise: retry the original request once with identical parameters
  5. If final response is not ok: read `response.json()` as `{ message, code }`, throw `ApiError` with those values and `status: response.status`
  6. Return `response.json() as T`

---

### 1.4 — Auth API Module

- [x] **Create `src/api/auth.api.ts`**

  Import `apiRequest` from `./client`.

  Export the following four async functions:

  - `loginRequest(username: string, password: string): Promise<{ user: AuthUser }>`
    Calls `apiRequest('POST', '/auth/login', { username, password })`

  - `refreshRequest(): Promise<void>`
    Calls `apiRequest('POST', '/auth/refresh')` — return type is void (server rotates cookies)

  - `logoutRequest(): Promise<void>`
    Calls `apiRequest('POST', '/auth/logout')`

  - `getMeRequest(): Promise<AuthUser>`
    Calls `apiRequest('GET', '/auth/me')`

---

### 1.5 — Auth Context

- [x] **Create `src/auth/AuthContext.tsx`**

  Import `createContext` from React and `AuthContextType` from `../types`.

  Export `const AuthContext = React.createContext<AuthContextType | null>(null)`.

---

### 1.6 — Auth Provider

- [x] **Create `src/auth/AuthProvider.tsx`**

  Props: `{ children: React.ReactNode }`

  Internal state variable: `authState: AuthState` — initialized as `{ user: null, isAuthenticated: false, isLoading: true }`

  On mount (`useEffect` with empty dependency array):
  1. Call `getMeRequest()`
  2. On success: update `authState` to `{ user: result, isAuthenticated: true, isLoading: false }`
  3. On any error: update `authState` to `{ user: null, isAuthenticated: false, isLoading: false }`
  4. Also call `setLogoutHandler(logout)` so `apiRequest` can trigger logout on refresh failure

  Function `login(username: string, password: string): Promise<void>`:
  1. Call `loginRequest(username, password)`
  2. On success: update `authState` to `{ user: result.user, isAuthenticated: true, isLoading: false }`
  3. Let errors propagate to the caller (Login page handles them)

  Function `logout(): Promise<void>`:
  1. Call `logoutRequest()` (ignore errors — we log out regardless)
  2. Reset `authState` to `{ user: null, isAuthenticated: false, isLoading: false }`

  Return `<AuthContext.Provider value={{ authState, login, logout }}>{children}</AuthContext.Provider>`

---

### 1.7 — useAuth Hook

- [x] **Create `src/auth/useAuth.ts`**

  Import `useContext` from React and `AuthContext` from `./AuthContext`.

  Export function `useAuth(): AuthContextType`:
  1. Call `const ctx = useContext(AuthContext)`
  2. If `ctx` is null: `throw new Error('useAuth must be used within AuthProvider')`
  3. Return `ctx`

---

### 1.8 — LoadingSpinner Component

- [x] **Create `src/components/ui/LoadingSpinner.tsx`**

  Props: `{ size?: 'sm' | 'md' | 'lg' }` (default: `'md'`)

  Size mappings: `sm = 'w-5 h-5'`, `md = 'w-8 h-8'`, `lg = 'w-12 h-12'`

  Renders a `div` centered in its container (flexbox center) containing an `svg` or `div` with Tailwind class `animate-spin` and a border-style circular appearance using `rounded-full border-2 border-gray-700 border-t-blue-500`.

---

### 1.9 — ErrorBanner Component

- [x] **Create `src/components/ui/ErrorBanner.tsx`**

  Props: `{ message: string; onDismiss?: () => void }`

  Renders a horizontally-padded, red-tinted banner row:
  - Background: `bg-red-950/60`, border: `border border-red-900`, rounded corners
  - Left: red `AlertTriangle` icon (from lucide-react) + `message` text in `text-red-300`
  - Right (if `onDismiss` provided): X icon button that calls `onDismiss` on click

---

### 1.10 — ProtectedRoute Component

- [x] **Create `src/auth/ProtectedRoute.tsx`**

  Import `Navigate, Outlet` from `react-router-dom`, `useAuth` from `./useAuth`, `LoadingSpinner` from `../components/ui/LoadingSpinner`.

  Read `const { authState } = useAuth()`.

  Logic:
  - If `authState.isLoading`: return `<LoadingSpinner size="lg" />` centered on screen
  - If `!authState.isAuthenticated`: return `<Navigate to="/login" replace />`
  - Otherwise: return `<Outlet />`

---

### 1.11 — Login Page

- [x] **Create `src/pages/Login.tsx`**

  Imports needed: `useForm` from `react-hook-form`, `zodResolver` from `@hookform/resolvers/zod`, `z` from `zod`, `useNavigate` from `react-router-dom`, `useAuth` from `../auth/useAuth`, `ErrorBanner` from `../components/ui/ErrorBanner`.

  Define Zod schema `loginSchema`:
  - `username`: `z.string().min(1, 'Username is required')`
  - `password`: `z.string().min(1, 'Password is required')`

  Internal state: `submitError: string | null` (for API errors), `isSubmitting: boolean`

  Form using `useForm` with `zodResolver(loginSchema)`. Fields: `username`, `password`.

  On submit:
  1. Set `isSubmitting = true`, clear `submitError`
  2. Call `login(username, password)` from `useAuth`
  3. On success: call `navigate('/dashboard', { replace: true })`
  4. On error: set `submitError` to `error.message` (cast to `ApiError`)
  5. Set `isSubmitting = false`

  If already authenticated on mount: redirect to `/dashboard` immediately.

  Layout: centered card on a dark background matching the app theme. Contains:
  - Openclaw logo/brand (reuse styling from Topbar brand section)
  - `"Welcome back"` heading
  - `submitError` shown as `<ErrorBanner>` if non-null
  - Username text input with label (register with react-hook-form)
  - Password password input with label (register with react-hook-form)
  - Field validation error messages in red below each field
  - Submit button labeled `"Sign in"`, disabled + shows spinner while `isSubmitting`

---

### 1.12 — Wire Auth into App.tsx

- [x] **Update `src/App.tsx`**

  1. Import `AuthProvider` from `./auth/AuthProvider`
  2. Import `ProtectedRoute` from `./auth/ProtectedRoute`
  3. Import `Login` from `./pages/Login`
  4. Wrap the entire `<Routes>` tree in `<AuthProvider>`
  5. Add route `<Route path="login" element={<Login />} />` **outside** of `<ProtectedRoute>`
  6. Change the existing parent route element from `<Layout />` to `<ProtectedRoute />`, and nest a `<Route element={<Layout />}>` inside it containing all existing page routes
  7. The `/` → `/dashboard` redirect remains inside the protected/layout tree

  Final route tree structure:
  ```
  <AuthProvider>
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index → /dashboard />
          <Route path="dashboard" → Dashboard />
          ... all other existing routes ...
        </Route>
      </Route>
    </Routes>
  </AuthProvider>
  ```

---

### 1.13 — Topbar Auth Integration

- [x] **Update `src/components/layout/Topbar.tsx`**

  1. Import `useAuth` from `../../auth/useAuth`
  2. Read `const { authState, logout } = useAuth()`
  3. Derive `initials: string` — take first character of `authState.user?.username ?? 'A'`, uppercase
  4. Replace hardcoded `"AD"` text in the avatar div with `{initials}`
  5. Add a logout button: below or next to the avatar (a text button `"Sign out"` or icon button), which calls `logout()` on click
  6. If desired, wrap avatar + logout in a relative `div` with a dropdown on click — but a simple always-visible logout button is acceptable for Phase 1

---

## Phase 2: Gateway Data Integration

> **Goal:** All pages show real data from the Openclaw gateway. Mock data imports are fully removed. Loading and error states are visible to the user.

---

### 2.1 — Resource API Modules

- [x] **Create `src/api/agents.api.ts`**

  Export functions: `getAgents()`, `getAgent(id: string)`, `startAgent(id: string)`, `stopAgent(id: string)`, `restartAgent(id: string)`
  Each calls `apiRequest` with the correct method and path from SPEC.md §7.

- [x] **Create `src/api/tasks.api.ts`**

  Export functions: `getTasks(filters?: TaskFilters)`, `getTask(id: string)`, `cancelTask(id: string)`
  `getTasks` builds query string from `filters` object (only include keys with defined values).

- [x] **Create `src/api/workflows.api.ts`**

  Export functions: `getWorkflows()`, `getWorkflow(id: string)`, `createWorkflow(payload: WorkflowCreatePayload)`, `updateWorkflow(id: string, payload: WorkflowUpdatePayload)`, `deleteWorkflow(id: string)`, `runWorkflow(id: string)`, `pauseWorkflow(id: string)`, `getWorkflowRuns(id: string)`

- [x] **Create `src/api/operations.api.ts`**

  Export function: `getOperations(filters?: OperationFilters)`
  Builds query string from `filters` (level, limit, offset).

- [x] **Create `src/api/files.api.ts`**

  Export functions: `getFileTree()` calls `GET /files`, `getFileNode(path: string)` calls `GET /files?path=<encoded-path>`.

- [x] **Create `src/api/settings.api.ts`**

  Export functions: `getSettings()`, `updateSettings(partial: Partial<SystemSettings>)`

---

### 2.2 — Data Hooks

All hooks in `src/hooks/` follow the interface in SPEC.md §10.

- [x] **Create `src/hooks/useAgents.ts`**

  Internal state: `agents: Agent[] | null`, `isLoading: boolean`, `error: string | null`

  On mount: fetch via `getAgents()`. Set `isLoading = true` before fetch, `false` after.

  Polling: use `setInterval` with interval from `POLLING_INTERVAL_MS` (read from a module-level const defaulting to `5000`). Clear interval on unmount. Pause when `document.visibilityState === 'hidden'` (listen to `visibilitychange` event).

  `refetch()`: manually triggers a new `getAgents()` call outside the interval.

- [x] **Create `src/hooks/useTasks.ts`**

  Same pattern as `useAgents`. Accepts optional `filters: TaskFilters` parameter. Calls `getTasks(filters)`.

- [x] **Create `src/hooks/useWorkflows.ts`**

  Same pattern. Calls `getWorkflows()`.

- [x] **Create `src/hooks/useOperations.ts`**

  Same pattern. Accepts optional `filters: OperationFilters`. Calls `getOperations(filters)`.

- [x] **Create `src/hooks/useFileTree.ts`**

  Calls `getFileTree()` once on mount. No polling (file tree is not live). Exports `refetch` for manual refresh.

- [x] **Create `src/hooks/useSettings.ts`**

  Calls `getSettings()` on mount. No polling.

  Additional exports:
  - `saveSettings(partial: Partial<SystemSettings>): Promise<void>` — calls `updateSettings(partial)`, on success updates `data` in state
  - `isSaving: boolean` — true while `saveSettings` is in progress
  - `saveError: string | null` — set if `saveSettings` throws

---

### 2.3 — WebSocket Client

- [x] **Create `src/ws/wsClient.ts`**

  Declare module-level const `WS_PATH: string` — read from `import.meta.env.VITE_WS_PATH`, fallback `'/ws'`.

  Implement class `WsClient`:

  Private fields:
  - `socket: WebSocket | null`
  - `listeners: Map<WsEventType, Set<Function>>`
  - `reconnectAttempts: number`
  - `reconnectDelays: number[]` — value `[1000, 2000, 5000]`
  - `status: 'connected' | 'disconnected' | 'reconnecting' | 'failed'`

  Public methods:
  - `connect(): void` — creates `new WebSocket(WS_PATH)`. Registers `onopen` (set status, reset attempts), `onmessage` (parse JSON, dispatch to listeners), `onclose` (if code !== 1000, start reconnect logic), `onerror` (log only)
  - `disconnect(): void` — calls `socket.close(1000)`, sets `status = 'disconnected'`
  - `on(eventType: WsEventType, handler: Function): void` — adds to `listeners` map
  - `off(eventType: WsEventType, handler: Function): void` — removes from `listeners` map
  - Private `scheduleReconnect(): void` — if `reconnectAttempts < reconnectDelays.length`: `setTimeout(connect, reconnectDelays[reconnectAttempts])`, increment `reconnectAttempts`; else set `status = 'failed'`
  - Private `dispatch(event: WsEvent): void` — calls all registered handlers for `event.type`

  Export `const wsClient = new WsClient()` as the singleton instance.

---

### 2.4 — Operations Stream Hook

- [x] **Create `src/ws/useOperationsStream.ts`**

  This hook merges live WebSocket events with the REST polling fallback.

  State:
  - `liveOperations: Operation[]` — prepended with new operations from WebSocket
  - `agentUpdates: Record<string, AgentStatus>` — map of agentId → latest status from WS
  - `taskUpdates: Record<string, { progress: number; status: TaskStatus }>` — map of taskId → latest from WS
  - `isConnected: boolean` — whether WebSocket is live

  On mount:
  1. Call `wsClient.connect()`
  2. Register handler for `'operation'` events: prepend to `liveOperations` (keep max 200 entries)
  3. Register handler for `'agent_status'` events: update `agentUpdates` map
  4. Register handler for `'task_progress'` events: update `taskUpdates` map

  On unmount: call `wsClient.off(...)` for all registered handlers.

  Returns: `{ liveOperations, agentUpdates, taskUpdates, isConnected }`

---

### 2.5 — Update Dashboard.tsx

- [x] **Replace mock imports in `src/pages/Dashboard.tsx`**

  1. Remove `import { agents, tasks, workflows, operations } from '../data/mock'`
  2. Add: `import { useAgents } from '../hooks/useAgents'`, same for `useTasks`, `useWorkflows`
  3. Add: `import { useOperationsStream } from '../ws/useOperationsStream'`
  4. Add: `import LoadingSpinner from '../components/ui/LoadingSpinner'`, `import ErrorBanner from '../components/ui/ErrorBanner'`
  5. Call each hook at the top of the component function
  6. Derive the same calculated values (`activeAgents`, `runningTasks`, etc.) from the hook `data` instead of static arrays (use empty array `[]` as fallback when `data` is null)
  7. Show `<LoadingSpinner />` centered in the page while any hook's `isLoading` is true
  8. Show `<ErrorBanner message={...} />` for any non-null `error` value from hooks

---

### 2.6 — Update Agents.tsx

- [x] **Replace mock imports in `src/pages/Agents.tsx`**

  1. Remove `import { agents as allAgents } from '../data/mock'`
  2. Replace with `const { data: allAgents, isLoading, error, refetch } = useAgents()`
  3. Add `LoadingSpinner` and `ErrorBanner` imports and render guards
  4. Wire the three action buttons in the expanded agent card:
     - "Run Task": no-op for now (task creation is out of Phase 2 scope)
     - "Restart" button: on click, call `restartAgent(agent.id)` from `agents.api.ts`. While in-flight, disable the button and show a small inline spinner. On success, call `refetch()`.
     - "Stop" button: on click, call `stopAgent(agent.id)`. Same in-flight behavior. On success, call `refetch()`.
  5. Track per-agent action loading state: `const [actionLoading, setActionLoading] = useState<Record<string, 'restart' | 'stop' | null>>({})`.

---

### 2.7 — Update Workflows.tsx

- [x] **Replace mock imports in `src/pages/Workflows.tsx`**

  1. Remove `import { workflows, agents } from '../data/mock'`
  2. Replace with `useWorkflows()` and `useAgents()`
  3. Add `LoadingSpinner` and `ErrorBanner` render guards
  4. Wire the Run/Pause buttons to `runWorkflow(id)` and `pauseWorkflow(id)` from `workflows.api.ts`. On success: call `refetch()`.
  5. Track per-workflow action loading state: `const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})`

---

### 2.8 — Update Tasks.tsx

- [x] **Replace mock imports in `src/pages/Tasks.tsx`**

  1. Remove `import { tasks as allTasks } from '../data/mock'`
  2. Replace with `useTasks()`
  3. Add `LoadingSpinner` and `ErrorBanner` render guards
  4. Add a "Cancel" button in the table row for tasks with status `'running'` or `'queued'`
  5. On cancel: call `cancelTask(task.id)`. On success: call `refetch()`.

---

### 2.9 — Update FileSystem.tsx

- [x] **Replace mock imports in `src/pages/FileSystem.tsx`**

  1. Remove `import { fileTree } from '../data/mock'`
  2. Call `const { data: rootNode, isLoading, error } = useFileTree()`
  3. Add `LoadingSpinner` and `ErrorBanner` render guards
  4. Implement lazy loading: in `FileTreeNode`, when a directory is expanded and `node.children` is undefined, call `getFileNode(node.path)` and merge the result's children into local state `const [loadedChildren, setLoadedChildren] = useState<FileNode[] | undefined>(node.children)`. Display a small inline `<LoadingSpinner size="sm" />` while loading.

---

### 2.10 — Update Operations.tsx

- [x] **Replace mock imports in `src/pages/Operations.tsx`**

  1. Remove `import { operations as allOps } from '../data/mock'`
  2. Call `const { liveOperations, isConnected } = useOperationsStream()`
  3. Use `liveOperations` as the data source for the operation list
  4. Update the live indicator text: if `isConnected`, show green pulsing dot + `"Live"`. If not connected, show yellow dot + `"Polling"` (fallback).

---

### 2.11 — Update Settings.tsx

- [x] **Replace static defaults in `src/pages/Settings.tsx`**

  1. Call `const { data: settings, isLoading, error, saveSettings, isSaving, saveError } = useSettings()`
  2. Add `LoadingSpinner` and `ErrorBanner` render guards for initial load
  3. Change all `defaultValue` props on input/toggle components to use values from `settings` (e.g. `settings?.systemName ?? ''`)
  4. Introduce form state: use `useState<Partial<SystemSettings>>({})` named `formValues` to track changes. Each input's `onChange` updates `formValues`.
  5. Wire the Save Changes button: on click, call `saveSettings(formValues)`. Disable button while `isSaving`. Show `<ErrorBanner message={saveError} />` if `saveError` is non-null. Show a brief success indicator on completion (e.g. button label changes to "Saved ✓" for 2 seconds).

---

## Phase 3: Interactive Workflow Management

> **Goal:** Users can create, edit, delete, and monitor workflows directly from the dashboard through a modal builder interface.

---

### 3.1 — Modal Component

- [ ] **Create `src/components/ui/Modal.tsx`**

  Props: `{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }`

  Default `maxWidth`: `'max-w-2xl'`

  Render via `ReactDOM.createPortal(content, document.body)` where `content` is:
  - A fixed full-screen overlay `div` with `bg-black/60` backdrop, `z-50`
  - A centered panel `div` with `maxWidth`, dark background `bg-[#0e1320]`, border `border-[#1a2236]`, rounded-xl
  - Header row: `title` text + close button (X icon from lucide-react) that calls `onClose`
  - Body: `{children}`

  Event handling:
  - Click on overlay (but not on panel) → call `onClose`
  - `useEffect` adds `keydown` listener: if `event.key === 'Escape'` → call `onClose`. Remove listener on cleanup.

  If `!isOpen`: return `null`.

---

### 3.2 — ConfirmDialog Component

- [ ] **Create `src/components/ui/ConfirmDialog.tsx`**

  Props: `{ isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; isDestructive?: boolean }`

  Defaults: `confirmLabel = 'Confirm'`, `isDestructive = false`

  Uses `<Modal isOpen={isOpen} onClose={onCancel} title="Confirm">`:
  - Shows `message` in body
  - Two buttons: Cancel (gray, calls `onCancel`) and Confirm (calls `onConfirm`, red if `isDestructive`, blue otherwise)

---

### 3.3 — Workflow Utility Functions

- [ ] **Create `src/utils/workflow.utils.ts`**

  Implement and export three pure functions with no side effects:

  **`generateStepId(): string`**
  Returns `'step_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)`

  **`validateWorkflowPayload(payload: WorkflowCreatePayload): { valid: boolean; errors: string[] }`**
  - Check `payload.name.trim().length > 0` — if not, push `'Workflow name is required'`
  - Check `payload.trigger.trim().length > 0` — if not, push `'Trigger is required'`
  - Check `payload.steps.length > 0` — if not, push `'At least one step is required'`
  - For each step at index `i`: check `step.agentId.length > 0` — if not, push `'Step ${i + 1} has no agent assigned'`
  - Return `{ valid: errors.length === 0, errors }`

  **`reorderSteps(steps: WorkflowStep[], fromIndex: number, toIndex: number): WorkflowStep[]`**
  - Clone array with `[...steps]`
  - Remove element at `fromIndex` using `splice`
  - Insert it at `toIndex` using `splice`
  - Return the new array (original is not mutated)

---

### 3.4 — AgentSelector Component

- [ ] **Create `src/components/workflow/AgentSelector.tsx`**

  Props:
  ```
  {
    agents: Agent[]
    selectedIds: string[]
    onToggle: (agentId: string) => void
  }
  ```

  Internal state: `searchQuery: string` (initialized `''`)

  Filtered list: `agents.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.type.toLowerCase().includes(searchQuery.toLowerCase()))`

  Render:
  - Search input bound to `searchQuery`
  - Scrollable list (max-height `240px`, overflow-y auto)
  - Each row: status dot (color per `AgentStatus`), agent name, type badge, checkbox showing if `selectedIds.includes(agent.id)`
  - Click on row: call `onToggle(agent.id)`

---

### 3.5 — StepList Component

- [ ] **Create `src/components/workflow/StepList.tsx`**

  Props:
  ```
  {
    steps: WorkflowStep[]
    agents: Agent[]
    onReorder: (fromIndex: number, toIndex: number) => void
    onRemove: (stepId: string) => void
  }
  ```

  Internal state: `dragIndex: number | null` (the index of the currently dragged item)

  For each step at index `i`, render a `div` with:
  - `draggable={true}`
  - `onDragStart`: `setDragIndex(i)`
  - `onDragOver`: `e.preventDefault()` (required for drop to work)
  - `onDrop`: if `dragIndex !== null && dragIndex !== i`, call `onReorder(dragIndex, i)`. Set `dragIndex = null`.
  - Contents:
    - Left: GripVertical icon (drag handle, from lucide-react)
    - Center: step number (`i + 1`) + agent name (resolve from `agents.find(a => a.id === step.agentId)?.name ?? 'Unknown'`) + step label (if set)
    - Right: X button that calls `onRemove(step.id)`

  If `steps.length === 0`: show placeholder text `"No steps added yet. Select agents above."`

---

### 3.6 — TriggerInput Component

- [ ] **Create `src/components/workflow/TriggerInput.tsx`**

  Props: `{ value: string; onChange: (value: string) => void }`

  Internal state: `mode: 'cron' | 'event'` (default `'cron'`)

  Render:
  - Mode toggle: two tab-style buttons — "Cron" and "Event", active one highlighted
  - Switching mode calls `onChange('')` to clear the value
  - Cron mode: text input with `placeholder="0 8 * * 1"` and hint text below: `"Format: minute hour day month weekday (UTC). Example: 0 8 * * 1 = Every Monday at 08:00"`
  - Event mode: text input with `placeholder="new-document-submitted"` and hint text: `"An event name emitted by the Openclaw system that triggers this workflow"`
  - Both inputs call `onChange(e.target.value)` on change

---

### 3.7 — WorkflowBuilderModal Component

- [ ] **Create `src/components/workflow/WorkflowBuilderModal.tsx`**

  Props:
  ```
  {
    isOpen: boolean
    onClose: () => void
    existingWorkflow?: Workflow
    agents: Agent[]
    onSaved: () => void
  }
  ```

  Internal state:
  - `builderState: WorkflowCreatePayload` — initialized from `existingWorkflow` if present, else `{ name: '', description: '', trigger: '', steps: [] }`
  - `validationErrors: string[]`
  - `isSaving: boolean`
  - `saveError: string | null`

  When `existingWorkflow` changes (edit mode), reset `builderState` to match the workflow data.

  Render inside `<Modal isOpen={isOpen} onClose={onClose} title={existingWorkflow ? 'Edit Workflow' : 'New Workflow'} maxWidth="max-w-3xl">`:

  **Section 1 — Basic Info:**
  - `name` text input (required, label "Workflow Name")
  - `description` textarea (optional, label "Description")

  **Section 2 — Trigger:**
  - `<TriggerInput value={builderState.trigger} onChange={...} />`

  **Section 3 — Steps:**
  - `<AgentSelector agents={agents} selectedIds={builderState.steps.map(s => s.agentId)} onToggle={handleAgentToggle} />`
  - `<StepList steps={builderState.steps} agents={agents} onReorder={handleReorder} onRemove={handleRemove} />`

  Helper functions (internal):
  - `handleAgentToggle(agentId)`: if already in steps, call `handleRemove` for that step. If not, create new `WorkflowStep` using `generateStepId()` and append to `builderState.steps`.
  - `handleReorder(from, to)`: call `reorderSteps` and update `builderState.steps`
  - `handleRemove(stepId)`: filter out step with matching id from `builderState.steps`

  **Footer:**
  - `{validationErrors.length > 0 && <ul>{validationErrors.map(e => <li>...)}</ul>}`
  - `{saveError && <ErrorBanner message={saveError} />}`
  - Cancel button (calls `onClose`)
  - Save button (disabled while `isSaving`, shows spinner while saving)

  On save:
  1. Run `validateWorkflowPayload(builderState)` — if invalid, set `validationErrors`, abort
  2. Set `isSaving = true`, clear `saveError`
  3. If `existingWorkflow`: call `updateWorkflow(existingWorkflow.id, builderState)`; else call `createWorkflow(builderState)`
  4. On success: call `onSaved()`, call `onClose()`
  5. On error: set `saveError = error.message`, set `isSaving = false`

---

### 3.8 — Wire WorkflowBuilderModal into Workflows.tsx

- [ ] **Update `src/pages/Workflows.tsx`**

  1. Import `WorkflowBuilderModal` from `../components/workflow/WorkflowBuilderModal`
  2. Import `ConfirmDialog` from `../components/ui/ConfirmDialog`
  3. Import `deleteWorkflow` from `../api/workflows.api`
  4. Add state:
     - `builderOpen: boolean` (default `false`)
     - `editingWorkflow: Workflow | null` (default `null`)
     - `deletingWorkflow: Workflow | null` (default `null`)
  5. "New Workflow" button: on click, set `editingWorkflow = null`, `builderOpen = true`
  6. Add an "Edit" icon button per workflow card: on click, set `editingWorkflow = workflow`, `builderOpen = true`
  7. Add a "Delete" icon button per workflow card: on click, set `deletingWorkflow = workflow`
  8. Render `<WorkflowBuilderModal isOpen={builderOpen} onClose={() => { setBuilderOpen(false); setEditingWorkflow(null) }} existingWorkflow={editingWorkflow ?? undefined} agents={agentData ?? []} onSaved={refetch} />`
  9. Render `<ConfirmDialog isOpen={deletingWorkflow !== null} message={'Delete workflow "' + deletingWorkflow?.name + '"? This cannot be undone.'} isDestructive onConfirm={handleDeleteConfirm} onCancel={() => setDeletingWorkflow(null)} />`
  10. Implement `handleDeleteConfirm`: call `deleteWorkflow(deletingWorkflow!.id)`, then call `refetch()`, then set `deletingWorkflow = null`

---

### 3.9 — Workflow Run History

- [ ] **Extend Workflow type in `src/types/index.ts`**

  Add optional field `runHistory?: WorkflowRun[]` to the existing `Workflow` interface.

- [ ] **Add `getWorkflowRuns` call in Workflows.tsx**

  1. Add per-workflow expanded state: `const [expandedRuns, setExpandedRuns] = useState<Record<string, boolean>>({})` — tracks which workflow's run history panel is open
  2. Add per-workflow run data: `const [workflowRuns, setWorkflowRuns] = useState<Record<string, WorkflowRun[]>>({})` — keyed by workflow ID
  3. Add a "History" toggle button on each workflow card. On click:
     - If not yet loaded for this workflow: call `getWorkflowRuns(workflow.id)` and store in `workflowRuns[workflow.id]`
     - Toggle `expandedRuns[workflow.id]`
  4. When `expandedRuns[workflow.id]` is true, render a "Run History" section below the workflow card's footer showing the last 5 `workflowRuns[workflow.id]` entries as rows with: status badge, `triggeredBy` label, `startedAt` datetime, duration (if `completedAt` is present: `completedAt - startedAt` in human-readable form, else `"In progress"`)

---

## Verification Checklist

Before considering implementation complete, verify the following manually:

- [ ] Navigating to `/dashboard` without being logged in redirects to `/login`
- [ ] Login with valid credentials → navigates to `/dashboard`
- [ ] Login with invalid credentials → shows error message below form, does not navigate
- [ ] Refreshing the page while logged in → stays on current page (session persists via cookies)
- [ ] Clicking "Sign out" → redirects to `/login`, subsequent direct nav to `/dashboard` redirects back to `/login`
- [ ] All 7 pages load without errors from the API (with a real gateway running)
- [ ] Restarting an agent updates the agent card status after `refetch()`
- [ ] Pausing a workflow updates the workflow status after `refetch()`
- [ ] Creating a new workflow via the builder → appears in the workflow list
- [ ] Editing a workflow → changes are reflected in the list
- [ ] Deleting a workflow → disappears from the list
- [ ] Operations page shows live events streamed from WebSocket
- [ ] Settings save shows success feedback and persists on page refresh
- [ ] Run `npm run build` — zero TypeScript errors
