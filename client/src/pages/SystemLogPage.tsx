import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { formatDateTime } from '../utils/formatters'
import { Activity, Users, Filter, Printer, FileText, FileSpreadsheet, Trash2 } from 'lucide-react'
import api from '../services/api'
import { addLog } from '../services/log.service'

interface LogEntry {
  id: string
  createdAt: string
  userEmail: string
  userName: string
  userRole: string
  category: string
  action: string
  detail: string
}

const categoryColors: Record<string, string> = {
  Auth:        'bg-amber-50 text-amber-600 border-amber-100',
  Dicas:       'bg-emerald-50 text-emerald-600 border-emerald-100',
  Usuários:    'bg-blue-50 text-blue-600 border-blue-100',
  Admin:       'bg-purple-50 text-purple-600 border-purple-100',
  Sistema:     'bg-slate-50 text-slate-500 border-slate-200',
  Financeiro:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  Segurança:   'bg-rose-50 text-rose-600 border-rose-100',
  Operacional: 'bg-sky-50 text-sky-600 border-sky-100',
  Tips:        'bg-green-50 text-green-600 border-green-100',
  Suporte:     'bg-indigo-50 text-indigo-600 border-indigo-100',
  'Controle de Acesso': 'bg-violet-50 text-violet-600 border-violet-100',
}

const roleLabels: Record<string, { label: string, color: string }> = {
  MASTER: { label: 'Master', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  ADMIN:  { label: 'Admin',  color: 'bg-blue-50 text-blue-600 border-blue-100' },
  MEMBRO: { label: 'Membro', color: 'bg-slate-50 text-slate-400 border-slate-100' },
}

const groupByDate = (logs: LogEntry[]) => {
  const groups: Record<string, LogEntry[]> = {}
  logs.forEach(log => {
    const date = new Date(log.createdAt).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }).toUpperCase()
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
  })
  return groups
}

const CATEGORIES = ['Todas as categorias', 'Auth', 'Tips', 'Usuários', 'Admin', 'Sistema', 'Financeiro', 'Segurança', 'Operacional', 'Suporte', 'Controle de Acesso']

export const SystemLogPage = () => {
  const { user } = useAuth()
  const isReadOnly = user?.role === 'TESTER'

  const [logs,       setLogs]       = useState<LogEntry[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filterUser, setFilterUser] = useState('Todos os usuários')
  const [filterCat,  setFilterCat]  = useState('Todas as categorias')
  const [users,      setUsers]      = useState<string[]>([])

  const load = useCallback(async () => {
    try {
      const params: any = { limit: 500 }
      if (filterCat  !== 'Todas as categorias') params.category  = filterCat
      if (filterUser !== 'Todos os usuários')   params.userEmail = filterUser
      const res = await api.get('/logs', { params })
      const data: LogEntry[] = res.data.data?.logs || []
      setLogs(data)
      const uniqueUsers = [...new Set(data.map(l => l.userEmail))]
      setUsers(uniqueUsers)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [filterCat, filterUser])

  useEffect(() => {
    load()
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
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load, user])

  const filtered = logs

  const grouped = groupByDate(filtered)

  const activeUsers = new Set(
    logs.filter(l => {
      const diff = Date.now() - new Date(l.createdAt).getTime()
      return diff < 30 * 60 * 1000
    }).map(l => l.userEmail)
  ).size

  const lastActivity = logs[0]?.createdAt ? formatDateTime(logs[0].createdAt) : '—'

  const handleClear = async () => {
    if (!window.confirm('Limpar todo o log do sistema?')) return
    try {
      await api.delete('/logs/clear')
      load()
    } catch {
      alert('Erro ao limpar logs')
    }
  }

  const exportCSV = () => {
    const header = ['Data/Hora', 'Usuário', 'Email', 'Role', 'Categoria', 'Ação', 'Detalhe']
    const rows = filtered.map(l => [
      formatDateTime(l.createdAt),
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

  const exportPDF = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = filtered.map(l => `
      <tr>
        <td>${formatDateTime(l.createdAt)}</td>
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

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-emerald-500" />
            Log do Sistema
          </h2>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Atividade de todos os usuários em tempo real</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <button onClick={exportCSV}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <FileSpreadsheet size={14} className="text-emerald-500" /> Excel
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <FileText size={14} className="text-rose-500" /> PDF
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
            <Printer size={14} className="text-blue-500" /> Imprimir
          </button>
          {!isReadOnly && (
            <button onClick={handleClear}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-rose-100 bg-rose-50/30 text-rose-500 hover:bg-rose-50 transition-all shadow-sm">
              <Trash2 size={14} /> Limpar Log
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Geral:</span>
          <span className="text-sm font-black text-slate-800 tracking-tight">{filtered.length} eventos</span>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos (30m):</span>
          <span className="text-sm font-black text-slate-800 tracking-tight">{activeUsers} usuários</span>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm pl-4">
          <Activity size={12} className="text-slate-300" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último disparo:</span>
          <span className="text-sm font-black text-slate-800 tracking-tight lowercase">{lastActivity}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-16 text-center border border-slate-100 rounded-[2.5rem] shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Activity size={32} className="text-slate-200" />
          </div>
          <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Nenhum evento registrado</p>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">O log registra automaticamente logins, cadastros de dicas e ações administrativas críticas.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden mb-10">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="px-8 py-3 bg-slate-50/50 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">{date}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {entries.map((log) => {
                  const catCls = categoryColors[log.category] || categoryColors['Sistema']
                  return (
                    <div key={log.id}
                      className="flex items-start gap-6 px-8 py-5 hover:bg-slate-50/50 transition-all group"
                    >
                      <div className="w-20 shrink-0 pt-1">
                        <span className="text-xs font-black text-slate-300 group-hover:text-slate-400 transition-colors">
                          {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="w-56 shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-slate-800 tracking-tight uppercase truncate max-w-[160px]">{log.userName}</p>
                          {log.userRole !== 'MEMBRO' && (
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                              roleLabels[log.userRole]?.color || roleLabels.MEMBRO.color
                            }`}>
                              {roleLabels[log.userRole]?.label || log.userRole}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{log.userEmail}</p>
                      </div>
                      <div className="w-32 shrink-0 pt-0.5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${catCls}`}>
                          {log.category}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 tracking-tight">{log.action}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed opacity-80">{log.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
