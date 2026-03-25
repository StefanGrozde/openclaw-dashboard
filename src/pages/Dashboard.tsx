import { Bot, ListTodo, GitBranch, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorBanner from '../components/ui/ErrorBanner';
import { useAgents } from '../hooks/useAgents';
import { useTasks } from '../hooks/useTasks';
import { useWorkflows } from '../hooks/useWorkflows';
import { useOperationsStream } from '../ws/useOperationsStream';

function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

const levelColor: Record<string, string> = {
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

const levelBg: Record<string, string> = {
  info: 'bg-blue-950/50 border-blue-900/50',
  success: 'bg-green-950/50 border-green-900/50',
  warning: 'bg-yellow-950/50 border-yellow-900/50',
  error: 'bg-red-950/50 border-red-900/50',
};

const statusColor: Record<string, string> = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  error: 'bg-red-500',
  offline: 'bg-gray-600',
};

export default function Dashboard() {
  const { data: agentsData, isLoading: agentsLoading, error: agentsError } = useAgents();
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: workflowsData, isLoading: workflowsLoading, error: workflowsError } = useWorkflows();
  const { liveOperations } = useOperationsStream();

  const agents = agentsData ?? [];
  const tasks = tasksData ?? [];
  const workflows = workflowsData ?? [];

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;
  const errorCount = agents.filter(a => a.status === 'error').length + tasks.filter(t => t.status === 'failed').length;

  const recentOps = liveOperations.slice(0, 6);
  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'queued').slice(0, 5);
  const errors = [agentsError, tasksError, workflowsError].filter(Boolean) as string[];

  if (agentsLoading || tasksLoading || workflowsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">System Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Real-time status of the Openclaw agent system</p>
      </div>

      {errors.map((message) => (
        <ErrorBanner key={message} message={message} />
      ))}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Agents" value={activeAgents} icon={Bot} color="bg-blue-600/20 text-blue-400" sub={`${agents.length} total registered`} />
        <StatCard label="Running Tasks" value={runningTasks} icon={ListTodo} color="bg-violet-600/20 text-violet-400" sub={`${tasks.filter(t => t.status === 'queued').length} queued`} />
        <StatCard label="Active Workflows" value={activeWorkflows} icon={GitBranch} color="bg-cyan-600/20 text-cyan-400" sub={`${workflows.length} total defined`} />
        <StatCard label="Errors / Failures" value={errorCount} icon={AlertTriangle} color="bg-red-600/20 text-red-400" sub="Agents + tasks combined" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Active tasks */}
        <div className="col-span-2 bg-[#0e1320] border border-[#1a2236] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={15} className="text-blue-400" /> Active Tasks
            </h2>
            <a href="/tasks" className="text-xs text-blue-400 hover:text-blue-300">View all →</a>
          </div>
          <div className="space-y-3">
            {activeTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-200 truncate">{task.title}</span>
                    <span className="text-xs text-gray-500 ml-2 shrink-0">{task.agentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#1a2236] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${task.status === 'queued' ? 'bg-gray-600' : 'bg-blue-500'}`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{task.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
            {activeTasks.length === 0 && <div className="text-sm text-gray-500">No active tasks available.</div>}
          </div>
        </div>

        {/* Agent status */}
        <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bot size={15} className="text-blue-400" /> Agent Status
            </h2>
            <a href="/agents" className="text-xs text-blue-400 hover:text-blue-300">View all →</a>
          </div>
          <div className="space-y-2.5">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor[agent.status]}`} />
                <span className="text-sm text-gray-300 flex-1 truncate">{agent.name}</span>
                <span className="text-xs text-gray-600 capitalize">{agent.status}</span>
              </div>
            ))}
            {agents.length === 0 && <div className="text-sm text-gray-500">No agents available.</div>}
          </div>
        </div>
      </div>

      {/* Recent operations */}
      <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock size={15} className="text-blue-400" /> Recent Operations
          </h2>
          <a href="/operations" className="text-xs text-blue-400 hover:text-blue-300">View all →</a>
        </div>
        <div className="space-y-2">
          {recentOps.map(op => (
            <div key={op.id} className={`flex items-start gap-3 p-2.5 rounded-lg border text-sm ${levelBg[op.level]}`}>
              <div className="flex items-center gap-2 shrink-0">
                {op.level === 'success' && <CheckCircle2 size={13} className="text-green-400" />}
                {op.level === 'error' && <AlertTriangle size={13} className="text-red-400" />}
                {op.level === 'warning' && <AlertTriangle size={13} className="text-yellow-400" />}
                {op.level === 'info' && <Activity size={13} className="text-blue-400" />}
                <span className={`text-xs font-mono ${levelColor[op.level]}`}>{op.source}</span>
              </div>
              <span className="text-gray-300 flex-1">{op.message}</span>
              <span className="text-xs text-gray-600 shrink-0">{new Date(op.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
          {recentOps.length === 0 && <div className="text-sm text-gray-500">No live operations received yet.</div>}
        </div>
      </div>
    </div>
  );
}
