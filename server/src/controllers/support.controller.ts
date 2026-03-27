import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logActivity } from '../utils/activityLogger';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const { type, title, description, priority, userEmail, userId } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ error: 'Tipo, título e descrição são obrigatórios' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        type,
        title,
        description,
        priority: priority || 'medium',
        userEmail,
        userId: userId || null,
        status: 'PENDING'
      }
    });

    logActivity(req, 'Suporte', 'Novo Ticket Created', `Título: ${ticket.title}`);
    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({ error: 'Erro interno ao criar ticket' });
  }
};

export const getUserTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { userId: userId },
          { userEmail: userEmail }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tickets);
  } catch (error: any) {
    console.error('Erro ao buscar tickets do usuário:', error);
    res.status(500).json({ error: 'Erro interno ao buscar seus tickets' });
  }
};

export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error: any) {
    console.error('Erro ao buscar tickets:', error);
    res.status(500).json({ error: 'Erro interno ao buscar tickets' });
  }
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const data: any = { status };
    if (adminResponse !== undefined) {
      data.adminResponse = adminResponse;
      data.respondedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data
    });

    logActivity(req, 'Suporte', 'Status do Ticket Alterado', `ID: ${id} | Novo Status: ${status}`);
    res.json(ticket);
  } catch (error: any) {
    console.error('Erro ao atualizar ticket:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar ticket' });
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.supportTicket.delete({
      where: { id }
    });
    logActivity(req, 'Suporte', 'Ticket Excluído', `ID: ${id}`);
    res.json({ message: 'Ticket excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir ticket:', error);
    res.status(500).json({ error: 'Erro interno ao excluir ticket' });
  }
};
