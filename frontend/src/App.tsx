import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/DashboardLayout';
import ComposeView from './components/ComposeView';
import EmailDetailView from './components/EmailDetailView';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="scheduled" replace />} />
        <Route
          path="scheduled"
          element={<DashboardLayout.List mode="scheduled" />}
        />
        <Route path="sent" element={<DashboardLayout.List mode="sent" />} />
        <Route path="compose" element={<ComposeView />} />
        <Route path="email/:id" element={<EmailDetailView />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}