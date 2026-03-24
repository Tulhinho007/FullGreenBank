import { Router } from 'express'
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware'
import * as logController from '../controllers/log.controller'

const router = Router()

router.post('/',        authenticate, logController.create)
router.get('/',         authenticate, authorizeRoles('ADMIN', 'MASTER', 'TESTER'), logController.getAll)
router.delete('/clear', authenticate, authorizeRoles('ADMIN', 'MASTER'), logController.clear)

export default router