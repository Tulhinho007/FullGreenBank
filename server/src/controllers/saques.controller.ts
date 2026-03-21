import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const saquesController = {
  // GET /api/saques
  async getAll(req: Request, res: Response) {
    try {
      const saques = await prisma.saque.findMany({
        include: {
          user: {
            select: { name: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Formatar formato espelhando o Frontend interface "Saque"
      const formatted = saques.map(s => ({
        id: s.id,
        userId: s.userId,
        userName: s.user.name,
        date: s.createdAt.toISOString(),
        grossValue: s.grossValue,
        comissionPercent: s.comissionPercent,
        netValue: s.netValue,
        method: s.method,
        status: s.status,
        rejectionReason: s.rejectionReason
      }))

      res.json(formatted)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Erro ao buscar histórico de saques' })
    }
  },

  // POST /api/saques
  async create(req: Request, res: Response) {
    try {
      const { userId, grossValue, comissionPercent, netValue, method, status, rejectionReason, date } = req.body

      const activeDate = date ? new Date(date) : new Date()

      const novoSaque = await prisma.saque.create({
        data: {
          userId,
          grossValue: Number(grossValue),
          comissionPercent: Number(comissionPercent),
          netValue: Number(netValue),
          method,
          status: status || 'PENDENTE',
          rejectionReason,
          createdAt: activeDate
        },
        include: {
          user: { select: { name: true } }
        }
      })

      res.status(201).json({
        id: novoSaque.id,
        userId: novoSaque.userId,
        userName: novoSaque.user.name,
        date: novoSaque.createdAt.toISOString(),
        grossValue: novoSaque.grossValue,
        comissionPercent: novoSaque.comissionPercent,
        netValue: novoSaque.netValue,
        method: novoSaque.method,
        status: novoSaque.status,
        rejectionReason: novoSaque.rejectionReason
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Erro ao registrar saque' })
    }
  },

  // PUT /api/saques/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { grossValue, comissionPercent, netValue, method, status, rejectionReason, date, userId } = req.body

      const updateData: any = {
        grossValue: Number(grossValue),
        comissionPercent: Number(comissionPercent),
        netValue: Number(netValue),
        method,
        status,
        rejectionReason
      }
      
      if (date) {
        updateData.createdAt = new Date(date)
      }
      if (userId) {
        updateData.userId = userId
      }

      const updatedSaque = await prisma.saque.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { name: true } }
        }
      })

      res.json({
        id: updatedSaque.id,
        userId: updatedSaque.userId,
        userName: updatedSaque.user.name,
        date: updatedSaque.createdAt.toISOString(),
        grossValue: updatedSaque.grossValue,
        comissionPercent: updatedSaque.comissionPercent,
        netValue: updatedSaque.netValue,
        method: updatedSaque.method,
        status: updatedSaque.status,
        rejectionReason: updatedSaque.rejectionReason
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Erro ao atualizar saque' })
    }
  },

  // DELETE /api/saques/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      await prisma.saque.delete({ where: { id } })
      res.status(204).send()
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Erro ao deletar saque' })
    }
  }
}
