import { Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from './components/auth/AdminRoute'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import AdminPage from './pages/AdminPage'
import BuildingPlanPage from './pages/BuildingPlanPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import PendingApprovalPage from './pages/PendingApprovalPage'
import PlotDetailPage from './pages/PlotDetailPage'
import PlotsPage from './pages/PlotsPage'
import RegisterPage from './pages/RegisterPage'
import SurveyPage from './pages/SurveyPage'
import TreeDetailPage from './pages/TreeDetailPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pending" element={<PendingApprovalPage />} />
      <Route path="/pending-approval" element={<Navigate to="/pending" replace />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/building-plan" replace />} />
        <Route path="/plots" element={<PlotsPage />} />
        <Route path="/plots/:plotCode" element={<PlotDetailPage />} />
        <Route path="/trees/:treeCode" element={<TreeDetailPage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/building-plan" element={<BuildingPlanPage />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/building-plan" replace />} />
    </Routes>
  )
}
