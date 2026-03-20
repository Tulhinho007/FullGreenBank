import { Router } from 'express'
import { createSolicitacao, getAllSolicitacoes, updateSolicitacaoStatus } from '../controllers/solicitacao.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// Private to user
router.post('/', authenticate, createSolicitacao)

// Admin/Master only
router.get('/', authenticate, authorizeRoles('ADMIN', 'MASTER'), getAllSolicitacoes)
router.patch('/:id/status', authenticate, authorizeRoles('ADMIN', 'MASTER'), updateSolicitacaoStatus)

export default router
