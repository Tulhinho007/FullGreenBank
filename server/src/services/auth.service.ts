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
  email?: string;
  username?: string;
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
      isTipster: true,
      createdAt: true,
    },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

  return { user, token };
};

export const loginUser = async (data: LoginData) => {
  // 1. Normaliza os dados (remove espaços e garante que strings vazias virem undefined)
  const email = data.email?.trim() || undefined;
  const username = data.username?.trim() || undefined;

  if (!email && !username) {
    throw new Error('Informe e-mail ou usuário');
  }

  // 2. Busca o usuário de forma mais inteligente
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { username: username }
      ]
    }
  });

  // 3. Erro genérico de credenciais (mais seguro e evita o erro 404/401 confuso)
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
}