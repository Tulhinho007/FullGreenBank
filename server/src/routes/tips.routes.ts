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
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('sport').optional().trim(),
    body('event').optional().trim(),
    body('market').optional().trim(),
    body('odds').optional().isFloat({ min: 1.01 }).withMessage('Odd inválida'),
    body('stake').optional().isFloat({ min: 0.1 }).withMessage('Stake inválida'),
    body('tipDate').optional().isISO8601().withMessage('Data inválida'),
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

// PATCH update tip - admin and master only
router.patch(
  '/:id',
  authorizeRoles('ADMIN', 'MASTER'),
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('sport').optional().trim(),
    body('event').optional().trim(),
    body('market').optional().trim(),
    body('odds').optional().isFloat({ min: 1.01 }).withMessage('Odd inválida'),
    body('stake').optional().isFloat({ min: 0.1 }).withMessage('Stake inválida'),
    body('tipDate').optional().isISO8601().withMessage('Data inválida'),
  ],
  validateRequest,
  tipsController.update
);


// DELETE tip - admin and master only
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'MASTER'),
  tipsController.deleteTip
);

export default router;
