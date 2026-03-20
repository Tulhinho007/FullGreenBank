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
import { AdminCadastrosPage } from './pages/AdminCadastrosPage'
import { AdminSupportPage }   from './pages/AdminSupportPage'
import { AdminSolicitacoesPage } from './pages/AdminSolicitacoesPage'
import { SystemLogPage }               from './pages/SystemLogPage'
import { FinanceiroPagamentosPage }   from './pages/FinanceiroPagamentosPage'
import { BancaGerenciadaPage }         from './pages/BancaGerenciadaPage'
import { GestaoBancaPage }             from './pages/GestaoBancaPage'
import { InvestimentosPage }           from './pages/InvestimentosPage'
import { GestaoTipstersPage }          from './pages/GestaoTipstersPage'
import { ReportsPage }                 from './pages/ReportsPage'
import { HistoricoDicasPage }          from './pages/HistoricoDicasPage'
import { HistoryPage }                 from './pages/HistoryPage'
import { LegalPage }                   from './pages/LegalPage'
import { PlanosPage }                  from './pages/PlanosPage'
import { FAQPage }                     from './pages/FAQPage'
import { ReportPage }                  from './pages/ReportPage'
import { GuidePage }                   from './pages/GuidePage'
import { AlavancagemPage } from './pages/AlavancagemPage'

function App() {
  return (
    <AuthProvider>
    <ThemeProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Institutional - Publicly accessible */}
        <Route path="/planos"    element={<PlanosPage />} />
        <Route path="/legal/:type" element={<LegalPage />} />

        {/* Protected - all authenticated users */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/gestao/banca" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tips"      element={<TipsPage />} />
          <Route path="profile"   element={<ProfilePage />} />
          <Route path="reports"   element={<ReportsPage />} />
          <Route path="reports/tips" element={<HistoricoDicasPage />} />
          {/* Institutional - inside layout */}
          <Route path="faq"       element={<FAQPage />} />
          <Route path="report"    element={<ReportPage />} />
          <Route path="guide"     element={<GuidePage />} />


          {/* Admin & Master only */}
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER', 'TESTER']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/cadastros"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER', 'TESTER']}>
                <AdminCadastrosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/support"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER']}>
                <AdminSupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/solicitacoes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER']}>
                <AdminSolicitacoesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/log"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER', 'TESTER']}>
                <SystemLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="financeiro/pagamentos"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER', 'TESTER']}>
                <FinanceiroPagamentosPage />
              </ProtectedRoute>
            }
          />
          <Route path="financeiro/banca-gerenciada"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MASTER', 'TESTER']}>
                <BancaGerenciadaPage />
              </ProtectedRoute>
            }
          />
          <Route path="gestao/banca" element={<GestaoBancaPage />} />
          <Route path="gestao/investimentos" element={<InvestimentosPage />} />
          <Route path="gestao/tipsters" element={<GestaoTipstersPage />} />
          <Route path="gestao/alavancagem" element={<AlavancagemPage />} />
          <Route path="gestao/historico" element={<HistoryPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
    </AuthProvider>
  )
}

export default App
