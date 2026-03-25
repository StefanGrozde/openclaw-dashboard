import { useState } from 'react';
import { ListTodo, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { tasks as allTasks } from '../data/mock';
import type { TaskStatus, Priority } from '../types';

const statusConfig: Record<TaskStatus, { label: string; badge: string }> = {
  running:   { label: 'Running',   badge: 'bg-blue-950/60 text-blue-400 border-blue-800' },
  queued:    { label: 'Queued',    badge: 'bg-gray-900 text-gray-400 border-gray-700' },
  completed: { label: 'Completed', badge: 'bg-green-950/60 text-green-400 border-green-800' },
  failed:    { label: 'Failed',    badge: 'bg-red-950/60 text-red-400 border-red-800' },
  paused:    { label: 'Paused',    badge: 'bg-yellow-950/60 text-yellow-400 border-yellow-800' },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low:      { label: 'Low',      color: 'text-gray-500' },
  medium:   { label: 'Medium',   color: 'text-blue-400' },
  high:     { label: 'High',     color: 'text-yellow-400' },
  critical: { label: 'Critical', color: 'text-red-400' },
};

type SortKey = 'priority' | 'status' | 'progress' | 'createdAt';

const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const statusOrder: Record<TaskStatus, number> = { running: 0, queued: 1, paused: 2, failed: 3, completed: 4 };

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'priority', dir: 'asc' });

  const filtered = (statusFilter === 'all' ? allTasks : allTasks.filter(t => t.status === statusFilter))
    .slice()
    .sort((a, b) => {
      let cmp = 0;
      if (sort.key === 'priority') cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sort.key === 'status') cmp = statusOrder[a.status] - statusOrder[b.status];
      if (sort.key === 'progress') cmp = a.progress - b.progress;
      if (sort.key === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort.dir === 'asc' ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sort.key !== k) return <ChevronDown size={12} className="text-gray-700" />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">{allTasks.length} total tasks across all agents</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'running', 'queued', 'completed', 'failed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${
                statusFilter === s
                  ? 'bg-blue-600/20 text-blue-400 border-blue-700'
                  : 'text-gray-400 border-[#1a2236] hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a2236]">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Task</th>
              <th
                className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:text-gray-300 whitespace-nowrap select-none"
                onClick={() => toggleSort('status')}
              >
                <span className="flex items-center gap-1">Status <SortIcon k="status" /></span>
              </th>
              <th
                className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:text-gray-300 whitespace-nowrap select-none"
                onClick={() => toggleSort('priority')}
              >
                <span className="flex items-center gap-1">Priority <SortIcon k="priority" /></span>
              </th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Agent</th>
              <th
                className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:text-gray-300 whitespace-nowrap select-none w-40"
                onClick={() => toggleSort('progress')}
              >
                <span className="flex items-center gap-1">Progress <SortIcon k="progress" /></span>
              </th>
              <th
                className="text-left px-4 py-3 text-gray-500 font-medium cursor-pointer hover:text-gray-300 whitespace-nowrap select-none"
                onClick={() => toggleSort('createdAt')}
              >
                <span className="flex items-center gap-1">Created <SortIcon k="createdAt" /></span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2236]">
            {filtered.map(task => {
              const sc = statusConfig[task.status];
              const pc = priorityConfig[task.priority];
              return (
                <tr key={task.id} className="hover:bg-[#0e1628] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-200">{task.title}</div>
                    <div className="text-xs text-gray-600 mt-0.5 truncate max-w-xs">{task.description}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${sc.badge}`}>{sc.label}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium flex items-center gap-1 ${pc.color}`}>
                      {task.priority === 'critical' && <AlertTriangle size={11} />}
                      {pc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{task.agentName}</td>
                  <td className="px-4 py-3.5 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1a2236] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'failed' ? 'bg-red-500' :
                            task.status === 'queued' ? 'bg-gray-600' : 'bg-blue-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-7 text-right">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600 text-xs whitespace-nowrap">
                    {new Date(task.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <ListTodo size={32} className="mx-auto mb-3 opacity-30" />
            No tasks match the current filter
          </div>
        )}
      </div>
    </div>
  );
}
