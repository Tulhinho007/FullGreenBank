export const formatCurrency = (value: number, currency = 'BRL', locale = 'pt-BR') => {
  let converted = value
  let loc = locale
  
  // Realiza conversão aproximada (como se BRL fosse a moeda base do sistema)
  if (currency === 'USD') {
    converted = value / 5.0
    loc = 'en-US'
  } else if (currency === 'EUR') {
    converted = value / 5.5
    loc = 'en-IE'
  }
  
  return new Intl.NumberFormat(loc, { style: 'currency', currency }).format(converted)
}

export const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr))

export const formatDateTime = (dateStr: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))

export const calcROI = (profit: number, totalStake: number) => {
  if (totalStake === 0) return 0
  return ((profit / totalStake) * 100).toFixed(2)
}

export const resultLabel: Record<string, { label: string; cls: string }> = {
  GREEN:   { label: 'Green ✅',   cls: 'badge-green'  },
  RED:     { label: 'Red ❌',     cls: 'badge-red'    },
  VOID:    { label: 'Void ↩️',   cls: 'badge-yellow' },
  PENDING: { label: 'Pendente ⏳', cls: 'badge-gray'   },
}

export const roleLabelMap: Record<string, { label: string; color: string }> = {
  MASTER: { label: 'Master', color: 'text-yellow-400' },
  ADMIN:  { label: 'Admin',  color: 'text-blue-400'   },
  TESTER: { label: 'Visualizador', color: 'text-purple-400' },
  MEMBRO: { label: 'Membro',       color: 'text-slate-400'  },
}

export const getRoleInfo = (role?: string) => 
  roleLabelMap[role || 'MEMBRO'] || roleLabelMap['MEMBRO']
