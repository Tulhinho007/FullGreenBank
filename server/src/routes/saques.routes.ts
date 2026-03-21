import { Router } from 'express'
import { saquesController } from '../controllers/saques.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

// Todas as rotas de saques (área administrativa) requerem autenticação
router.use(authenticate)

router.get('/', saquesController.getAll)
router.post('/', saquesController.create)
router.put('/:id', saquesController.update)
router.delete('/:id', saquesController.delete)

export { router as saquesRoutes }
