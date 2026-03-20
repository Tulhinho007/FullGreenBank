import { Router } from 'express';
import { body } from 'express-validator';
import * as supportController from '../controllers/support.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

// POST create ticket - PUBLIC (so users can report bugs even if they can't login)
router.post(
  '/',
  [
    body('type').isIn(['bug', 'feedback']).withMessage('Tipo inválido'),
    body('title').trim().notEmpty().withMessage('Título é obrigatório'),
    body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
  ],
  validateRequest,
  supportController.create
);

// Admin/Master routes - Protected
router.use(authenticate);

router.get('/my-tickets', supportController.getUserTickets);
router.get('/', authorizeRoles('ADMIN', 'MASTER'), supportController.getAll);
router.patch('/:id/status', authorizeRoles('ADMIN', 'MASTER'), supportController.updateStatus);

export default router;
