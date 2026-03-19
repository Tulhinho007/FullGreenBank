import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate, checkReadOnly } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('Username deve ter pelo menos 3 caracteres'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('phone').optional().trim(),
  ],
  validateRequest,
  checkReadOnly,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  validateRequest,
  authController.login
);

router.get('/me', authenticate, authController.getMe);

export default router;
