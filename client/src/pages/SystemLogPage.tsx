import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatDateTime } from '../utils/formatters'
import { Activity, Users, Filter, Printer, FileText, FileSpreadsheet, Trash2 } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  userEmail: string
  userName: string
  userRole: string
  category: 'Auth' | 'Dicas' | 'Usuários' | 'Admin' | 'Sistema' | 'Financeiro'
  action: string
  detail: string
}

const STORAGE_KEY = 'fgb_system_log'
const MAX_LOGS = 500

const categoryColors: Record<string, string> = {
  Auth:     'bg-yellow-900/50 text-yellow-400 border-yellow-800/40',
  Dicas:    'bg-green-900/50  text-green-400  border-green-800/40',
  Usuários: 'bg-blue-900/50   text-blue-400   border-blue-800/40',
  Admin:    'bg-purple-900/50 text-purple-400  border-purple-800/40',
  Sistema:  'bg-slate-700/50  text-slate-300   border-slate-600/40',
  Financeiro: 'bg-emerald-900/50 text-emerald-400 border-emerald-800/40',
}

const roleColor: Record<string, string> = {
  MASTER: 'text-yellow-500',
  ADMIN:  'text-blue-500',
  MEMBRO: 'text-slate-400',
}

// ── Utilitário: salvar log ────────────────────────────────────────────────
export const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
  try {
    const logs: LogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    const updated = [newEntry, ...logs].slice(0, MAX_LOGS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch { /* silent */ }
}

// Agrupar por data
const groupByDate = (logs: LogEntry[]) => {
  const groups: Record<string, LogEntry[]> = {}
  logs.forEach(log => {
    const date = new Date(log.timestamp).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }).toUpperCase()
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
  })
  return groups
}

const CATEGORIES = ['Todas as categorias', 'Auth', 'Dicas', 'Usuários', 'Admin', 'Sistema', 'Financeiro']

export const SystemLogPage = () => {
  const { user } = useAuth()
  const isReadOnly = user?.role === 'TESTER'
  const [logs,       setLogs]       = useState<LogEntry[]>([])
  const [filterUser, setFilterUser] = useState('Todos os usuários')
  const [filterCat,  setFilterCat]  = useState('Todas as categorias')
  const [users,      setUsers]      = useState<string[]>([])

  const load = useCallback(() => {
    try {
      const stored: LogEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setLogs(stored)
      const uniqueUsers = [...new Set(stored.map(l => l.userEmail))]
      setUsers(uniqueUsers)
    } catch { setLogs([]) }
  }, [])

  useEffect(() => {
    load()
    // Registra acesso ao log
    if (user) {
      addLog({
        userEmail: user.email,
        userName:  user.name,
        userRole:  user.role,
        category:  'Admin',
        action:    'Log visualizado',
        detail:    'Acessou a página de Log do Sistema',
      })
    }
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load, user])

  const filtered = Array.isArray(logs) ? logs.filter(l => {
    const byUser = filterUser === 'Todos os usuários' || l.userEmail === filterUser
    const byCat  = filterCat  === 'Todas as categorias' || l.category === filterCat
    return byUser && byCat
  }) : []

  const grouped = groupByDate(filtered)
  const activeUsers = new Set(
    logs.filter(l => {
      const diff = Date.now() - new Date(l.timestamp).getTime()
      return diff < 30 * 60 * 1000 // 30 min
    }).map(l => l.userEmail)
  ).size

  const lastActivity = logs[0]?.timestamp
    ? formatDateTime(logs[0].timestamp)
    : '—'

  const handleClear = () => {
    if (!window.confirm('Limpar todo o log do sistema?')) return
    localStorage.removeItem(STORAGE_KEY)
    load()
  }

  // ── Exportar CSV/Excel ────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ['Data/Hora', 'Usuário', 'Email', 'Role', 'Categoria', 'Ação', 'Detalhe']
    const rows = filtered.map(l => [
      formatDateTime(l.timestamp),
      l.userName,
      l.userEmail,
      l.userRole,
      l.category,
      l.action,
      l.detail,
    ])
    const csvContent = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `log-sistema-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Exportar PDF ─────────────────────────────────────────────────────
  const exportPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = filtered.map(l => `
      <tr>
        <td>${formatDateTime(l.timestamp)}</td>
        <td>${l.userName}<br/><small>${l.userEmail}</small></td>
        <td>${l.userRole}</td>
        <td>${l.category}</td>
        <td>${l.action}</td>
        <td>${l.detail}</td>
      </tr>`).join('')

    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Log do Sistema — Full Green Bank</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; }
        h1   { font-size: 18px; color: #166534; margin-bottom: 4px; }
        p    { color: #64748b; margin: 0 0 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th   { background: #166534; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
        td   { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #f8fafc; }
        small { color: #94a3b8; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>
      <h1>🟢 Log do Sistema — Full Green Bank</h1>
      <p>Gerado em ${formatDateTime(new Date().toISOString())} · ${filtered.length} registros</p>
      <table>
        <thead><tr>
          <th>Data/Hora</th><th>Usuário</th><th>Role</th>
          <th>Categoria</th><th>Ação</th><th>Detalhe</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`)
    win.document.close()
  }

  // ── Imprimir ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <Activity size={18} className="text-green-400" />
            Log do Sistema
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Atividade de todos os usuários em tempo real</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro usuário */}
          <div className="relative">
            <select
              className="input-field py-1.5 pl-8 pr-3 text-xs w-44"
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
            >
              <option>Todos os usuários</option>
              {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <Users size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filtro categoria */}
          <div className="relative">
            <select
              className="input-field py-1.5 pl-8 pr-3 text-xs w-48"
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Exportar CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-700/50 bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
            title="Exportar Excel/CSV"
          >
            <FileSpreadsheet size={13} />Excel
          </button>

          {/* Exportar PDF */}
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-700/50 bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
            title="Exportar PDF"
          >
            <FileText size={13} />PDF
          </button>

          {/* Imprimir */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-700/50 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors"
            title="Imprimir"
          >
            <Printer size={13} />Imprimir
          </button>

          {/* Limpar */}
          {!isReadOnly && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-700/50 bg-red-900/40 text-red-400 hover:bg-red-800/50 transition-colors"
              title="Limpar log"
            >
              <Trash2 size={13} />Limpar Log
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-slate-400">Total:</span>
          <span className="text-sm font-semibold text-white">{filtered.length} eventos</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span className="text-xs text-slate-400">Usuários ativos:</span>
          <span className="text-sm font-semibold text-white">{activeUsers}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-200 border border-surface-300 rounded-lg px-4 py-2.5">
          <span className="text-xs text-slate-400">Última atividade:</span>
          <span className="text-sm font-semibold text-white">{lastActivity}</span>
        </div>
      </div>

      {/* Log table */}
      {filtered.length === 0 ? (
        <div className="card p-16 text-center border border-surface-400">
          <Activity size={36} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Nenhum evento registrado ainda.</p>
          <p className="text-slate-600 text-xs mt-1">O log registra automaticamente logins, cadastros e ações do sistema.</p>
        </div>
      ) : (
        <div className="card border border-surface-400 overflow-hidden">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="px-4 py-2 bg-surface-300/50 border-b border-surface-300">
                <span className="text-[10px] font-semibold text-slate-500 tracking-widest">{date}</span>
              </div>

              {/* Entries */}
              {entries.map((log, i) => {
                const catCls = categoryColors[log.category] || categoryColors['Sistema']
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 px-4 py-3 border-b border-surface-300/50 hover:bg-surface-300/20 transition-colors ${
                      i === entries.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    {/* Time */}
                    <div className="w-16 shrink-0 pt-0.5">
                      <span className="text-xs font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {/* User */}
                    <div className="w-48 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-white truncate max-w-[140px]">{log.userEmail}</p>
                        {log.userRole !== 'MEMBRO' && (
                          <span className={`text-[9px] font-bold ${roleColor[log.userRole] || ''}`}>
                            {log.userRole === 'MASTER' ? 'Master' : 'Admin'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-600 truncate">{log.userEmail}</p>
                    </div>

                    {/* Category badge */}
                    <div className="w-24 shrink-0 pt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catCls} log-cat-light-${log.category}`}>
                        {log.category}
                      </span>
                    </div>

                    {/* Action + Detail */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white">{log.action}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{log.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
