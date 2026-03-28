import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as userService from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../utils/activityLogger';

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

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await userService.getUserById(userId);
    if (!user) {
      sendError(res, 'Usuário não encontrado', 404);
      return;
    }
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Erro ao buscar perfil', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      name, phone, password, isTipster,
      plan, currency, language, theme, twoFactorEnabled, welcomeSeen, avatarUrl
    } = req.body;
    const user = await userService.updateUser(userId, {
      name, phone, password, isTipster,
      plan, currency, language, theme, twoFactorEnabled, welcomeSeen, avatarUrl
    });
    sendSuccess(res, user, 'Perfil atualizado com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
    sendError(res, message, 400);
  }
};

export const updateProfileById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { 
      name, email, phone, password, isTipster,
      plan, value, payMethod, purchaseDate, lastPaymentDate,
      dueDate, paymentStatus, isActive, notes,
      currency, language, theme, twoFactorEnabled, avatarUrl 
    } = req.body;

    const targetUser = await userService.getUserById(id);
    if (!targetUser) { sendError(res, 'Usuário não encontrado', 404); return; }
    if (targetUser.role === 'MASTER' && req.user!.role !== 'MASTER') {
      sendError(res, 'Admins não podem editar usuários Master.', 403);
      return;
    }

    const user = await userService.updateUser(id, { 
      name, email, phone, password, isTipster,
      plan, value, payMethod, purchaseDate, lastPaymentDate,
      dueDate, paymentStatus, isActive, notes,
      currency, language, theme, twoFactorEnabled, avatarUrl 
    });
    logActivity(req, 'Usuários', 'Perfil Editado (Admin)', `ID Target: ${id} | Nome: ${user.name}`);
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
    logActivity(req, 'Usuários', 'Círculo de Acesso Alterado', `ID Target: ${req.params.id} | Novo Cargo: ${role}`);
    sendSuccess(res, user, 'Role atualizado com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar role';
    sendError(res, message, 400);
  }
};

export const toggleActive = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await userService.toggleUserActive(req.params.id);
    logActivity(req, 'Usuários', 'Status de Atividade Alterado', `ID Target: ${req.params.id} | Ativo: ${user.active}`);
    sendSuccess(res, user, 'Status do usuário atualizado!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar status';
    sendError(res, message, 400);
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, plan } = req.body;
    
    // Admins normais não podem criar Masters
    if (role === 'MASTER' && req.user!.role !== 'MASTER') {
      sendError(res, 'Apenas masters podem criar contas com permissão MASTER.', 403);
      return;
    }

    const user = await userService.createUser({
      name, email, phone, password, role: role || 'MEMBRO', plan: plan || 'STARTER'
    });

    logActivity(req, 'Usuários', 'Criação de Conta (Admin)', `Nova conta criada: ${email} | Cargo: ${role}`);
    sendSuccess(res, user, 'Usuário criado com sucesso!', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar usuário';
    sendError(res, message, 400);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userToDelete = await userService.getUserById(req.params.id);
    if (!userToDelete) {
      sendError(res, 'Usuário não encontrado', 404);
      return;
    }
    
    // Admins normais não podem deletar Masters
    if (userToDelete.role === 'MASTER' && (req as any).user?.role !== 'MASTER') {
      sendError(res, 'Apenas masters podem deletar contas com permissão MASTER.', 403);
      return;
    }
    
    // Evitar que o usuário delete a própria conta na área de gestão
    if (userToDelete.id === (req as any).user?.id) {
      sendError(res, 'Você não pode deletar sua própria conta por aqui.', 400);
      return;
    }

    await userService.deleteUser(req.params.id);

    logActivity(req, 'Usuários', 'Conta Deletada (Admin)', `Conta excluída: ${userToDelete.email} | Cargo: ${userToDelete.role}`);
    sendSuccess(res, null, 'Usuário deletado do sistema com sucesso!', 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao deletar usuário';
    sendError(res, message, 400);
  }
};
