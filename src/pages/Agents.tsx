import { useState } from 'react';
import { Bot, Play, Square, RefreshCw, ChevronDown } from 'lucide-react';
import { restartAgent, stopAgent } from '../api/agents.api';
import ErrorBanner from '../components/ui/ErrorBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAgents } from '../hooks/useAgents';
import type { AgentStatus } from '../types';

const statusConfig: Record<AgentStatus, { label: string; dot: string; badge: string }> = {
  active:  { label: 'Active',  dot: 'bg-green-400',  badge: 'bg-green-950/60 text-green-400 border-green-800' },
  idle:    { label: 'Idle',    dot: 'bg-yellow-400', badge: 'bg-yellow-950/60 text-yellow-400 border-yellow-800' },
  error:   { label: 'Error',   dot: 'bg-red-400',    badge: 'bg-red-950/60 text-red-400 border-red-800' },
  offline: { label: 'Offline', dot: 'bg-gray-500',   badge: 'bg-gray-900 text-gray-500 border-gray-700' },
};

export default function Agents() {
  const { data: allAgentsData, isLoading, error, refetch } = useAgents();
  const [filter, setFilter] = useState<AgentStatus | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, 'restart' | 'stop' | null>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const allAgents = allAgentsData ?? [];

  const filtered = filter === 'all' ? allAgents : allAgents.filter(a => a.status === filter);

  async function handleAgentAction(agentId: string, action: 'restart' | 'stop') {
    setActionError(null);
    setActionLoading((current) => ({ ...current, [agentId]: action }));

    try {
      if (action === 'restart') {
        await restartAgent(agentId);
      } else {
        await stopAgent(agentId);
      }

      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to ${action} agent`);
    } finally {
      setActionLoading((current) => ({ ...current, [agentId]: null }));
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Agents</h1>
          <p className="text-gray-500 text-sm mt-0.5">{allAgents.length} agents registered in the system</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'idle', 'error', 'offline'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${
                filter === s
                  ? 'bg-blue-600/20 text-blue-400 border-blue-700'
                  : 'text-gray-400 border-[#1a2236] hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {actionError ? <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} /> : null}

      <div className="grid grid-cols-3 gap-4">
        {/* Agent list */}
        <div className="col-span-2 space-y-2">
          {filtered.map(agent => {
            const sc = statusConfig[agent.status];
            const isSelected = selected === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelected(isSelected ? null : agent.id)}
                className={`w-full text-left bg-[#0e1320] border rounded-xl p-4 transition-all hover:border-blue-800/50 ${
                  isSelected ? 'border-blue-700/50 bg-[#0e1628]' : 'border-[#1a2236]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#141c2e] border border-[#1a2236] flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{agent.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${sc.badge}`}>
                        {sc.label}
                      </span>
                      <span className="text-[10px] text-gray-600 bg-[#141c2e] border border-[#1a2236] rounded px-1.5 py-0.5">{agent.type}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{agent.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-white">{agent.tasksCompleted}</div>
                    <div className="text-xs text-gray-600">tasks done</div>
                  </div>
                  <ChevronDown size={14} className={`text-gray-600 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-[#1a2236] grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Model</div>
                      <div className="text-gray-300 font-mono text-xs">{agent.model}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Last Active</div>
                      <div className="text-gray-300 text-xs">{agent.lastActive}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Running Tasks</div>
                      <div className="text-gray-300">{agent.tasksRunning}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Tags</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-[#141c2e] text-gray-400 border border-[#1a2236] rounded px-1.5 py-0.5">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 flex gap-2 pt-1">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors">
                        <Play size={11} /> Run Task
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleAgentAction(agent.id, 'restart');
                        }}
                        disabled={actionLoading[agent.id] !== null && actionLoading[agent.id] !== undefined}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141c2e] hover:bg-[#1a2236] text-gray-300 border border-[#1a2236] rounded-md text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading[agent.id] === 'restart' ? <LoadingSpinner size="sm" /> : <RefreshCw size={11} />}
                        Restart
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleAgentAction(agent.id, 'stop');
                        }}
                        disabled={actionLoading[agent.id] !== null && actionLoading[agent.id] !== undefined}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141c2e] hover:bg-red-950/50 text-gray-400 hover:text-red-400 border border-[#1a2236] hover:border-red-900 rounded-md text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoading[agent.id] === 'stop' ? <LoadingSpinner size="sm" /> : <Square size={11} />}
                        Stop
                      </button>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-[#1a2236] bg-[#0e1320] p-6 text-sm text-gray-500">
              No agents match the current filter.
            </div>
          )}
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              {(['active', 'idle', 'error', 'offline'] as AgentStatus[]).map(s => {
                const count = allAgents.filter(a => a.status === s).length;
                const sc = statusConfig[s];
                return (
                  <div key={s} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      <span className="text-sm text-gray-400 capitalize">{s}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Top Performers</h3>
            <div className="space-y-3">
              {[...allAgents].sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 4).map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 truncate">{a.name}</span>
                  <span className="text-sm font-medium text-white ml-2">{a.tasksCompleted}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
