import { prisma } from '../models/prismaClient';

interface CreateTipData {
  title: string;
  description: string;
  sport: string;
  event: string;
  market: string;
  odds: number;
  stake: number;
  tipDate: Date;
  authorId: string;
}

export const createTip = async (data: CreateTipData) => {
  return prisma.tip.create({
    data,
    include: {
      author: {
        select: { id: true, name: true, username: true },
      },
    },
  });
};

export const getAllTips = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [tips, total] = await Promise.all([
    prisma.tip.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, username: true },
        },
      },
    }),
    prisma.tip.count(),
  ]);

  return { tips, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getTipById = async (id: string) => {
  return prisma.tip.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, username: true } },
    },
  });
};

export const updateTipResult = async (
  id: string,
  result: string,
  profit: number
) => {
  return prisma.tip.update({
    where: { id },
    data: { result, profit },
  });
};
export const deleteTip = async (id: string): Promise<void> => {
  await prisma.tip.delete({
    where: { id },
  });
};