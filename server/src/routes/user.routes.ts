import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate, authorizeRoles, checkReadOnly } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

router.use(authenticate);
router.use(checkReadOnly);

// POST create user - admin/master only
router.post(
  '/',
  authorizeRoles('ADMIN', 'MASTER'),
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('role').optional().isIn(['MASTER', 'ADMIN', 'MEMBRO']),
    body('plan').optional().isIn(['STARTER', 'PRO', 'VIP PREMIUM'])
  ],
  validateRequest,
  userController.createUser
);

// GET all users - admin/master only
router.get('/', authorizeRoles('ADMIN', 'MASTER'), userController.getAll);

// GET own profile
router.get('/profile/me', userController.getProfile);

// GET single user - admin/master only
router.get('/:id', authorizeRoles('ADMIN', 'MASTER'), userController.getById);

// PATCH update own profile
router.patch(
  '/profile/me',
  [
    body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('phone').optional().trim(),
    body('password').optional().isLength({ min: 6 }).withMessage('Senha muito curta'),
    body('plan').optional().isIn(['STARTER', 'PRO', 'VIP PREMIUM']),
    body('currency').optional().isIn(['BRL', 'USD', 'EUR']),
    body('language').optional().isIn(['PT-BR', 'EN-US', 'ES-ES']),
    body('theme').optional().isIn(['LIGHT', 'DARK', 'SYSTEM']),
    body('twoFactorEnabled').optional().isBoolean(),
    body('avatarUrl').optional().isURL(),
  ],
  validateRequest,
  userController.updateProfile
);

// PATCH update any user profile - admin/master (admin cannot edit master)
router.patch(
  '/:id/profile',
  authorizeRoles('ADMIN', 'MASTER'),
  [
    body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('phone').optional().trim(),
    body('password').optional().isLength({ min: 6 }).withMessage('Senha muito curta'),
    body('plan').optional().isIn(['STARTER', 'PRO', 'VIP PREMIUM']),
    body('paymentStatus').optional().isIn(['ATIVO', 'PENDENTE', 'ATRASADO', 'CANCELADO']),
    body('isActive').optional().isBoolean(),
    body('currency').optional().isIn(['BRL', 'USD', 'EUR']),
    body('language').optional().isIn(['PT-BR', 'EN-US', 'ES-ES']),
    body('theme').optional().isIn(['LIGHT', 'DARK', 'SYSTEM']),
  ],
  validateRequest,
  userController.updateProfileById
);

// PATCH update role - master only
router.patch(
  '/:id/role',
  authorizeRoles('MASTER'),
  [
    body('role')
      .isIn(['MASTER', 'ADMIN', 'MEMBRO'])
      .withMessage('Role inválido'),
  ],
  validateRequest,
  userController.updateRole
);

// PATCH toggle active - admin/master
router.patch(
  '/:id/toggle-active',
  authorizeRoles('ADMIN', 'MASTER'),
  userController.toggleActive
);

// DELETE user - admin/master
router.delete(
  '/:id',
  authorizeRoles('ADMIN', 'MASTER'),
  userController.deleteUser
);

export default router;
