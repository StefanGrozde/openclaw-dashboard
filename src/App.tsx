import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Workflows from './pages/Workflows';
import Tasks from './pages/Tasks';
import FileSystem from './pages/FileSystem';
import Operations from './pages/Operations';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="files" element={<FileSystem />} />
          <Route path="operations" element={<Operations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
