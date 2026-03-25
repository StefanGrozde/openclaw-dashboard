import { useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, Info, Filter } from 'lucide-react';
import { operations as allOps } from '../data/mock';
import type { LogLevel } from '../types';

const levelConfig: Record<LogLevel, {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  rowBg: string;
  badge: string;
}> = {
  info:    { label: 'Info',    icon: Info,         iconColor: 'text-blue-400',   rowBg: 'hover:bg-blue-950/10',   badge: 'bg-blue-950/50 text-blue-400 border-blue-900' },
  success: { label: 'Success', icon: CheckCircle2, iconColor: 'text-green-400',  rowBg: 'hover:bg-green-950/10',  badge: 'bg-green-950/50 text-green-400 border-green-900' },
  warning: { label: 'Warning', icon: AlertTriangle,iconColor: 'text-yellow-400', rowBg: 'hover:bg-yellow-950/10', badge: 'bg-yellow-950/50 text-yellow-400 border-yellow-900' },
  error:   { label: 'Error',   icon: AlertTriangle,iconColor: 'text-red-400',    rowBg: 'hover:bg-red-950/10',    badge: 'bg-red-950/50 text-red-400 border-red-900' },
};

export default function Operations() {
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = levelFilter === 'all' ? allOps : allOps.filter(o => o.level === levelFilter);

  const counts = {
    all: allOps.length,
    info: allOps.filter(o => o.level === 'info').length,
    success: allOps.filter(o => o.level === 'success').length,
    warning: allOps.filter(o => o.level === 'warning').length,
    error: allOps.filter(o => o.level === 'error').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Operations Log</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time system and agent operation stream</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-gray-600" />
          {(['all', 'info', 'success', 'warning', 'error'] as const).map(level => {
            const lc = level !== 'all' ? levelConfig[level] : null;
            return (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all border ${
                  levelFilter === level
                    ? 'bg-blue-600/20 text-blue-400 border-blue-700'
                    : 'text-gray-400 border-[#1a2236] hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {lc && <lc.icon size={11} className={lc.iconColor} />}
                {level} ({counts[level]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Live — {filtered.length} entries
      </div>

      <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl overflow-hidden">
        <div className="divide-y divide-[#1a2236]">
          {filtered.map(op => {
            const lc = levelConfig[op.level];
            const Icon = lc.icon;
            const isExpanded = expanded === op.id;

            return (
              <button
                key={op.id}
                onClick={() => setExpanded(isExpanded ? null : op.id)}
                className={`w-full text-left px-5 py-3 transition-colors ${lc.rowBg} ${op.details ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={14} className={`${lc.iconColor} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${lc.badge}`}>
                        {lc.label}
                      </span>
                      <span className="text-xs text-blue-400/80 font-mono shrink-0">{op.source}</span>
                      <span className="text-sm text-gray-300">{op.message}</span>
                    </div>
                    {isExpanded && op.details && (
                      <div className="mt-2 px-3 py-2 bg-[#080b12] rounded-md border border-[#1a2236] text-xs text-gray-400 font-mono whitespace-pre-wrap">
                        {op.details}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 shrink-0 font-mono">
                    {new Date(op.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Activity size={32} className="mx-auto mb-3 opacity-30" />
            No operations match the current filter
          </div>
        )}
      </div>
    </div>
  );
}
