import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import * as logController from '../controllers/log.controller'

const router = Router()

router.post('/',        authMiddleware, logController.create)
router.get('/',         authMiddleware, logController.getAll)
router.delete('/clear', authMiddleware, logController.clear)

export default router
