import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'
import { prisma } from '../models/prisma'

const router = Router()
router.use(authenticate)
router.use(authorizeRoles('ADMIN', 'MASTER'))

router.get('/', async (_req, res) => {
  try {
    const contratos = await prisma.bancaContrato.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    res.json(contratos.map(c => ({
      id: c.id, userId: c.userId, userName: c.user.name, userEmail: c.user.email,
      dataInicial: c.dataInicial.toISOString(),
      dataFinal: c.dataFinal ? c.dataFinal.toISOString() : null,
      bancaInicial: Number(c.bancaInicial), bancaFinal: Number(c.bancaFinal),
      comissaoPercent: Number(c.comissaoPercent),
      status: c.status, motivoFim: c.motivoFim ?? '', observacoes: c.observacoes ?? '',
      createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
    })))
  } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao buscar contratos.' }) }
})

router.post('/',
  [body('userId').notEmpty(), body('bancaInicial').isFloat({ min: 0.01 })],
  validateRequest,
  async (req: import('express').Request, res: import('express').Response) => {
    const { userId, dataInicial, dataFinal, bancaInicial, bancaFinal, comissaoPercent = 10, status = 'ATIVO', motivoFim, observacoes } = req.body
    try {
      const contrato = await prisma.bancaContrato.create({
        data: {
          userId,
          dataInicial: dataInicial ? new Date(dataInicial) : new Date(),
          dataFinal: dataFinal ? new Date(dataFinal) : null,
          bancaInicial: Number(bancaInicial),
          bancaFinal: Number(bancaFinal ?? bancaInicial),
          comissaoPercent: Number(comissaoPercent),
          status, motivoFim: motivoFim || null, observacoes: observacoes || null,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      res.status(201).json(contrato)
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao criar contrato.' }) }
  }
)

router.patch('/:id',
  [body('bancaFinal').optional().isFloat({ min: 0 }), body('status').optional().isIn(['ATIVO','AGUARDANDO_SAQUE','FINALIZADO','ENCERRADO','CANCELADO'])],
  validateRequest,
  async (req: import('express').Request, res: import('express').Response) => {
    const { id } = req.params
    const { dataInicial, dataFinal, bancaInicial, bancaFinal, comissaoPercent, status, motivoFim, observacoes } = req.body
    try {
      const atual = await prisma.bancaContrato.findUnique({ where: { id } })
      if (!atual) return res.status(404).json({ message: 'Contrato nao encontrado.' })
      const updated = await prisma.bancaContrato.update({
        where: { id },
        data: {
          ...(dataInicial ? { dataInicial: new Date(dataInicial) } : {}),
          ...(dataFinal !== undefined ? { dataFinal: dataFinal ? new Date(dataFinal) : null } : {}),
          ...(bancaInicial !== undefined ? { bancaInicial: Number(bancaInicial) } : {}),
          ...(bancaFinal !== undefined ? { bancaFinal: Number(bancaFinal) } : {}),
          ...(comissaoPercent !== undefined ? { comissaoPercent: Number(comissaoPercent) } : {}),
          ...(status ? { status } : {}),
          ...(motivoFim !== undefined ? { motivoFim: motivoFim || null } : {}),
          ...(observacoes !== undefined ? { observacoes } : {}),
        },
      })
      res.json(updated)
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao atualizar.' }) }
  }
)

router.delete('/:id', async (req, res) => {
  try {
    await prisma.bancaContrato.delete({ where: { id: req.params.id } })
    res.json({ message: 'Contrato excluido.' })
  } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao excluir.' }) }
})

export default router
