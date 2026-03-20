import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const create = async (req: Request, res: Response) => {
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
        status: 'OPEN'
      }
    });

    res.status(201).json(ticket);
  } catch (error: any) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({ error: 'Erro interno ao criar ticket' });
  }
};

export const getAll = async (req: Request, res: Response) => {
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

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status }
    });

    res.json(ticket);
  } catch (error: any) {
    console.error('Erro ao atualizar ticket:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar ticket' });
  }
};
