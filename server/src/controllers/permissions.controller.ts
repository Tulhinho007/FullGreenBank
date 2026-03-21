import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as permissionsService from '../services/permissions.service'
import { prisma } from '../models/prismaClient'
import { sendSuccess, sendError } from '../utils/response'

// GET /api/permissions/:userId
export const getUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestor = req.user!
    const { userId } = req.params

    // Apenas ADMIN e MASTER podem ver permissões
    if (!['ADMIN', 'MASTER'].includes(requestor.role)) {
      sendError(res, 'Acesso negado', 403)
      return
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      sendError(res, 'Usuário não encontrado', 404)
      return
    }

    // ADMIN não pode ver permissões de MASTER
    if (requestor.role === 'ADMIN' && targetUser.role === 'MASTER') {
      sendError(res, 'Acesso negado', 403)
      return
    }

    const permissions = await permissionsService.getUserPermissions(userId)
    sendSuccess(res, { user: { id: targetUser.id, name: targetUser.name, role: targetUser.role }, permissions })
  } catch {
    sendError(res, 'Erro ao buscar permissões', 500)
  }
}

// PUT /api/permissions/:userId
export const saveUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestor = req.user!
    const { userId } = req.params
    const { permissions } = req.body

    // Apenas ADMIN e MASTER podem editar permissões
    if (!['ADMIN', 'MASTER'].includes(requestor.role)) {
      sendError(res, 'Acesso negado', 403)
      return
    }

    if (!Array.isArray(permissions)) {
      sendError(res, 'Formato inválido', 400)
      return
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      sendError(res, 'Usuário não encontrado', 404)
      return
    }

    // ADMIN não pode editar permissões de MASTER
    if (requestor.role === 'ADMIN' && targetUser.role === 'MASTER') {
      sendError(res, 'ADMIN não pode editar permissões de MASTER', 403)
      return
    }

    // ADMIN não pode editar outro ADMIN
    if (requestor.role === 'ADMIN' && targetUser.role === 'ADMIN' && requestor.userId !== userId) {
      sendError(res, 'ADMIN não pode editar permissões de outro ADMIN', 403)
      return
    }

    await permissionsService.saveUserPermissions(userId, permissions)
    sendSuccess(res, null, 'Permissões salvas com sucesso!')
  } catch {
    sendError(res, 'Erro ao salvar permissões', 500)
  }
}

// GET /api/permissions/pages — lista todas as páginas do sistema
export const getSystemPages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!['ADMIN', 'MASTER'].includes(req.user!.role)) {
      sendError(res, 'Acesso negado', 403)
      return
    }
    sendSuccess(res, permissionsService.SYSTEM_PAGES)
  } catch {
    sendError(res, 'Erro ao buscar páginas', 500)
  }
}
