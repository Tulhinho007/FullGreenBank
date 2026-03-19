import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as tipsService from '../services/tips.service';
import { sendSuccess, sendError } from '../utils/response';

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authorId = req.user!.userId;
    const tip = await tipsService.createTip({ ...req.body, authorId });
    sendSuccess(res, tip, 'Dica criada com sucesso!', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar dica';
    sendError(res, message, 400);
  }
};

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await tipsService.getAllTips(page, limit);
    sendSuccess(res, result);
  } catch {
    sendError(res, 'Erro ao buscar dicas', 500);
  }
};

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tip = await tipsService.getTipById(req.params.id);
    if (!tip) {
      sendError(res, 'Dica não encontrada', 404);
      return;
    }
    sendSuccess(res, tip);
  } catch {
    sendError(res, 'Erro ao buscar dica', 500);
  }
};

export const updateResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { result, profit } = req.body;
    const tip = await tipsService.updateTipResult(req.params.id, result, profit);
    sendSuccess(res, tip, 'Resultado atualizado!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar resultado';
    sendError(res, message, 400);
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tip = await tipsService.updateTip(req.params.id, req.body);
    sendSuccess(res, tip, 'Dica atualizada com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar dica';
    sendError(res, message, 400);
  }
};

export const deleteTip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tip = await tipsService.getTipById(req.params.id);
    if (!tip) {
      sendError(res, 'Dica não encontrada', 404);
      return;
    }
    await tipsService.deleteTip(req.params.id);
    sendSuccess(res, null, 'Dica removida com sucesso!');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao excluir dica';
    sendError(res, message, 400);
  }
};
