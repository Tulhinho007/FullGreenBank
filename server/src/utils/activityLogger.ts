import { AuthRequest } from '../middlewares/auth.middleware';
import { createLog } from '../services/log.service';

/**
 * Activity Logger Utility
 * Centralizes the creation of activity logs extracts user info from Request
 */
export const logActivity = async (
  req: AuthRequest, 
  category: string, 
  action: string, 
  detail: string
) => {
  try {
    const user = req.user;
    if (!user) return;

    await createLog({
      userId: user.userId,
      userEmail: user.email,
      userName: user.name || 'Usuário',
      userRole: user.role,
      category,
      action,
      detail
    });
  } catch (error) {
    console.error('Failed to create activity log:', error);
  }
};
