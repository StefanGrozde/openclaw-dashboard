import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  ListTodo,
  FolderOpen,
  ScrollText,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/workflows', icon: GitBranch, label: 'Workflows' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/files', icon: FolderOpen, label: 'File System' },
  { to: '/operations', icon: ScrollText, label: 'Operations' },
];

export default function Sidebar() {
  return (
    <aside className="fixed top-14 left-0 bottom-0 w-[220px] bg-[#0e1320] border-r border-[#1a2236] flex flex-col z-40">
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-700/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#141c2e] border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-[#1a2236]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group ${
              isActive
                ? 'bg-blue-600/15 text-blue-400 border border-blue-700/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#141c2e] border border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={16} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />
              <span className="font-medium">Settings</span>
            </>
          )}
        </NavLink>

        {/* Version tag */}
        <div className="mt-3 px-3 text-[11px] text-gray-600">
          Openclaw v0.1.0
        </div>
      </div>
    </aside>
  );
}
