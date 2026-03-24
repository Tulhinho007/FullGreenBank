import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getUserById } from '../services/user.service';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;
    const result = await registerUser({ name, email, phone, password });
    
    // Set the cookie if register automatically logs the user in
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('fgb_token', result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });
    
    // Do not return the token in the body anymore for better security
    const { token, ...userData } = result;
    sendSuccess(res, userData, 'Cadastro realizado com sucesso!', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar';
    sendError(res, message, 400);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('fgb_token', result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });
    
    const { token, ...userData } = result;
    sendSuccess(res, userData, 'Login realizado com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autenticar';
    sendError(res, message, 401);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('fgb_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });
    sendSuccess(res, null, 'Logout realizado com sucesso!');
  } catch (error) {
    sendError(res, 'Erro ao fazer logout', 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Não autenticado', 401);
      return;
    }
    const user = await getUserById(req.user.userId);
    if (!user) {
      sendError(res, 'Usuário não encontrado', 404);
      return;
    }
    sendSuccess(res, user);
  } catch (error) {
    console.error("ERRO NO GET ME:", error);
    sendError(res, "Erro interno ao carregar perfil", 500);
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendError(res, 'Refresh token não fornecido', 401);
      return;
    }
    const payload = verifyRefreshToken(refreshToken);
    const newAccessToken  = generateToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('fgb_token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });
    
    sendSuccess(res, { refreshToken: newRefreshToken });
  } catch {
    sendError(res, 'Refresh token inválido ou expirado', 401);
  }
};
