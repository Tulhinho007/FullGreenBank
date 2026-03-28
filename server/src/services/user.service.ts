import { prisma } from '../models/prismaClient';
import { hashPassword } from '../utils/password';

export const createUser = async (data: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  const hashedPassword = await hashPassword(data.password);
  
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
    }
  });
};

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
      welcomeSeen: true,
      avatarUrl: true,
      createdAt: true,
      permissions: true,
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
      welcomeSeen: true,
      avatarUrl: true,
      createdAt: true,
      permissions: true,
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
    twoFactorEnabled?: boolean; welcomeSeen?: boolean; avatarUrl?: string;
  }
) => {
  const updateData: any = {};

  if (data.name !== undefined)     updateData.name     = data.name;
  if (data.email !== undefined)    updateData.email    = data.email;
  if (data.phone !== undefined)    updateData.phone    = data.phone;
  if (data.password !== undefined) updateData.password = await hashPassword(data.password);
  if (data.isTipster !== undefined)   updateData.isTipster = data.isTipster;
  
  if (data.plan !== undefined)                     updateData.plan          = data.plan;
  if (data.value !== undefined)      updateData.value         = data.value;
  if (data.payMethod !== undefined)                updateData.payMethod     = data.payMethod;
  if (data.purchaseDate !== undefined)             updateData.purchaseDate  = data.purchaseDate;
  if (data.lastPaymentDate !== undefined)          updateData.lastPaymentDate = data.lastPaymentDate;
  if (data.dueDate !== undefined)                  updateData.dueDate       = data.dueDate;
  if (data.paymentStatus !== undefined)            updateData.paymentStatus = data.paymentStatus;
  if (data.isActive !== undefined)   updateData.isActive      = data.isActive;
  if (data.notes !== undefined)      updateData.notes         = data.notes;

  if (data.currency !== undefined)            updateData.currency = data.currency;
  if (data.language !== undefined)            updateData.language = data.language;
  if (data.theme !== undefined)               updateData.theme    = data.theme;
  if (data.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = data.twoFactorEnabled;
  if (data.welcomeSeen !== undefined)       updateData.welcomeSeen = data.welcomeSeen;
  if (data.avatarUrl !== undefined)           updateData.avatarUrl = data.avatarUrl;

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
      welcomeSeen: true,
      avatarUrl: true,
      createdAt: true,
      permissions: true,
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

export const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};
