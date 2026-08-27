import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { LoginPage } from './auth/LoginPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { AttendancePage } from './pages/AttendancePage'
import { DashboardPage } from './pages/DashboardPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { LeavePage } from './pages/LeavePage'
import { PharmacyOverviewPage } from './pages/PharmacyOverviewPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { StaffPage } from './pages/StaffPage'
import { TasksPage } from './pages/TasksPage'
import { TrainingPage } from './pages/TrainingPage'
import { EmployeeFormPage } from './staff/EmployeeFormPage'
import { EmployeeProfilePage } from './staff/EmployeeProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="staff/new" element={<EmployeeFormPage mode="create" />} />
            <Route path="staff/:employeeId" element={<EmployeeProfilePage />} />
            <Route path="staff/:employeeId/edit" element={<EmployeeFormPage mode="edit" />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="pharmacy" element={<PharmacyOverviewPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
