import { prisma } from '../models/prismaClient';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  const emailNormalized = data.email.toLowerCase().trim();
  const existingEmail = await prisma.user.findUnique({ where: { email: emailNormalized } });
  if (existingEmail) throw new Error('Email já cadastrado');

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      ...data,
      email: emailNormalized,
      password: hashedPassword,
      role: 'MEMBRO',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isTipster: true,
      createdAt: true,
    },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

  return { user, token };
};

export const loginUser = async (data: LoginData) => {
  const email = data.email?.toLowerCase().trim();

  if (!email) {
    throw new Error('Informe seu e-mail');
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  // 3. Erro genérico de credenciais (mais seguro e evita o erro 404/401 confuso)
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  // 4. Verifica a senha
  const isMatch = await comparePassword(data.password, user.password);
  if (!isMatch) {
    throw new Error('Usuário não encontrado ou senha incorreta');
  }

  // 5. Verifica se o usuário está ativo
  if (user.active === false) {
    throw new Error('Usuário inativo');
  }

  // 6. Gera o token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  // Remove a senha do objeto de retorno
  const { password, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};