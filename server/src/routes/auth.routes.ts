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
    body('password')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/)
      .withMessage('Senha não atinge o mínimo de segurança (6 digitos, maiúscula, minúscula, número e especial)'),
    body('phone').optional().trim(),
  ],
  validateRequest,
  checkReadOnly,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Informe um e-mail válido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  validateRequest,
  authController.login
);

router.get('/me', authenticate, authController.getMe);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;