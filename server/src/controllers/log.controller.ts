import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as logService from '../services/log.service'
import { sendSuccess, sendError } from '../utils/response'

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const log = await logService.createLog(req.body)
    sendSuccess(res, log, 'Log registrado', 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar log'
    sendError(res, message, 400)
  }
}

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page     = Number(req.query.page)     || 1
    const limit    = Number(req.query.limit)    || 100
    const category = req.query.category as string | undefined
    const userEmail = req.query.userEmail as string | undefined
    const result   = await logService.getLogs(page, limit, category, userEmail)
    sendSuccess(res, result)
  } catch {
    sendError(res, 'Erro ao buscar logs', 500)
  }
}

export const clear = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role
    if (role !== 'MASTER' && role !== 'ADMIN') {
      sendError(res, 'Acesso negado', 403)
      return
    }
    await logService.clearLogs()
    sendSuccess(res, null, 'Logs removidos com sucesso')
  } catch {
    sendError(res, 'Erro ao limpar logs', 500)
  }
}
