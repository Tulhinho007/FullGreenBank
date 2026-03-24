import { prisma } from '../models/prismaClient';
import { hashPassword } from '../utils/password';

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      isTipster: true,
      plan: true,
      value: true,
      payMethod: true,
      purchaseDate: true,
      lastPaymentDate: true,
      dueDate: true,
      paymentStatus: true,
      isActive: true,
      notes: true,
      currency: true,
      language: true,
      theme: true,
      twoFactorEnabled: true,
      avatarUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      isTipster: true,
      plan: true,
      value: true,
      payMethod: true,
      purchaseDate: true,
      lastPaymentDate: true,
      dueDate: true,
      paymentStatus: true,
      isActive: true,
      notes: true,
      currency: true,
      language: true,
      theme: true,
      twoFactorEnabled: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
};

export const updateUser = async (
  id: string,
  data: { 
    name?: string; email?: string; phone?: string; 
    password?: string; isTipster?: boolean; 
    plan?: string; value?: number; payMethod?: string;
    purchaseDate?: string; lastPaymentDate?: string;
    dueDate?: string; paymentStatus?: string; isActive?: boolean; notes?: string;
    currency?: string; language?: string; theme?: string;
    twoFactorEnabled?: boolean; avatarUrl?: string;
  }
) => {
  const updateData: any = {};

  if (data.name)     updateData.name     = data.name;
  if (data.email)    updateData.email    = data.email;
  if (data.phone)    updateData.phone    = data.phone;
  if (data.password) updateData.password = await hashPassword(data.password);
  if (data.isTipster !== undefined)   updateData.isTipster = data.isTipster;
  
  if (data.plan)                     updateData.plan          = data.plan;
  if (data.value !== undefined)      updateData.value         = data.value;
  if (data.payMethod)                updateData.payMethod     = data.payMethod;
  if (data.purchaseDate)             updateData.purchaseDate  = data.purchaseDate;
  if (data.lastPaymentDate)          updateData.lastPaymentDate = data.lastPaymentDate;
  if (data.dueDate)                  updateData.dueDate       = data.dueDate;
  if (data.paymentStatus)            updateData.paymentStatus = data.paymentStatus;
  if (data.isActive !== undefined)   updateData.isActive      = data.isActive;
  if (data.notes !== undefined)      updateData.notes         = data.notes;

  if (data.currency)            updateData.currency = data.currency;
  if (data.language)            updateData.language = data.language;
  if (data.theme)               updateData.theme    = data.theme;
  if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;
  if (data.avatarUrl)           updateData.avatarUrl = data.avatarUrl;

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isTipster: true,
      plan: true,
      value: true,
      payMethod: true,
      purchaseDate: true,
      lastPaymentDate: true,
      dueDate: true,
      paymentStatus: true,
      isActive: true,
      notes: true,
      currency: true,
      language: true,
      theme: true,
      twoFactorEnabled: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
};

export const updateUserRole = async (id: string, role: 'MASTER' | 'ADMIN' | 'MEMBRO') => {
  return prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
};

export const toggleUserActive = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Usuário não encontrado');

  return prisma.user.update({
    where: { id },
    data: { active: !user.active },
    select: { id: true, name: true, active: true },
  });
};
