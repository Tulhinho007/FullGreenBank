import api from './api'

interface LogEntry {
  userEmail: string
  userName: string
  userRole: string
  category: 'Auth' | 'Dicas' | 'Usuários' | 'Admin' | 'Sistema' | 'Financeiro' | 'Segurança' | 'Operacional'
  action: string
  detail: string
  userId?: string
}

// Fila para evitar múltiplas chamadas simultâneas falhando silenciosamente
export const addLog = async (entry: LogEntry): Promise<void> => {
  try {
    await api.post('/logs', entry)
  } catch {
    // Silent — log nunca deve quebrar a aplicação
  }
}
