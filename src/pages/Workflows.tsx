import { GitBranch, Play, Pause, Settings, Bot, CheckCircle2, Clock } from 'lucide-react';
import { workflows, agents } from '../data/mock';
import type { WorkflowStatus } from '../types';

const statusConfig: Record<WorkflowStatus, { label: string; badge: string; dot: string }> = {
  active:   { label: 'Active',   badge: 'bg-green-950/60 text-green-400 border-green-800',   dot: 'bg-green-400' },
  inactive: { label: 'Inactive', badge: 'bg-gray-900 text-gray-500 border-gray-700',          dot: 'bg-gray-500' },
  draft:    { label: 'Draft',    badge: 'bg-yellow-950/60 text-yellow-400 border-yellow-800', dot: 'bg-yellow-400' },
};

export default function Workflows() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Workflows</h1>
          <p className="text-gray-500 text-sm mt-0.5">{workflows.length} workflows defined</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors">
          <GitBranch size={14} /> New Workflow
        </button>
      </div>

      <div className="space-y-4">
        {workflows.map(wf => {
          const sc = statusConfig[wf.status];
          const progressPct = wf.tasksTotal > 0 ? Math.round((wf.tasksCompleted / wf.tasksTotal) * 100) : 0;
          const wfAgents = agents.filter(a => wf.agents.includes(a.id));

          return (
            <div key={wf.id} className="bg-[#0e1320] border border-[#1a2236] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#141c2e] border border-[#1a2236] flex items-center justify-center shrink-0 mt-0.5">
                    <GitBranch size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{wf.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${sc.badge}`}>{sc.label}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{wf.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {wf.status === 'active' && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141c2e] hover:bg-yellow-950/50 text-gray-400 hover:text-yellow-400 border border-[#1a2236] hover:border-yellow-900 rounded-md text-xs font-medium transition-colors">
                      <Pause size={11} /> Pause
                    </button>
                  )}
                  {wf.status !== 'active' && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition-colors">
                      <Play size={11} /> Run
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141c2e] hover:bg-[#1a2236] text-gray-400 border border-[#1a2236] rounded-md text-xs font-medium transition-colors">
                    <Settings size={11} /> Configure
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                {/* Progress */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs text-gray-400">{wf.tasksCompleted}/{wf.tasksTotal} tasks</span>
                  </div>
                  <div className="h-2 bg-[#141c2e] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><Clock size={10} /> Trigger: {wf.trigger}</span>
                    <span>{progressPct}%</span>
                  </div>
                </div>

                {/* Agents */}
                <div>
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Bot size={11} /> Agents ({wfAgents.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {wfAgents.map(a => (
                      <span key={a.id} className="text-[10px] bg-[#141c2e] text-gray-400 border border-[#1a2236] rounded px-1.5 py-0.5 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'active' ? 'bg-green-400' : a.status === 'error' ? 'bg-red-400' : 'bg-gray-500'}`} />
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#1a2236] flex items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-green-500" />
                  {wf.tasksCompleted} completed
                </span>
                <span>Created {new Date(wf.createdAt).toLocaleDateString()}</span>
                <span>Updated {new Date(wf.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
