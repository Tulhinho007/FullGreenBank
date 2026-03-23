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
  try {
    await api.post('/logs', entry)
  } catch {
    // Silent — log nunca deve quebrar a aplicação
  }
}