import { Router } from 'express'
import { saquesController } from '../controllers/saques.controller'
import { authenticate, authorizeRoles, checkReadOnly } from '../middlewares/auth.middleware'

const router = Router()

// Todas as rotas de saques (área administrativa) requerem autenticação e cargo de admin/master/tester
router.use(authenticate)
router.use(authorizeRoles('ADMIN', 'MASTER', 'TESTER'))
router.use(checkReadOnly)

router.get('/', saquesController.getAll)
router.post('/', saquesController.create)
router.put('/:id', saquesController.update)
router.delete('/:id', saquesController.delete)

export { router as saquesRoutes }
