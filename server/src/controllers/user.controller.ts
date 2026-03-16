import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as userService from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    sendSuccess(res, users);
  } catch {
    sendError(res, 'Erro ao buscar usuários', 500);
  }
};

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      sendError(res, 'Usuário não encontrado', 404);
      return;
    }
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Erro ao buscar usuário', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, phone, username, password } = req.body;
    const user = await userService.updateUser(userId, { name, phone, username, password });
    sendSuccess(res, user, 'Perfil atualizado com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
    sendError(res, message, 400);
  }
};

export const updateProfileById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, username, password } = req.body;

    const targetUser = await userService.getUserById(id);
    if (!targetUser) { sendError(res, 'Usuário não encontrado', 404); return; }
    if (targetUser.role === 'MASTER' && req.user!.role !== 'MASTER') {
      sendError(res, 'Admins não podem editar usuários Master.', 403);
      return;
    }

    const user = await userService.updateUser(id, { name, email, phone, username, password });
    sendSuccess(res, user, 'Usuário atualizado com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
    sendError(res, message, 400);
  }
};

export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const user = await userService.updateUserRole(req.params.id, role);
    sendSuccess(res, user, 'Role atualizado com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar role';
    sendError(res, message, 400);
  }
};

export const toggleActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userService.toggleUserActive(req.params.id);
    sendSuccess(res, user, 'Status do usuário atualizado!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
    sendError(res, message, 400);
  }
};
