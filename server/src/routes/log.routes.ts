import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'
import * as logController from '../controllers/log.controller'

const router = Router()

router.post('/',        authenticate, logController.create)
router.get('/',         authenticate, logController.getAll)
router.delete('/clear', authenticate, logController.clear)

export default router