import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Token de autenticação não fornecido', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;

    // --- Impersonation Support ---
    const impersonateId = req.headers['x-impersonate-user-id'] as string;
    if (impersonateId && (decoded.role === 'ADMIN' || decoded.role === 'MASTER')) {
      const targetUser = await prisma.user.findUnique({
        where: { id: impersonateId },
        select: { id: true, name: true, email: true, role: true }
      });

      if (targetUser) {
        req.user = {
          userId: targetUser.id,
          role: targetUser.role as any,
          email: targetUser.email,
          name: targetUser.name
        };
      }
    }

    next();
  } catch {
    sendError(res, 'Token inválido ou expirado', 401);
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Não autenticado', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Sem permissão para acessar este recurso', 403);
      return;
    }

    next();
  };
};

export const checkReadOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'TESTER' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    sendError(res, 'Conta de visualização não permite alterações', 403);
    return;
  }
  next();
};
