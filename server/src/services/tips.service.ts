import { prisma } from '../models/prismaClient';

interface CreateTipData {
  title?: string;
  description?: string;
  sport?: string;
  event?: string;
  market?: string;
  odds?: number;
  stake?: number;
  tipDate?: Date;
  authorId: string;
  mercados?: string[];
  isMultipla?: boolean;
  isPublic?: boolean;
  jogos?: any;
}

export const createTip = async (data: CreateTipData) => {
  return prisma.tip.create({
    data: data as any,
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });
};

export const getAllTips = async (page = 1, limit = 10, authorId?: string, isPublic?: boolean) => {
  const skip = (page - 1) * limit;
  const where: any = {};
  if (authorId) where.authorId = authorId;
  if (isPublic !== undefined) where.isPublic = isPublic;

  const [tips, total] = await Promise.all([
    prisma.tip.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.tip.count({ where }),
  ]);

  return { tips, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getTipById = async (id: string) => {
  return prisma.tip.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
    },
  });
};

export const updateTipResult = async (
  id: string,
  result: string,
  profit: number,
  valorCashout?: number
) => {
  return prisma.tip.update({
    where: { id },
    data: { result, profit, valorCashout },
  });
};

export const updateTip = async (
  id: string,
  data: Partial<CreateTipData>
) => {
  return prisma.tip.update({
    where: { id },
    data: data as any,
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });
};
export const deleteTip = async (id: string): Promise<void> => {
  await prisma.tip.delete({
    where: { id },
  });
};