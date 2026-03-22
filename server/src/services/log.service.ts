import { prisma } from '../models/prismaClient'

interface CreateLogData {
  userId?: string
  userEmail: string
  userName: string
  userRole: string
  category: string
  action: string
  detail: string
}

export const createLog = async (data: CreateLogData) => {
  return prisma.activityLog.create({ data })
}

export const getLogs = async (page = 1, limit = 100, category?: string, userEmail?: string) => {
  const skip = (page - 1) * limit
  const where: any = {}
  if (category) where.category = category
  if (userEmail) where.userEmail = userEmail

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ])

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const clearLogs = async () => {
  return prisma.activityLog.deleteMany({})
}
