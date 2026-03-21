import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import * as permissionsController from '../controllers/permissions.controller'

const router = Router()

// Lista todas as páginas do sistema
router.get('/pages', authenticate, permissionsController.getSystemPages)

// Busca permissões de um usuário específico
router.get('/:userId', authenticate, permissionsController.getUserPermissions)

// Salva/atualiza permissões de um usuário
router.put('/:userId', authenticate, permissionsController.saveUserPermissions)

export default router
