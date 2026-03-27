import { Router } from 'express'
import { body } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate, authorizeRoles, checkReadOnly } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'
import { createLog } from '../services/log.service'

const prisma = new PrismaClient()
const router = Router()

router.use(authenticate)

// Listar todos os contratos (Admin/Master vê tudo, Tester vê tudo mas não edita)
router.get('/', authorizeRoles('ADMIN', 'MASTER', 'TESTER'), async (req: any, res) => {
  try {
    const contratos = await prisma.contrato.findMany({
      orderBy: { dataInicio: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    res.json(contratos.map((c: any) => ({
      id: c.id,
      userId: c.userId,
      userName: c.user.name,
      userEmail: c.user.email,
      dataInicio: c.dataInicio.toISOString(),
      valorContratado: c.valorContratado,
      comissaoPercent: c.comissaoPercent,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erro ao buscar contratos.' })
  }
})

// Criar contrato (Apenas Admin/Master)
router.post('/',
  authorizeRoles('ADMIN', 'MASTER'),
  checkReadOnly,
  [
    body('userId').optional(),
    body('dataInicio').optional(),
    body('valorContratado').optional().isFloat(),
    body('comissaoPercent').optional().isFloat(),
    body('status').optional().isIn(['ABERTO', 'FINALIZADO', 'CANCELADO']),
  ],
  validateRequest,
  async (req: any, res: any) => {
    const { userId, dataInicio, valorContratado, comissaoPercent, status } = req.body
    try {
      const contrato = await prisma.contrato.create({
        data: {
          userId: userId || req.user.id,
          dataInicio: dataInicio ? new Date(dataInicio + 'T12:00:00') : new Date(),
          valorContratado: valorContratado !== undefined ? Number(valorContratado) : null,
          comissaoPercent: comissaoPercent !== undefined ? Number(comissaoPercent) : 10,
          status: status || 'ABERTO',
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      createLog({
        userEmail: req.user.email,
        userName: req.user.name,
        userRole: req.user.role,
        category: 'Financeiro',
        action: 'Contrato Criado',
        detail: `Contrato para ${contrato.user.name} - ${contrato.valorContratado || 0}`
      })

      res.status(201).json(contrato)
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Erro ao criar contrato.' })
    }
  }
)

// Editar contrato
router.patch('/:id',
  authorizeRoles('ADMIN', 'MASTER'),
  checkReadOnly,
  validateRequest,
  async (req: any, res: any) => {
    const { id } = req.params
    const { userId, dataInicio, valorContratado, comissaoPercent, status } = req.body
    try {
      const contrato = await prisma.contrato.update({
        where: { id },
        data: {
          ...(userId ? { userId } : {}),
          ...(dataInicio ? { dataInicio: new Date(dataInicio + 'T12:00:00') } : {}),
          ...(valorContratado !== undefined ? { valorContratado: Number(valorContratado) } : {}),
          ...(comissaoPercent !== undefined ? { comissaoPercent: Number(comissaoPercent) } : {}),
          ...(status ? { status } : {}),
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      })

      createLog({
        userEmail: req.user.email,
        userName: req.user.name,
        userRole: req.user.role,
        category: 'Financeiro',
        action: 'Contrato Editado',
        detail: `ID: ${id}`
      })

      res.json(contrato)
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Erro ao atualizar contrato.' })
    }
  }
)

// Excluir contrato
router.delete('/:id',
  authorizeRoles('ADMIN', 'MASTER'),
  checkReadOnly,
  async (req: any, res: any) => {
    const { id } = req.params
    try {
      await prisma.contrato.delete({ where: { id } })
      
      createLog({
        userEmail: req.user.email,
        userName: req.user.name,
        userRole: req.user.role,
        category: 'Financeiro',
        action: 'Contrato Excluído',
        detail: `ID: ${id}`
      })

      res.json({ message: 'Contrato excluído.' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Erro ao excluir contrato.' })
    }
  }
)

export default router
