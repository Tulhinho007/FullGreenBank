import { prisma } from '../models/prismaClient'

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface CreateMatchInput {
  player1: string
  player2: string
  player3: string
  player4: string
  stake: number
  totalSets: number
  pointsPerSet: number
}

export interface UpdateScoreInput {
  scoreA: number
  scoreB: number
}

export interface FinalizeMatchInput {
  winnerTeam: 1 | 2
  scoreA: number
  scoreB: number
}

// ── Service ───────────────────────────────────────────────────────────────────

export const getActiveMatches = async () => {
  return prisma.futvoleiMatch.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })
}

export const getFinishedMatches = async () => {
  return prisma.futvoleiMatch.findMany({
    where: { status: 'FINISHED' },
    orderBy: { createdAt: 'desc' },
  })
}

export const getAllMatches = async () => {
  return prisma.futvoleiMatch.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export const createMatch = async (data: CreateMatchInput) => {
  return prisma.futvoleiMatch.create({
    data: {
      player1: data.player1,
      player2: data.player2,
      player3: data.player3,
      player4: data.player4,
      stake: data.stake,
      totalSets: data.totalSets,
      pointsPerSet: data.pointsPerSet,
      status: 'PENDING',
    },
  })
}

export const updateScore = async (id: string, data: UpdateScoreInput) => {
  const match = await prisma.futvoleiMatch.findUnique({ where: { id } })
  if (!match) throw new Error('Partida não encontrada')
  if (match.status !== 'PENDING') throw new Error('Partida já finalizada')

  return prisma.futvoleiMatch.update({
    where: { id },
    data: {
      scoreA: data.scoreA,
      scoreB: data.scoreB,
    },
  })
}

export const finalizeMatch = async (id: string, data: FinalizeMatchInput) => {
  const match = await prisma.futvoleiMatch.findUnique({ where: { id } })
  if (!match) throw new Error('Partida não encontrada')
  if (match.status !== 'PENDING') throw new Error('Partida já finalizada')

  return prisma.futvoleiMatch.update({
    where: { id },
    data: {
      status: 'FINISHED',
      winnerTeam: data.winnerTeam,
      scoreA: data.scoreA,
      scoreB: data.scoreB,
      finishedAt: new Date(),
    },
  })
}

export const cancelMatch = async (id: string) => {
  const match = await prisma.futvoleiMatch.findUnique({ where: { id } })
  if (!match) throw new Error('Partida não encontrada')

  return prisma.futvoleiMatch.update({
    where: { id },
    data: { status: 'CANCELED' },
  })
}

export const deleteMatch = async (id: string) => {
  return prisma.futvoleiMatch.delete({ where: { id } })
}
