import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Token de autenticação não fornecido', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
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
