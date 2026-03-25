import { prisma } from '../models/prismaClient'

// Mapa de todas as páginas do sistema com módulo e label
export const SYSTEM_PAGES = [
  // Análise
  { module: 'analise',       pageName: 'dashboard',          pageLabel: 'Dashboard' },
  { module: 'analise',       pageName: 'tips',               pageLabel: 'Dicas' },
  { module: 'analise',       pageName: 'tipsters',           pageLabel: 'Tipsters' },
  { module: 'analise',       pageName: 'reports-tips',       pageLabel: 'Histórico de Dicas' },
  { module: 'analise',       pageName: 'reports',            pageLabel: 'Performance' },
  // Gestão
  { module: 'gestao',        pageName: 'gestao-banca',       pageLabel: 'Bancas' },
  { module: 'gestao',        pageName: 'investimentos',      pageLabel: 'Investimentos' },
  { module: 'gestao',        pageName: 'alavancagem',        pageLabel: 'Alavancagem' },
  { module: 'gestao',        pageName: 'calculadora',        pageLabel: 'Calculadora' },
  { module: 'gestao',        pageName: 'dicas-gestao',       pageLabel: 'Dicas de Gestão' },

  { module: 'gestao',        pageName: 'historico',          pageLabel: 'Histórico de Contratos' },
  // Financeiro (admin)
  { module: 'financeiro',    pageName: 'pagamentos',         pageLabel: 'Assinaturas' },

  { module: 'financeiro',    pageName: 'transacoes',         pageLabel: 'Transações' },

  // Administração
  { module: 'admin',         pageName: 'admin-users',        pageLabel: 'Usuários' },
  { module: 'admin',         pageName: 'admin-cadastros',    pageLabel: 'Cadastros' },
  { module: 'admin',         pageName: 'admin-solicitacoes', pageLabel: 'Solicitações' },
  { module: 'admin',         pageName: 'admin-support',      pageLabel: 'Suporte & Feedback' },
  { module: 'admin',         pageName: 'admin-log',          pageLabel: 'Logs / Eventos' },
  { module: 'admin',         pageName: 'admin-permissoes',   pageLabel: 'Controle de Acesso' },
]

export interface PermissionInput {
  pageName: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

/**
 * Busca todas as permissões de um usuário.
 * Se não existir registro para uma página, retorna false em tudo.
 */
export const getUserPermissions = async (userId: string) => {
  const saved = await prisma.userPermission.findMany({ where: { userId } })

  return SYSTEM_PAGES.map((page) => {
    const found = saved.find((p) => p.pageName === page.pageName)
    return {
      ...page,
      canView:   found?.canView   ?? false,
      canEdit:   found?.canEdit   ?? false,
      canDelete: found?.canDelete ?? false,
    }
  })
}

/**
 * Salva/atualiza as permissões de um usuário em lote (upsert).
 * MASTER não pode ser editado por ADMIN — validar no controller.
 */
export const saveUserPermissions = async (userId: string, permissions: PermissionInput[]) => {
  const ops = permissions.map((p) =>
    prisma.userPermission.upsert({
      where: { userId_pageName: { userId, pageName: p.pageName } },
      update: { canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete },
      create: {
        userId,
        pageName:  p.pageName,
        pageLabel: SYSTEM_PAGES.find((s) => s.pageName === p.pageName)?.pageLabel ?? p.pageName,
        module:    SYSTEM_PAGES.find((s) => s.pageName === p.pageName)?.module    ?? 'outro',
        canView:   p.canView,
        canEdit:   p.canEdit,
        canDelete: p.canDelete,
      },
    })
  )
  return prisma.$transaction(ops)
}

/**
 * Copia as permissões de um usuário para outro (útil ao criar novo membro)
 */
export const copyPermissions = async (fromUserId: string, toUserId: string) => {
  const source = await prisma.userPermission.findMany({ where: { userId: fromUserId } })
  const ops = source.map((p) =>
    prisma.userPermission.upsert({
      where: { userId_pageName: { userId: toUserId, pageName: p.pageName } },
      update: { canView: p.canView, canEdit: p.canEdit, canDelete: p.canDelete },
      create: { ...p, id: undefined, userId: toUserId, createdAt: undefined, updatedAt: undefined },
    })
  )
  return prisma.$transaction(ops)
}
