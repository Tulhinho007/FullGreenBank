// ─── subscription.ts ─────────────────────────────────────────────────────────
// Central utility for subscription lifecycle management.
// Implements Rules 1-6 from the subscription specification.

export type SubscriptionStatus = 'ATIVO' | 'PENDENTE' | 'ATRASADO' | 'CANCELADO'

export interface SubscriptionFields {
  paymentStatus?: string
  dueDate?: string | null
  purchaseDate?: string | null
  lastPaymentDate?: string | null
  isActive?: boolean
  plan?: string
  role?: string
}

// ─── RULE 2 & 5 ─────────────────────────────────────────────────────────────
/**
 * checkSubscription(user)
 * Verifies whether the user's subscription is still valid based on dueDate.
 * - Admins/Masters are always considered active.
 * - If dueDate has passed → ATRASADO, isActive = false
 * - If dueDate is still in the future → ATIVO, isActive = true
 * - If no dueDate → PENDENTE, isActive = false
 */
export const checkSubscription = (user: SubscriptionFields): {
  status: SubscriptionStatus
  isActive: boolean
} => {
  // Admins and Masters always have full access
  if (user.role === 'ADMIN' || user.role === 'MASTER') {
    return { status: 'ATIVO', isActive: true }
  }

  // If subscription was explicitly cancelled
  if (user.paymentStatus === 'CANCELADO') {
    return { status: 'CANCELADO', isActive: false }
  }

  // If there's no due date, subscription is pending
  if (!user.dueDate) {
    return { status: 'PENDENTE', isActive: false }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Parse dueDate at end of day for grace
  const due = new Date(user.dueDate + 'T23:59:59')

  if (today > due) {
    return { status: 'ATRASADO', isActive: false }
  }

  return { status: 'ATIVO', isActive: true }
}

// ─── RULE 1 & 3 & 6 ─────────────────────────────────────────────────────────
/**
 * createPayment(overrides)
 * Builds a full payment update payload.
 * - ALWAYS uses today as base (never extends from old dueDate).
 * - Sets purchaseDate, lastPaymentDate = today
 * - Sets dueDate = today + 30 days
 * - Sets paymentStatus = ATIVO, isActive = true
 */
export const createPayment = (overrides: {
  plan?: string
  value?: number | null
  payMethod?: string
  notes?: string
}): {
  purchaseDate: string
  lastPaymentDate: string
  dueDate: string
  paymentStatus: SubscriptionStatus
  isActive: boolean
  plan?: string
  value?: number | null
  payMethod?: string
  notes?: string
} => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD

  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 30)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  return {
    purchaseDate: todayStr,
    lastPaymentDate: todayStr,
    dueDate: dueDateStr,
    paymentStatus: 'ATIVO',
    isActive: true,
    ...overrides,
  }
}

// ─── Helper: format date for display ─────────────────────────────────────────
export const formatSubscriptionDate = (d: string | null | undefined): string => {
  if (!d) return '—'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
  } catch {
    return '—'
  }
}
