import { prisma } from '../models/prismaClient';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  username: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) throw new Error('Email já cadastrado');

  const existingUsername = await prisma.user.findUnique({ where: { username: data.username } });
  if (existingUsername) throw new Error('Nome de usuário já existe');

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: 'MEMBRO',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  return { user, token };
};

export const loginUser = async (data: LoginData) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error('Credenciais inválidas');
  if (!user.active) throw new Error('Conta desativada. Contate o administrador.');

  const isPasswordValid = await comparePassword(data.password, user.password);
  if (!isPasswordValid) throw new Error('Credenciais inválidas');

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};
