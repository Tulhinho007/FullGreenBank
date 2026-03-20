import { Router } from 'express'
import { createSolicitacao, getAllSolicitacoes, updateSolicitacaoStatus, updateSolicitacao, deleteSolicitacao } from '../controllers/solicitacao.controller'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'

const router = Router()

// Private to user
router.post('/', authenticate, createSolicitacao)

// Admin/Master only
router.get('/', authenticate, authorizeRoles('ADMIN', 'MASTER'), getAllSolicitacoes)
router.patch('/:id/status', authenticate, authorizeRoles('ADMIN', 'MASTER'), updateSolicitacaoStatus)
router.put('/:id', authenticate, authorizeRoles('ADMIN', 'MASTER'), updateSolicitacao)
router.delete('/:id', authenticate, authorizeRoles('ADMIN', 'MASTER'), deleteSolicitacao)

export default router
