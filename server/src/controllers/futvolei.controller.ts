import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import * as futvoleiService from '../services/futvolei.service'
import { sendSuccess, sendError } from '../utils/response'

// GET /api/futvolei/active
export const getActiveMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await futvoleiService.getActiveMatches()
    sendSuccess(res, matches)
  } catch {
    sendError(res, 'Erro ao buscar partidas ativas', 500)
  }
}

// GET /api/futvolei/history
export const getFinishedMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await futvoleiService.getFinishedMatches()
    sendSuccess(res, matches)
  } catch {
    sendError(res, 'Erro ao buscar histórico', 500)
  }
}

// GET /api/futvolei/stats
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const all = await futvoleiService.getAllMatches()
    const today = new Date().toISOString().split('T')[0]

    const jogosHoje = all.filter(
      (m: { createdAt: Date }) => m.createdAt.toISOString().split('T')[0] === today
    ).length

    const totalApostadoHoje = all
      .filter((m: { createdAt: Date }) => m.createdAt.toISOString().split('T')[0] === today)
      .reduce((sum: number, m: { stake: number }) => sum + m.stake, 0)

    sendSuccess(res, { jogosHoje, totalApostadoHoje })
  } catch {
    sendError(res, 'Erro ao buscar estatísticas', 500)
  }
}

// POST /api/futvolei
export const createMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { player1, player2, player3, player4, stake, totalSets, pointsPerSet } = req.body

    if (!player1 || !player2 || !player3 || !player4) {
      sendError(res, 'Preencha todos os jogadores', 400)
      return
    }
    if (!stake || stake <= 0) {
      sendError(res, 'Valor da aposta inválido', 400)
      return
    }

    const match = await futvoleiService.createMatch({
      player1,
      player2,
      player3,
      player4,
      stake: Number(stake),
      totalSets: Number(totalSets) || 3,
      pointsPerSet: Number(pointsPerSet) || 18,
    })

    sendSuccess(res, match, 'Desafio criado com sucesso!', 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar desafio'
    sendError(res, message, 400)
  }
}

// PATCH /api/futvolei/:id/score
export const updateScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scoreA, scoreB } = req.body
    const match = await futvoleiService.updateScore(req.params.id, {
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
    })
    sendSuccess(res, match, 'Placar atualizado!')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar placar'
    sendError(res, message, 400)
  }
}

// PATCH /api/futvolei/:id/finalize
export const finalizeMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { winnerTeam, scoreA, scoreB } = req.body

    if (!winnerTeam || ![1, 2].includes(Number(winnerTeam))) {
      sendError(res, 'Vencedor inválido. Use 1 (Dupla A) ou 2 (Dupla B)', 400)
      return
    }

    const match = await futvoleiService.finalizeMatch(req.params.id, {
      winnerTeam: Number(winnerTeam) as 1 | 2,
      scoreA: Number(scoreA) || 0,
      scoreB: Number(scoreB) || 0,
    })

    sendSuccess(res, match, 'Partida finalizada!')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao finalizar partida'
    sendError(res, message, 400)
  }
}

// DELETE /api/futvolei/:id
export const deleteMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await futvoleiService.deleteMatch(req.params.id)
    sendSuccess(res, null, 'Partida removida com sucesso!')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover partida'
    sendError(res, message, 400)
  }
}
