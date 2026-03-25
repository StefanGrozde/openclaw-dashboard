import { useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, Info, Filter } from 'lucide-react';
import { useOperationsStream } from '../ws/useOperationsStream';
import type { LogLevel } from '../types';

const levelConfig: Record<LogLevel, {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  rowBg: string;
  badge: string;
}> = {
  info: { label: 'Info', icon: Info, iconColor: 'text-blue-400', rowBg: 'hover:bg-blue-950/10', badge: 'bg-blue-950/50 text-blue-400 border-blue-900' },
  success: { label: 'Success', icon: CheckCircle2, iconColor: 'text-green-400', rowBg: 'hover:bg-green-950/10', badge: 'bg-green-950/50 text-green-400 border-green-900' },
  warning: { label: 'Warning', icon: AlertTriangle, iconColor: 'text-yellow-400', rowBg: 'hover:bg-yellow-950/10', badge: 'bg-yellow-950/50 text-yellow-400 border-yellow-900' },
  error: { label: 'Error', icon: AlertTriangle, iconColor: 'text-red-400', rowBg: 'hover:bg-red-950/10', badge: 'bg-red-950/50 text-red-400 border-red-900' },
};

export default function Operations() {
  const { liveOperations, isConnected } = useOperationsStream();
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = levelFilter === 'all' ? liveOperations : liveOperations.filter((operation) => operation.level === levelFilter);

  const counts = {
    all: liveOperations.length,
    info: liveOperations.filter((operation) => operation.level === 'info').length,
    success: liveOperations.filter((operation) => operation.level === 'success').length,
    warning: liveOperations.filter((operation) => operation.level === 'warning').length,
    error: liveOperations.filter((operation) => operation.level === 'error').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Operations Log</h1>
          <p className="mt-0.5 text-sm text-gray-500">Real-time system and agent operation stream</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-gray-600" />
          {(['all', 'info', 'success', 'warning', 'error'] as const).map((level) => {
            const levelMeta = level !== 'all' ? levelConfig[level] : null;

            return (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  levelFilter === level
                    ? 'border-blue-700 bg-blue-600/20 text-blue-400'
                    : 'border-[#1a2236] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {levelMeta ? <levelMeta.icon size={11} className={levelMeta.iconColor} /> : null}
                {level} ({counts[level]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600">
        <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'animate-pulse bg-green-400' : 'bg-yellow-400'}`} />
        {isConnected ? 'Live' : 'Polling'} - {filtered.length} entries
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1a2236] bg-[#0e1320]">
        <div className="divide-y divide-[#1a2236]">
          {filtered.map((operation) => {
            const levelMeta = levelConfig[operation.level];
            const Icon = levelMeta.icon;
            const isExpanded = expanded === operation.id;

            return (
              <button
                key={operation.id}
                onClick={() => setExpanded(isExpanded ? null : operation.id)}
                className={`w-full cursor-default px-5 py-3 text-left transition-colors ${levelMeta.rowBg} ${operation.details ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={14} className={`${levelMeta.iconColor} mt-0.5 shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${levelMeta.badge}`}>
                        {levelMeta.label}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-blue-400/80">{operation.source}</span>
                      <span className="text-sm text-gray-300">{operation.message}</span>
                    </div>
                    {isExpanded && operation.details ? (
                      <div className="mt-2 rounded-md border border-[#1a2236] bg-[#080b12] px-3 py-2 font-mono text-xs text-gray-400 whitespace-pre-wrap">
                        {operation.details}
                      </div>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-gray-600">
                    {new Date(operation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-600">
            <Activity size={32} className="mx-auto mb-3 opacity-30" />
            No operations match the current filter
          </div>
        ) : null}
      </div>
    </div>
  );
}
