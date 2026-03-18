import { Router } from 'express';
import { body } from 'express-validator';
import * as tipsController from '../controllers/tips.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET all tips - any authenticated user
router.get('/', tipsController.getAll);
router.get('/:id', tipsController.getById);

// POST create tip - admin and master only
router.post(
  '/',
  authorizeRoles('ADMIN', 'MASTER'),
  [
    body('title').trim().notEmpty().withMessage('Título é obrigatório'),
    body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
    body('sport').trim().notEmpty().withMessage('Esporte é obrigatório'),
    body('event').trim().notEmpty().withMessage('Evento é obrigatório'),
    body('market').trim().notEmpty().withMessage('Mercado é obrigatório'),
    body('odds').isFloat({ min: 1.01 }).withMessage('Odd inválida'),
    body('stake').isFloat({ min: 0.1 }).withMessage('Stake inválida'),
    body('tipDate').isISO8601().withMessage('Data inválida'),
  ],
  validateRequest,
  tipsController.create
);

// PATCH update result - admin and master only
router.patch(
  '/:id/result',
  authorizeRoles('ADMIN', 'MASTER'),
  [
    body('result')
      .isIn(['GREEN', 'RED', 'VOID', 'PENDING'])
      .withMessage('Resultado inválido'),
    body('profit').isNumeric().withMessage('Profit inválido'),
  ],
  validateRequest,
  tipsController.updateResult
);


// DELETE tip - admin and master only
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'MASTER'),
  tipsController.deleteTip
);

export default router;
