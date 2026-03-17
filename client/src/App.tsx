import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

// Pages
import { LoginPage }          from './pages/LoginPage'
import { RegisterPage }       from './pages/RegisterPage'
import { DashboardPage }      from './pages/DashboardPage'
import { TipsPage }           from './pages/TipsPage'
import { ProfilePage }        from './pages/ProfilePage'
import { AdminUsersPage }     from './pages/AdminUsersPage'
import { AdminNewTipPage }    from './pages/AdminNewTipPage'
import { AdminCadastrosPage } from './pages/AdminCadastrosPage'
import { SystemLogPage }               from './pages/SystemLogPage'
import { FinanceiroPagamentosPage }   from './pages/FinanceiroPagamentosPage'

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected - all authenticated users */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tips"      element={<TipsPage />} />
          <Route path="profile"   element={<ProfilePage />} />

          {/* Admin & Master only */}
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/tips/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER']}>
                <AdminNewTipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/cadastros"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER']}>
                <AdminCadastrosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/log"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER']}>
                <SystemLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="financeiro/pagamentos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER']}>
                <FinanceiroPagamentosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
