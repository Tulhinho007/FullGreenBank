import { prisma } from '../models/prismaClient'
import { Request, Response, NextFunction } from 'express'

interface LogSecurityEventParams {
  ip: string
  route: string
  method: string
  statusCode: number
  userId?: string
  userAgent?: string
  reason: string
}

export const logSecurityEvent = async (params: LogSecurityEventParams) => {
  try {
    await prisma.securityLog.create({ data: params })
  } catch {
    // Não deixa erro de log derrubar a aplicação
    console.error('Erro ao registrar log de segurança')
  }
}

// Middleware — registra automaticamente respostas 401, 403 e 429
export const securityLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send.bind(res)

  res.send = function (body) {
    const statusCode = res.statusCode
    if ([401, 403, 429].includes(statusCode)) {
      logSecurityEvent({
        ip:         req.ip || req.socket.remoteAddress || 'unknown',
        route:      req.originalUrl,
        method:     req.method,
        statusCode,
        userAgent:  req.headers['user-agent'],
        reason:
          statusCode === 401 ? 'UNAUTHORIZED' :
          statusCode === 403 ? 'FORBIDDEN' :
          statusCode === 429 ? 'RATE_LIMIT' : 'UNKNOWN',
      })
    }
    return originalSend(body)
  }

  next()
}