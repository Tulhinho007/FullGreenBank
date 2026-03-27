import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware'
import { logActivity } from '../utils/activityLogger'

const router = Router()
const prisma = new PrismaClient()

// GET /api/transacoes — lista todas as transações (MASTER/ADMIN)
router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const transacoes = await prisma.transacao.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json({ success: true, data: transacoes })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao buscar transações.' })
  }
})

// POST /api/transacoes — cria nova transação
router.post('/', authenticate, async (req: any, res: any) => {
  try {
    const { date, type, userId, userName, value, method, status, notes } = req.body

    if (!date || !type || !userId || !value || !method) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes.' })
    }

    const transacao = await prisma.transacao.create({
      data: {
        date,
        type,
        userId,
        userName: userName || 'Desconhecido',
        value: Number(value),
        method,
        status: status || 'CONCLUIDO',
        notes: notes || null
      }
    })

    logActivity(req, 'Financeiro', `Transação ${type}`, `Usuário: ${userName} | Valor: ${value} | Método: ${method} | Status: ${status}`)

    res.status(201).json({ success: true, data: transacao })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Erro ao criar transação.' })
  }
})

// PATCH /api/transacoes/:id — edita uma transação existente
router.patch('/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { date, type, userId, userName, value, method, status, notes } = req.body

    const existing = await prisma.transacao.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Transação não encontrada.' })

    const updated = await prisma.transacao.update({
      where: { id },
      data: {
        ...(date !== undefined     ? { date }                    : {}),
        ...(type !== undefined     ? { type }                    : {}),
        ...(userId !== undefined   ? { userId }                  : {}),
        ...(userName !== undefined ? { userName }                : {}),
        ...(value !== undefined    ? { value: Number(value) }    : {}),
        ...(method !== undefined   ? { method }                  : {}),
        ...(status !== undefined   ? { status }                  : {}),
        ...(notes !== undefined    ? { notes: notes || null }    : {}),
      }
    })

    logActivity(req, 'Financeiro', 'Transação Editada', `ID: ${id} | Tipo: ${updated.type} | Valor: ${updated.value}`)
    res.json({ success: true, data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Erro ao editar transação.' })
  }
})

// DELETE /api/transacoes/:id — exclui uma transação
router.delete('/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const tx = await prisma.transacao.findUnique({ where: { id } })
    if (!tx) return res.status(404).json({ success: false, message: 'Transação não encontrada.' })

    await prisma.transacao.delete({ where: { id } })

    logActivity(req, 'Financeiro', 'Transação Excluída', `ID: ${id} | Tipo: ${tx.type} | Valor: ${tx.value}`)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao excluir transação.' })
  }
})

export default router
