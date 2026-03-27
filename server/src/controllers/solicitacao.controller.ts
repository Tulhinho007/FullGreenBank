import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../middlewares/auth.middleware'
import { logActivity } from '../utils/activityLogger'

const prisma = new PrismaClient()

export const createSolicitacao = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { valorAporte, termoAceito, userId: targetUserId } = req.body
    const requesterId = req.user?.userId
    const requesterRole = req.user?.role

    if (!requesterId) {
      res.status(401).json({ error: 'Não autorizado' })
      return
    }

    // Se for admin/master e enviou um userId no body, usa ele. Caso contrário, usa o próprio ID.
    const isAdmin = requesterRole === 'ADMIN' || requesterRole === 'MASTER'
    const finalUserId = (isAdmin && targetUserId) ? targetUserId : requesterId

    const solicitacao = await prisma.solicitacaoInvestimento.create({
      data: {
        userId: finalUserId,
        valorAporte: Number(valorAporte),
        termoAceito: Boolean(termoAceito ?? true)
      },
      include: {
        usuario: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    logActivity(req, 'Financeiro', 'Novo Aporte', `Valor: ${valorAporte} | Usuário: ${solicitacao.usuario.email}`);
    res.status(201).json(solicitacao)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao criar solicitação de investimento' })
  }
}

export const getAllSolicitacoes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const solicitacoes = await prisma.solicitacaoInvestimento.findMany({
      include: {
        usuario: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dataPedido: 'desc'
      }
    })

    res.json(solicitacoes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar solicitações' })
  }
}

export const updateSolicitacaoStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    const solicitacao = await prisma.solicitacaoInvestimento.update({
      where: { id },
      data: { status }
    })

    res.json(solicitacao)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar status da solicitação' })
  }
}

export const updateSolicitacao = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { valorAporte, observacoes } = req.body

    const solicitacao = await prisma.solicitacaoInvestimento.update({
      where: { id },
      data: {
        valorAporte: valorAporte ? Number(valorAporte) : undefined,
        observacoes
      }
    })

    res.json(solicitacao)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar a solicitação' })
  }
}

export const deleteSolicitacao = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    await prisma.solicitacaoInvestimento.delete({
      where: { id }
    })

    logActivity(req, 'Financeiro', 'Aporte Excluído', `ID: ${id}`);
    res.json({ message: 'Solicitação excluída com sucesso' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao excluir a solicitação' })
  }
}
