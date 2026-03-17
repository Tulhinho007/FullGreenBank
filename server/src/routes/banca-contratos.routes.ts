import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'
import { prisma } from '../models/prisma'

const router = Router()

// Todas as rotas exigem ADMIN ou MASTER
router.use(authenticate)
router.use(authorizeRoles('ADMIN', 'MASTER'))

// ── GET todos os contratos ────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const contratos = await prisma.bancaContrato.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    const data = contratos.map(c => ({
      id:              c.id,
      userId:          c.userId,
      userName:        c.user.name,
      userEmail:       c.user.email,
      valorInicial:    Number(c.valorInicial),
      valorAtual:      Number(c.valorAtual),
      comissaoPercent: Number(c.comissaoPercent),
      status:          c.status,
      observacoes:     c.observacoes ?? '',
      createdAt:       c.createdAt.toISOString(),
      updatedAt:       c.updatedAt.toISOString(),
    }))

    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao buscar contratos.' })
  }
})

// ── POST criar contrato ───────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('userId').notEmpty().withMessage('Usuário obrigatório'),
    body('valorInicial').isFloat({ min: 0.01 }).withMessage('Valor inicial inválido'),
    body('comissaoPercent').optional().isFloat({ min: 0, max: 100 }),
  ],
  validateRequest,
  async (req: import('express').Request, res: import('express').Response) => {
    const { userId, valorInicial, comissaoPercent = 10, observacoes = '' } = req.body
    try {
      const contrato = await prisma.bancaContrato.create({
        data: {
          userId,
          valorInicial,
          valorAtual:      valorInicial, // começa igual ao inicial
          comissaoPercent: comissaoPercent,
          status:          'ATIVO',
          observacoes,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      res.status(201).json(contrato)
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Erro ao criar contrato.' })
    }
  }
)

// ── PATCH atualizar contrato ──────────────────────────────────────────────────
router.patch(
  '/:id',
  [
    body('valorAtual').optional().isFloat({ min: 0 }),
    body('comissaoPercent').optional().isFloat({ min: 0, max: 100 }),
    body('status').optional().isIn(['ATIVO', 'ENCERRADO_LUCRO', 'ENCERRADO_QUEBRA']),
  ],
  validateRequest,
  async (req: import('express').Request, res: import('express').Response) => {
    const { id } = req.params
    const { valorAtual, comissaoPercent, status, observacoes } = req.body
    try {
      // Busca o contrato atual para checar regra de encerramento automático
      const atual = await prisma.bancaContrato.findUnique({ where: { id } })
      if (!atual) return res.status(404).json({ message: 'Contrato não encontrado.' })

      // Lógica de encerramento automático (backend também valida)
      let novoStatus = status ?? atual.status
      if (valorAtual !== undefined) {
        if (valorAtual <= 0) novoStatus = 'ENCERRADO_QUEBRA'
        else if (valorAtual >= Number(atual.valorInicial) * 2) novoStatus = 'ENCERRADO_LUCRO'
      }

      const updated = await prisma.bancaContrato.update({
        where: { id },
        data: {
          ...(valorAtual      !== undefined ? { valorAtual }      : {}),
          ...(comissaoPercent !== undefined ? { comissaoPercent } : {}),
          ...(observacoes     !== undefined ? { observacoes }     : {}),
          status: novoStatus,
        },
      })
      res.json(updated)
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Erro ao atualizar contrato.' })
    }
  }
)

// ── DELETE excluir contrato ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await prisma.bancaContrato.delete({ where: { id: req.params.id } })
    res.json({ message: 'Contrato excluído.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao excluir contrato.' })
  }
})

export default router
