import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// ── GET /api/ranking/tipsters
// Ranking dos analistas baseado nas TIPS cadastradas no banco
router.get('/tipsters', authenticate, async (_req: any, res: any) => {
  try {
    // Busca todas as tips que já têm resultado (não pendentes)
    const tips = await prisma.tip.findMany({
      where: {
        result: { in: ['GREEN', 'RED', 'VOID'] }
      },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    })

    // Agrupa por autor
    const stats: Record<string, any> = {}

    tips.forEach(tip => {
      const authorId = tip.authorId
      if (!stats[authorId]) {
        stats[authorId] = {
          id: authorId,
          name: tip.author.name,
          specialty: tip.sport, // Pega o esporte da última tip como exemplo
          greens: 0,
          reds: 0,
          voids: 0,
          total: 0,
          profit: 0,
          invested: 0
        }
      }

      const s = stats[authorId]
      s.total++
      s.invested += tip.stake
      s.profit += tip.profit || 0

      if (tip.result === 'GREEN') s.greens++
      else if (tip.result === 'RED') s.reds++
      else if (tip.result === 'VOID') s.voids++
      
      // Atualiza especialidade se necessário (poderia ser uma lógica mais complexa)
      s.specialty = tip.sport
    })

    // Calcula WinRate e ROI final
    const ranking = Object.values(stats).map((s: any) => {
      const decided = s.greens + s.reds
      const winRate = decided > 0 ? Math.round((s.greens / decided) * 100) : 0
      const roi = s.invested > 0 ? Number(((s.profit / s.invested) * 100).toFixed(1)) : 0

      return {
        id: s.id,
        name: s.name,
        specialty: s.specialty,
        greens: s.greens,
        reds: s.reds,
        voids: s.voids,
        total: s.total,
        winRate,
        profit: Number(s.profit.toFixed(2)),
        roi
      }
    })
    .sort((a, b) => b.winRate - a.winRate || b.profit - a.profit)

    res.json(ranking)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro ao gerar ranking de tipsters.' })
  }
})

// ── GET /api/ranking/users
// Ranking dos usuários baseado no ROI da melhor banca (Gestão de Banca)
router.get('/users', authenticate, async (_req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        bancaCarteiras: {
          include: {
            itens: true
          }
        }
      }
    })

    const ranking = users.map(user => {
      let bestBancaRoi = -Infinity
      let bestBancaStats = { greens: 0, reds: 0, profit: 0, winRate: 0 }

      user.bancaCarteiras.forEach(banca => {
        const initial = Number(banca.bancaInicial)
        const items = banca.itens
        
        const profit = items.reduce((acc, it) => acc + Number(it.resultado), 0)
        const greens = items.filter(it => Number(it.resultado) > 0).length
        const reds = items.filter(it => Number(it.resultado) < 0).length
        
        // ROI total da banca = (Lucro / Banca Inicial) * 100
        // Se banca inicial for 0, usamos o lucro bruto para evitar divisão por zero
        const roi = initial > 0 ? (profit / initial) * 100 : 0
        
        const decided = greens + reds
        const winRate = decided > 0 ? Math.round((greens / decided) * 100) : 0

        if (roi > bestBancaRoi) {
          bestBancaRoi = roi
          bestBancaStats = { greens, reds, profit, winRate }
        }
      })

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        winRate: bestBancaStats.winRate,
        greens: bestBancaStats.greens,
        reds: bestBancaStats.reds,
        profit: Number(bestBancaStats.profit.toFixed(2)),
        roi: Number(bestBancaRoi === -Infinity ? 0 : bestBancaRoi.toFixed(1))
      }
    })
    // Filtra usuários sem nenhuma banca ou com ROI 0 (opcional, mas limpa o ranking)
    .filter(u => u.roi !== 0 || u.profit !== 0)
    .sort((a, b) => b.roi - a.roi || b.profit - a.profit)

    res.json(ranking)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro ao gerar ranking de usuários.' })
  }
})

export default router
