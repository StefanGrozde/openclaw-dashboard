import { Bell, Search, Zap, Activity } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-14 bg-[#0e1320] border-b border-[#1a2236] flex items-center px-4 gap-4 fixed top-0 left-0 right-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-2 min-w-[220px]">
        <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-white font-bold text-base tracking-widest uppercase">Openclaw</span>
        <span className="text-[10px] text-blue-400 bg-blue-950 border border-blue-800 rounded px-1.5 py-0.5 font-medium ml-1">ADMIN</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search agents, tasks, workflows..."
            className="w-full bg-[#080b12] border border-[#1a2236] rounded-md pl-9 pr-4 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/50"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* System status */}
        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-950/50 border border-green-900 rounded px-2.5 py-1">
          <Activity size={11} className="animate-pulse" />
          <span>Systems Nominal</span>
        </div>

        {/* Notifications */}
        <button className="relative p-1.5 text-gray-400 hover:text-white hover:bg-[#1a2236] rounded transition-colors">
          <Bell size={17} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-[#0e1320]" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          AD
        </div>
      </div>
    </header>
  );
}
