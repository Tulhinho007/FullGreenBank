import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import * as futvoleiController from '../controllers/futvolei.controller'
import { validate, createMatchSchema } from '../utils/validators'

const router = Router()

// Todos os autenticados podem ver
router.get('/active',  authenticate, futvoleiController.getActiveMatches)
router.get('/history', authenticate, futvoleiController.getFinishedMatches)
router.get('/stats',   authenticate, futvoleiController.getStats)
router.post('/', authenticate, validate(createMatchSchema), futvoleiController.createMatch)

// Criar desafio
router.post('/', authenticate, futvoleiController.createMatch)

// Atualizar placar
router.patch('/:id/score',    authenticate, futvoleiController.updateScore)

// Finalizar partida
router.patch('/:id/finalize', authenticate, futvoleiController.finalizeMatch)

// Deletar
router.delete('/:id', authenticate, futvoleiController.deleteMatch)

export default router
