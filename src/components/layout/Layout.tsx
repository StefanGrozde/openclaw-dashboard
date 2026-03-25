import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#080b12]">
      <Topbar />
      <Sidebar />
      <main className="ml-[220px] mt-14 p-6 min-h-[calc(100vh-56px)]">
        <Outlet />
      </main>
    </div>
  );
}
