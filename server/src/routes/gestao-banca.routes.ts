import { Router } from 'express'
import { body, query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'

const router = Router()
const prisma = new PrismaClient()

// ── GET /gestao-banca/bookmakers
// Retorna a lista de casas já utilizadas pelo usuário
router.get(
  '/bookmakers',
  authenticate,
  async (req: any, res: any) => {
    try {
      const userId = req.user!.userId
      const bookmakers = await prisma.gestaoBancaItem.findMany({
        where: { userId },
        select: { casaAposta: true },
        distinct: ['casaAposta'],
      })
      res.json(bookmakers.map(b => b.casaAposta))
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Erro ao buscar casas de aposta.' })
    }
  }
)

// ── GET /gestao-banca/:casaAposta
// Retorna as linhas
router.get(
  '/:casaAposta',
  authenticate,
  async (req: any, res: any) => {
    if (req.params.casaAposta === 'bookmakers') return // Ignora conflito
    try {
      const { casaAposta } = req.params
      const userId = req.user!.userId

      const itens = await prisma.gestaoBancaItem.findMany({
        where: { userId, casaAposta },
        orderBy: { dataReferencia: 'asc' },
      })

      res.json({
        itens: itens.map((i) => ({
          ...i,
          dataReferencia: i.dataReferencia.toISOString().split('T')[0], 
          deposito: Number(i.deposito),
          saque: Number(i.saque),
          resultado: Number(i.resultado),
        })),
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Erro interno ao buscar gestão de banca.' })
    }
  }
)

// ── POST /gestao-banca/:casaAposta/item
router.post(
  '/:casaAposta/item',
  authenticate,
  async (req: any, res: any) => {
    try {
      const { casaAposta } = req.params
      const userId = req.user!.userId
      const { date, deposit, withdrawal, result } = req.body

      const newItem = await prisma.gestaoBancaItem.create({
        data: {
          userId,
          casaAposta,
          dataReferencia: new Date(date + 'T12:00:00Z'),
          deposito: Number(deposit || 0),
          saque: Number(withdrawal || 0),
          resultado: Number(result || 0),
        }
      })

      res.status(201).json({
        ...newItem,
        dataReferencia: newItem.dataReferencia.toISOString().split('T')[0],
        deposito: Number(newItem.deposito),
        saque: Number(newItem.saque),
        resultado: Number(newItem.resultado)
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Erro ao criar linha.' })
    }
  }
)

// ── PATCH /gestao-banca/:casaAposta/item/:id
router.patch(
  '/:casaAposta/item/:id',
  authenticate,
  async (req: any, res: any) => {
    try {
      const { id } = req.params
      const { date, deposit, withdrawal, result } = req.body

      const updated = await prisma.gestaoBancaItem.update({
        where: { id },
        data: {
          dataReferencia: new Date(date + 'T12:00:00Z'),
          deposito: Number(deposit || 0),
          saque: Number(withdrawal || 0),
          resultado: Number(result || 0),
        }
      })

      res.json({
        ...updated,
        dataReferencia: updated.dataReferencia.toISOString().split('T')[0],
        deposito: Number(updated.deposito),
        saque: Number(updated.saque),
        resultado: Number(updated.resultado)
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Erro ao atualizar linha.' })
    }
  }
)

// ── DELETE /gestao-banca/:casaAposta/item/:id
router.delete(
  '/:casaAposta/item/:id',
  authenticate,
  async (req: any, res: any) => {
    try {
      const { id } = req.params
      await prisma.gestaoBancaItem.delete({ where: { id } })
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ message: 'Erro ao excluir.' })
    }
  }
)

export default router
