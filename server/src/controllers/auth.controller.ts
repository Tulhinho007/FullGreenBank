import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getUserById } from '../services/user.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, username, password } = req.body;
    const result = await registerUser({ name, email, phone, username, password });
    sendSuccess(res, result, 'Cadastro realizado com sucesso!', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao registrar';
    sendError(res, message, 400);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    sendSuccess(res, result, 'Login realizado com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autenticar';
    sendError(res, message, 401);
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
  console.error("ERRO NO LOGIN:", error); // Isso vai imprimir o erro real nos Logs do Railway
  res.status(422).json({ message: "Erro interno no servidor" });
  }
};
