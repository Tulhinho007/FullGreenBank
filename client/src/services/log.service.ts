import api from './api'

interface LogEntry {
  userEmail: string
  userName: string
  userRole: string
  category: string
  action: string
  detail: string
  userId?: string
}

export const addLog = async (entry: LogEntry): Promise<void> => {
  console.log('🟡 addLog chamado:', entry)
  try {
    const res = await api.post('/logs', entry)
    console.log('✅ Log salvo:', res.status)
  } catch (err: any) {
    console.error('❌ Erro ao salvar log:', err.response?.data || err.message)
  }
}