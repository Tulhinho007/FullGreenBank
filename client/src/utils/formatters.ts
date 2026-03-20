export const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))
  } catch {
    return '—'
  }
}

export const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return '—'
  }
}

export const calcROI = (profit: number, totalStake: number) => {
  if (totalStake === 0) return 0
  return ((profit / totalStake) * 100).toFixed(2)
}

export const resultLabel: Record<string, { label: string; cls: string }> = {
  GREEN:   { label: 'Green ✅',   cls: 'badge-green'  },
  RED:     { label: 'Red ❌',     cls: 'badge-red'    },
  VOID:    { label: 'Void ↩️',   cls: 'badge-yellow' },
  PENDING: { label: 'Pendente ⏳', cls: 'badge-gray'   },
  CASHOUT: { label: 'Cashout 🟠', cls: 'badge-orange' },
}

export const roleLabelMap: Record<string, { label: string; color: string }> = {
  MASTER: { label: 'Master', color: 'text-yellow-400' },
  ADMIN:  { label: 'Admin',  color: 'text-blue-400'   },
  TESTER: { label: 'Visualizador', color: 'text-purple-400' },
  MEMBRO: { label: 'Membro',       color: 'text-slate-400'  },
}

export const getRoleInfo = (role?: string) => {
  const normalized = (role || 'MEMBRO').toUpperCase()
  return roleLabelMap[normalized] || roleLabelMap['MEMBRO']
}
