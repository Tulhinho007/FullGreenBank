import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()
const prisma = new PrismaClient()

// ── HELPER: só admin/master pode mutacionar ────────────────────────────────────
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user
  if (!user || !['ADMIN', 'MASTER'].includes(user.role)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' })
  }
  next()
}

// ══════════════════════════════════════════════════════════════════════════════
// ESPORTES
// ══════════════════════════════════════════════════════════════════════════════

router.get('/sports', authenticate, async (_req, res) => {
  const sports = await prisma.sport.findMany({ orderBy: { name: 'asc' } })
  res.json(sports)
})

router.post('/sports', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, emoji, slug } = req.body
    if (!name || !slug) return res.status(400).json({ error: 'name e slug são obrigatórios.' })
    const sport = await prisma.sport.create({ data: { name, emoji: emoji || null, slug } })
    res.status(201).json(sport)
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Slug já existe.' })
    res.status(500).json({ error: 'Erro interno.' })
  }
})

router.put('/sports/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, emoji, slug } = req.body
    const sport = await prisma.sport.update({
      where: { id: req.params.id },
      data: { name, emoji: emoji || null, slug },
    })
    res.json(sport)
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar.' })
  }
})

router.delete('/sports/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.sport.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Erro ao excluir.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// LIGAS
// ══════════════════════════════════════════════════════════════════════════════

router.get('/leagues', authenticate, async (_req, res) => {
  const leagues = await prisma.league.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  res.json(leagues)
})

router.post('/leagues', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, featured } = req.body
    if (!name || !category) return res.status(400).json({ error: 'name e category são obrigatórios.' })
    const league = await prisma.league.create({ data: { name, category, featured: featured ?? false } })
    res.status(201).json(league)
  } catch {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

router.put('/leagues/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, featured } = req.body
    const league = await prisma.league.update({
      where: { id: req.params.id },
      data: { name, category, featured: featured ?? false },
    })
    res.json(league)
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar.' })
  }
})

router.delete('/leagues/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.league.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Erro ao excluir.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// CASAS DE APOSTAS
// ══════════════════════════════════════════════════════════════════════════════

router.get('/bookmakers', authenticate, async (_req, res) => {
  const bookmakers = await prisma.bookmaker.findMany({ orderBy: { name: 'asc' } })
  res.json(bookmakers)
})

router.post('/bookmakers', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, differential, focus } = req.body
    if (!name) return res.status(400).json({ error: 'name é obrigatório.' })
    const bm = await prisma.bookmaker.create({ data: { name, differential: differential || '', focus: focus || '' } })
    res.status(201).json(bm)
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Casa já existe.' })
    res.status(500).json({ error: 'Erro interno.' })
  }
})

router.put('/bookmakers/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, differential, focus } = req.body
    const bm = await prisma.bookmaker.update({
      where: { id: req.params.id },
      data: { name, differential: differential || '', focus: focus || '' },
    })
    res.json(bm)
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar.' })
  }
})

router.delete('/bookmakers/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.bookmaker.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Erro ao excluir.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// MERCADOS
// ══════════════════════════════════════════════════════════════════════════════

router.get('/markets', authenticate, async (_req, res) => {
  const markets = await prisma.market.findMany({ orderBy: { name: 'asc' } })
  res.json(markets)
})

router.post('/markets', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, sportSlug } = req.body
    if (!name) return res.status(400).json({ error: 'name é obrigatório.' })
    const market = await prisma.market.create({ data: { name, sportSlug: sportSlug || 'futebol' } })
    res.status(201).json(market)
  } catch {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

router.put('/markets/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, sportSlug } = req.body
    const market = await prisma.market.update({
      where: { id: req.params.id },
      data: { name, sportSlug: sportSlug || 'futebol' },
    })
    res.json(market)
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar.' })
  }
})

router.delete('/markets/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.market.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Erro ao excluir.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// TIMES PERSONALIZADOS
// ══════════════════════════════════════════════════════════════════════════════

router.get('/custom-teams', authenticate, async (req, res) => {
  const { search, group } = req.query as { search?: string; group?: string }
  const teams = await prisma.customTeam.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(group  ? { group } : {}),
    },
    orderBy: { name: 'asc' },
  })
  res.json(teams)
})

router.post('/custom-teams', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, group } = req.body
    if (!name || !group) return res.status(400).json({ error: 'name e group são obrigatórios.' })
    const team = await prisma.customTeam.create({ data: { name, group } })
    res.status(201).json(team)
  } catch {
    res.status(500).json({ error: 'Erro interno.' })
  }
})

router.put('/custom-teams/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, group } = req.body
    const team = await prisma.customTeam.update({
      where: { id: req.params.id },
      data: { name, group },
    })
    res.json(team)
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar.' })
  }
})

router.delete('/custom-teams/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.customTeam.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Erro ao excluir.' })
  }
})

// ══════════════════════════════════════════════════════════════════════════════
// SEED — popula os dados padrão (só ADMIN/MASTER)
// ══════════════════════════════════════════════════════════════════════════════

router.post('/seed', authenticate, requireAdmin, async (_req, res) => {
  try {
    const DEFAULT_SPORTS = [
      { name: 'Futebol',            emoji: '⚽', slug: 'futebol'   },
      { name: 'Basquete',           emoji: '🏀', slug: 'basquete'  },
      { name: 'Tênis',              emoji: '🎾', slug: 'tenis'     },
      { name: 'eSports',            emoji: '🎮', slug: 'esports'   },
      { name: 'Vôlei',              emoji: '🏐', slug: 'volei'     },
      { name: 'MMA',                emoji: '🥊', slug: 'mma'       },
      { name: 'Futebol Americano',  emoji: '🏈', slug: 'nfl'       },
    ]
    for (const s of DEFAULT_SPORTS) {
      await prisma.sport.upsert({ where: { slug: s.slug }, update: {}, create: s })
    }

    const DEFAULT_BOOKMAKERS = [
      { name: 'Bet365',      differential: 'Variedade de mercados e Live Stream',         focus: 'Global / Tradicional'      },
      { name: 'Betano',      differential: 'Interface amigável e Missões (Gamificação)',   focus: 'Brasil / Europa'           },
      { name: 'Betfair',     differential: 'Maior Intercâmbio (Exchange) do mundo',       focus: 'Profissionais (Trade)'     },
      { name: 'Stake',       differential: 'Líder em apostas com Criptomoedas',           focus: 'Global / Cassino'          },
      { name: 'Pinnacle',    differential: 'Melhores Odds (Menor margem de lucro)',       focus: 'Apostadores Profissionais' },
      { name: '1xBet',       differential: 'Gigante em bônus e métodos de depósito',     focus: 'Global / Américas'         },
      { name: 'Sportingbet', differential: 'Uma das mais tradicionais no Brasil',         focus: 'Brasil'                    },
      { name: 'Parimatch',   differential: 'Odds competitivas em eSports',               focus: 'Global / eSports'          },
      { name: 'Novibet',     differential: 'Super Odds e Pagamento Antecipado',           focus: 'Brasil / Europa'           },
      { name: 'EstrelaBet',  differential: 'Patrocínio massivo e facilidade no Pix',     focus: 'Brasil'                    },
      { name: 'Pixbet',      differential: 'Depósito e saque rápido via Pix',             focus: 'Brasil'                    },
      { name: 'KTO',         differential: 'Odds competitivas e promoções frequentes',   focus: 'Brasil'                    },
      { name: 'Vaidebet',    differential: 'Alta visibilidade e bônus de boas-vindas',    focus: 'Brasil'                    },
      { name: 'Betnacional', differential: 'Casa brasileira com foco em futebol local',  focus: 'Brasil'                    },
      { name: 'Galera.bet',  differential: 'Experiência social e gamificada',             focus: 'Brasil'                    },
    ]
    for (const b of DEFAULT_BOOKMAKERS) {
      await prisma.bookmaker.upsert({ where: { name: b.name }, update: {}, create: b })
    }

    const DEFAULT_LEAGUES = [
      { name: 'UEFA - Champions League',           category: 'Elite Global',           featured: true  },
      { name: 'Inglaterra - Premier League',       category: 'Elite Global',           featured: true  },
      { name: 'Espanha - La Liga',                 category: 'Elite Global',           featured: true  },
      { name: 'Brasil - Brasileirão Série A',      category: 'Elite Global',           featured: true  },
      { name: 'Itália - Serie A',                  category: 'Elite Global',           featured: true  },
      { name: 'Alemanha - Bundesliga 1',           category: 'Elite Global',           featured: true  },
      { name: 'França - Ligue 1',                  category: 'Elite Global',           featured: true  },
      { name: 'UEFA - Liga Europa',                category: 'Elite Global',           featured: true  },
      { name: 'Conmebol - Copa Libertadores',      category: 'Elite Global',           featured: true  },
      { name: 'Portugal - Liga Portugal',          category: 'Alto Nível e Copas',     featured: false },
      { name: 'Países Baixos - Eredivisie',        category: 'Alto Nível e Copas',     featured: false },
      { name: 'Brasil - Copa do Brasil',           category: 'Alto Nível e Copas',     featured: false },
      { name: 'EUA - MLS',                         category: 'Alto Nível e Copas',     featured: false },
      { name: 'Inglaterra - Championship',         category: 'Alto Nível e Copas',     featured: false },
      { name: 'Espanha - La Liga 2',               category: 'Alto Nível e Copas',     featured: false },
      { name: 'Conmebol - Copa Sul-Americana',     category: 'Alto Nível e Copas',     featured: false },
      { name: 'Arábia Saudita - Saudi Pro League', category: 'Alto Nível e Copas',     featured: false },
      { name: 'UEFA - Conference League',          category: 'Alto Nível e Copas',     featured: false },
      { name: 'Brasil - Brasileirão Série B',      category: 'Ligas Consolidadas',     featured: false },
      { name: 'Argentina - Liga Profissional',     category: 'Ligas Consolidadas',     featured: false },
      { name: 'México - Liga MX',                  category: 'Ligas Consolidadas',     featured: false },
      { name: 'Japão - Liga J1',                   category: 'Ligas Consolidadas',     featured: false },
      { name: 'Alemanha - Bundesliga 2',           category: 'Ligas Consolidadas',     featured: false },
      { name: 'Itália - Serie B',                  category: 'Ligas Consolidadas',     featured: false },
      { name: 'FIFA - Copa do Mundo',              category: 'Torneios de Seleções',   featured: false },
      { name: 'UEFA - Eurocopa',                   category: 'Torneios de Seleções',   featured: false },
      { name: 'Conmebol - Copa América',           category: 'Torneios de Seleções',   featured: false },
      { name: 'Eliminatórias - América do Sul',    category: 'Torneios de Seleções',   featured: false },
      { name: 'Basket - NBA',                      category: 'Outros Esportes',        featured: false },
      { name: 'Basket - Euroliga',                 category: 'Outros Esportes',        featured: false },
      { name: 'Vôlei - Superliga',                 category: 'Outros Esportes',        featured: false },
    ]
    for (const l of DEFAULT_LEAGUES) {
      const existing = await prisma.league.findFirst({ where: { name: l.name } })
      if (!existing) await prisma.league.create({ data: l })
    }

    const RAW_MARKETS = [
      "Ambas Marcam",
      "Asiático - Mais de 0.5 gols", "Asiático - Mais de 0.75 gols", "Asiático - Mais de 1.0 gols", "Asiático - Mais de 1.25 gols", "Asiático - Mais de 1.5 gols", "Asiático - Mais de 1.75 gols", "Asiático - Mais de 2.0 gols", "Asiático - Mais de 2.25 gols", "Asiático - Mais de 2.5 gols", "Asiático - Mais de 2.75 gols", "Asiático - Mais de 3.0 gols", "Asiático - Mais de 3.25 gols", "Asiático - Mais de 3.5 gols", "Asiático - Mais de 3.75 gols", "Asiático - Mais de 4.0 gols", "Asiático - Mais de 4.25 gols", "Asiático - Mais de 4.5 gols", "Asiático - Mais de 4.75 gols", "Asiático - Mais de 5.0 gols", "Asiático - Mais de 5.25 gols", "Asiático - Mais de 5.5 gols", "Asiático - Mais de 5.75 gols", "Asiático - Mais de 6.0 gols", "Asiático - Mais de 6.25 gols", "Asiático - Mais de 6.5 gols", "Asiático - Mais de 6.75 gols", "Asiático - Mais de 7.0 gols", "Asiático - Mais de 7.25 gols", "Asiático - Mais de 7.5 gols", "Asiático - Mais de 7.75 gols", "Asiático - Mais de 8.0 gols",
      "Asiático - Menos  de 4.75 gols", "Asiático - Menos  de 6.5 gols", "Asiático - Menos  de 6.75 gols",
      "Asiático - Menos de 0.5 gols", "Asiático - Menos de 0.75 gols", "Asiático - Menos de 1.0 gols", "Asiático - Menos de 1.25 gols", "Asiático - Menos de 1.5 gols", "Asiático - Menos de 1.75 gols", "Asiático - Menos de 2.0 gols", "Asiático - Menos de 2.25 gols", "Asiático - Menos de 2.5 gols", "Asiático - Menos de 2.75 gols", "Asiático - Menos de 3.0 gols", "Asiático - Menos de 3.25 gols", "Asiático - Menos de 3.5 gols", "Asiático - Menos de 3.75 gols", "Asiático - Menos de 4.0 gols", "Asiático - Menos de 4.25 gols", "Asiático - Menos de 4.5 gols", "Asiático - Menos de 5.0 gols", "Asiático - Menos de 5.25 gols", "Asiático - Menos de 5.5 gols", "Asiático - Menos de 5.75 gols", "Asiático - Menos de 6.0 gols", "Asiático - Menos de 6.25 gols", "Asiático - Menos de 7.0 gols", "Asiático - Menos de 7.25 gols", "Asiático - Menos de 7.5 gols", "Asiático - Menos de 7.75 gols", "Asiático - Menos de 8.0 gols",
      "Back Favorito",
      "Basket - Casa", "Basket - Fora", "Basket - Handicap Mais Pontos Casa", "Basket - Handicap Mais Pontos Fora", "Basket - Handicap Menos Pontos Casa", "Basket - Handicap Menos Pontos Fora", "Basket - Mais Total Pontos", "Basket - Menos Total Pontos", "Basket - Personalizada",
      "Basket - Vencedor 1º Intervalo Casa", "Basket - Vencedor 1º Intervalo Empate", "Basket - Vencedor 1º Intervalo Fora",
      "Basket - Vencedor 1º Quarto Casa", "Basket - Vencedor 1º Quarto Empate", "Basket - Vencedor 1º Quarto Fora",
      "Basket - Vencedor 2º Intervalo Casa", "Basket - Vencedor 2º Intervalo Empate", "Basket - Vencedor 2º Intervalo Fora",
      "Basket - Vencedor 2º Quarto Casa", "Basket - Vencedor 2º Quarto Empate", "Basket - Vencedor 2º Quarto Fora",
      "Basket - Vencedor 3º Quarto Casa", "Basket - Vencedor 3º Quarto Empate", "Basket - Vencedor 3º Quarto Fora",
      "Basket - Vencedor 4º Quarto Casa", "Basket - Vencedor 4º Quarto Empate", "Basket - Vencedor 4º Quarto Fora",
      "Cartões - Ambas Recebem 1 - Não", "Cartões - Ambas Recebem 1 - Sim", "Cartões - Ambas Recebem 2 ou mais - Não", "Cartões - Ambas Recebem 2 ou mais - Sim",
      "Cartões - Casa +", "Cartões - Empate", "Cartões - Fora +",
      "Cartões - Mais de 1.5", "Cartões - Mais de 2.5", "Cartões - Mais de 3.5", "Cartões - Mais de 4.5", "Cartões - Mais de 5.5", "Cartões - Mais de 6.5", "Cartões - Mais de 7.5", "Cartões - Mais de 8.5", "Cartões - Mais de 9.5",
      "Cartões - Menos de 1.5", "Cartões - Menos de 2.5", "Cartões - Menos de 3.5", "Cartões - Menos de 4.5", "Cartões - Menos de 5.5", "Cartões - Menos de 6.5", "Cartões - Menos de 7.5", "Cartões - Menos de 8.5", "Cartões - Menos de 9.5",
      "Cartões Vermelhos - Mais de 0.5", "Cartões Vermelhos - Mais de 1.5", "Cartões Vermelhos - Menos de 0.5", "Cartões Vermelhos - Menos de 1.5",
      "Casa - Mais de 0.5 gols", "Casa - Mais de 1.5 gols", "Casa - Mais de 2.5 gols", "Casa - Mais de 3.5 gols", "Casa - Mais de 4.5 gols",
      "Casa - Menos de 0.5 gols", "Casa - Menos de 1.5 gols", "Casa - Menos de 2.5 gols", "Casa - Menos de 3.5 gols", "Casa - Menos de 4.5 gols",
      "DC - Casa ou Empate", "DC - Casa ou Fora", "DC - Fora ou Empate",
      "Escanteios - Casa Mais de 1.5", "Escanteios - Casa Mais de 2.5", "Escanteios - Casa Mais de 3.5", "Escanteios - Casa Mais de 4.5", "Escanteios - Casa Mais de 5.5", "Escanteios - Casa Mais de 6.5", "Escanteios - Casa Mais de 7.5", "Escanteios - Casa Mais de 8.5", "Escanteios - Casa Mais de 9.5",
      "Escanteios - Casa Menos de 1.5", "Escanteios - Casa Menos de 2.5", "Escanteios - Casa Menos de 3.5", "Escanteios - Casa Menos de 4.5", "Escanteios - Casa Menos de 5.5", "Escanteios - Casa Menos de 6.5", "Escanteios - Casa Menos de 7.5", "Escanteios - Casa Menos de 8.5", "Escanteios - Casa Menos de 9.5",
      "Escanteios - Casa+", "Escanteios - Empate",
      "Escanteios - Fora Mais de 1.5", "Escanteios - Fora Mais de 2.5", "Escanteios - Fora Mais de 3.5", "Escanteios - Fora Mais de 4.5", "Escanteios - Fora Mais de 5.5", "Escanteios - Fora Mais de 6.5", "Escanteios - Fora Mais de 7.5", "Escanteios - Fora Mais de 8.5", "Escanteios - Fora Mais de 9.5",
      "Escanteios - Fora Menos de 1.5", "Escanteios - Fora Menos de 2.5", "Escanteios - Fora Menos de 3.5", "Escanteios - Fora Mais de 1.5", "Escanteios - Fora Menos de 4.5", "Escanteios - Fora Menos de 5.5", "Escanteios - Fora Menos de 6.5", "Escanteios - Fora Menos de 7.5", "Escanteios - Fora Menos de 8.5", "Escanteios - Fora Menos de 9.5",
      "Escanteios - Fora+",
      "Escanteios - Mais de 10.5", "Escanteios - Mais de 11.5", "Escanteios - Mais de 12.5", "Escanteios - Mais de 13.5", "Escanteios - Mais de 14.5", "Escanteios - Mais de 15.5", "Escanteios - Mais de 2.5", "Escanteios - Mais de 3.5", "Escanteios - Mais de 4.5", "Escanteios - Mais de 5.5", "Escanteios - Mais de 6.5", "Escanteios - Mais de 7.5", "Escanteios - Mais de 8.5", "Escanteios - Mais de 9.5",
      "Escanteios - Menos de 10.5", "Escanteios - Menos de 11.5", "Escanteios - Menos de 12.5", "Escanteios - Menos de 13.5", "Escanteios - Menos de 14.5", "Escanteios - Menos de 15.5", "Escanteios - Menos de 2.5", "Escanteios - Menos de 3.5", "Escanteios - Menos de 4.5", "Escanteios - Menos de 5.5", "Escanteios - Menos de 6.5", "Escanteios - Menos de 7.5", "Escanteios - Menos de 8.5", "Escanteios - Menos de 9.5",
      "Escanteios - Race 1 - Casa", "Escanteios - Race 1 - Fora", "Escanteios - Race 2 - Casa", "Escanteios - Race 2 - Fora", "Escanteios - Race 3 - Casa", "Escanteios - Race 3 - Fora", "Escanteios - Race 4 - Casa", "Escanteios - Race 4 - Fora", "Escanteios - Race 5 - Casa", "Escanteios - Race 5 - Fora", "Escanteios - Race 6 - Casa", "Escanteios - Race 6 - Fora", "Escanteios - Race 7 - Casa", "Escanteios - Race 7 - Fora", "Escanteios - Race 8 - Casa", "Escanteios - Race 8 - Fora", "Escanteios - Race 9 - Casa", "Escanteios - Race 9 - Fora",
      "Escanteios 1ºTempo - Casa Mais de 1.5", "Escanteios 1ºTempo - Casa Mais de 2.5", "Escanteios 1ºTempo - Casa Mais de 3.5", "Escanteios 1ºTempo - Casa Mais de 4.5", "Escanteios 1ºTempo - Casa Mais de 5.5",
      "Escanteios 1ºTempo - Casa Menos de 1.5", "Escanteios 1ºTempo - Casa Menos de 2.5", "Escanteios 1ºTempo - Casa Menos de 3.5", "Escanteios 1ºTempo - Casa Menos de 4.5", "Escanteios 1ºTempo - Casa Menos de 5.5",
      "Escanteios 1ºTempo - Fora Mais de 1.5", "Escanteios 1ºTempo - Fora Mais de 2.5", "Escanteios 1ºTempo - Fora Mais de 3.5", "Escanteios 1ºTempo - Fora Mais de 4.5", "Escanteios 1ºTempo - Fora Mais de 5.5",
      "Escanteios 1ºTempo - Fora Menos de 1.5", "Escanteios 1ºTempo - Fora Menos de 2.5", "Escanteios 1ºTempo - Fora Menos de 3.5", "Escanteios 1ºTempo - Fora Menos de 4.5", "Escanteios 1ºTempo - Fora Menos de 5.5",
      "Escanteios 1ºTempo - Mais de 1.5", "Escanteios 1ºTempo - Mais de 2.5", "Escanteios 1ºTempo - Mais de 3.5", "Escanteios 1ºTempo - Mais de 4.5", "Escanteios 1ºTempo - Mais de 5.5", "Escanteios 1ºTempo - Mais de 6.5", "Escanteios 1ºTempo - Mais de 7.5",
      "Fora - Mais de 0.5 gols", "Fora - Mais de 1.5 gols", "Fora - Mais de 2.5 gols", "Fora - Mais de 3.5 gols", "Fora - Mais de 4.5 gols",
      "Fora - Menos de 0.5 gols", "Fora - Menos de 1.5 gols", "Fora - Menos de 2.5 gols", "Fora - Menos de 3.5 gols", "Fora - Menos de 4.5 gols",
      "Futebol - Personalizada",
      "Handicap Asiático Casa -0.5", "Handicap Asiático Casa -0.75", "Handicap Asiático Casa -1.0", "Handicap Asiático Casa -1.25", "Handicap Asiático Casa -1.5", "Handicap Asiático Casa -1.75", "Handicap Asiático Casa -2.0", "Handicap Asiático Casa -2.25", "Handicap Asiático Casa -2.5", "Handicap Asiático Casa -2.75", "Handicap Asiático Casa -3.0", "Handicap Asiático Casa -3.25", "Handicap Asiático Casa -3.5", "Handicap Asiático Casa -3.75", "Handicap Asiático Casa -4.0", "Handicap Asiático Casa -4.25", "Handicap Asiático Casa -4.5", "Handicap Asiático Casa -4.75", "Handicap Asiático Casa -5.0",
      "Handicap Asiático Casa +0.5", "Handicap Asiático Casa +0.75", "Handicap Asiático Casa +1.0", "Handicap Asiático Casa +1.25", "Handicap Asiático Casa +1.5", "Handicap Asiático Casa +1.75", "Handicap Asiático Casa +2.0", "Handicap Asiático Casa +2.25", "Handicap Asiático Casa +2.5", "Handicap Asiático Casa +2.75", "Handicap Asiático Casa +3.0", "Handicap Asiático Casa +3.25", "Handicap Asiático Casa +3.5", "Handicap Asiático Casa +3.75", "Handicap Asiático Casa +4.0", "Handicap Asiático Casa +4.25", "Handicap Asiático Casa +4.5", "Handicap Asiático Casa +4.75", "Handicap Asiático Casa +5.0",
      "Handicap Asiático Fora  -1.75", "Handicap Asiático Fora  +1.75", "Handicap Asiático Fora -0.5", "Handicap Asiático Fora -0.75", "Handicap Asiático Fora -1.0", "Handicap Asiático Fora -1.25", "Handicap Asiático Fora -1.5", "Handicap Asiático Fora -2.0", "Handicap Asiático Fora -2.25", "Handicap Asiático Fora -2.5", "Handicap Asiático Fora -2.75", "Handicap Asiático Fora -3.0", "Handicap Asiático Fora -3.25", "Handicap Asiático Fora -3.5", "Handicap Asiático Fora -3.75", "Handicap Asiático Fora -4.0", "Handicap Asiático Fora -4.25", "Handicap Asiático Fora -4.5", "Handicap Asiático Fora -4.75", "Handicap Asiático Fora -5.0",
      "Handicap Asiático Fora +0.5", "Handicap Asiático Fora +0.75", "Handicap Asiático Fora +1.0", "Handicap Asiático Fora +1.25", "Handicap Asiático Fora +1.5", "Handicap Asiático Fora +2.0", "Handicap Asiático Fora +2.25", "Handicap Asiático Fora +2.5", "Handicap Asiático Fora +2.75", "Handicap Asiático Fora +3.0", "Handicap Asiático Fora +3.25", "Handicap Asiático Fora +3.5", "Handicap Asiático Fora +3.75", "Handicap Asiático Fora +4.0", "Handicap Asiático Fora +4.25", "Handicap Asiático Fora +4.5", "Handicap Asiático Fora +4.75", "Handicap Asiático Fora +5.0",
      "Handicap Casa -1", "Handicap Casa -2", "Handicap Casa -3", "Handicap Casa -4", "Handicap Casa -5", "Handicap Casa -6", "Handicap Casa -7", "Handicap Casa -8", "Handicap Casa -9",
      "Handicap Casa +1", "Handicap Casa +2", "Handicap Casa +3", "Handicap Casa +4", "Handicap Casa +5", "Handicap Casa +6", "Handicap Casa +7", "Handicap Casa +8", "Handicap Casa +9",
      "Handicap Fora -1", "Handicap Fora -2", "Handicap Fora -3", "Handicap Fora -4", "Handicap Fora -5", "Handicap Fora -6", "Handicap Fora -7", "Handicap Fora -8", "Handicap Fora -9",
      "Handicap Fora +1", "Handicap Fora +2", "Handicap Fora +3", "Handicap Fora +4", "Handicap Fora +5", "Handicap Fora +6", "Handicap Fora +7", "Handicap Fora +8", "Handicap Fora +9",
      "Lay Favorito",
      "Mais de 0.5 gols", "Mais de 1.5 gols", "Mais de 10.5 gols", "Mais de 2.5 gols", "Mais de 3.5 gols", "Mais de 4.5 gols", "Mais de 5.5 gols", "Mais de 6.5 gols", "Mais de 7.5 gols", "Mais de 8.5 gols", "Mais de 9.5 gols",
      "Menos de 0.5 gols", "Menos de 1.5 gols", "Menos de 10.5 gols", "Menos de 2.5 gols", "Menos de 3.5 gols", "Menos de 4.5 gols", "Menos de 5.5 gols", "Menos de 6.5 gols", "Menos de 7.5 gols", "Menos de 8.5 gols", "Menos de 9.5 gols",
      "Vôlei - 0x3", "Vôlei - 1x3", "Vôlei - 2x3", "Vôlei - 3 Sets", "Vôlei - 3x0", "Vôlei - 3x1", "Vôlei - 3x2", "Vôlei - 4 Sets", "Vôlei - 5 Sets", "Vôlei - Casa", "Vôlei - Fora",
      "Vôlei - Handicap -1.5 Casa", "Vôlei - Handicap -1.5 Fora", "Vôlei - Handicap -2.5 Casa", "Vôlei - Handicap -2.5 Fora",
      "Vôlei - Handicap +1.5 Casa", "Vôlei - Handicap +1.5 Fora", "Vôlei - Handicap +2.5 Casa", "Vôlei - Handicap +2.5 Fora",
      "Vôlei - Mais Pontos", "Vôlei - Menos Pontos", "Vôlei - Personalizada",
      "Vôlei - Vencedor 1º Set Casa", "Vôlei - Vencedor 1º Set Fora",
      "Vôlei - Vencedor 2º Set Casa", "Vôlei - Vencedor 2º Set Fora",
      "Vôlei - Vencedor 3º Set Casa", "Vôlei - Vencedor 3º Set Fora",
      "Vôlei - Vencedor 4º Set Casa", "Vôlei - Vencedor 4º Set Fora",
      "Vôlei - Vencedor 5º Set Casa", "Vôlei - Vencedor 5º Set Fora"
    ]
    
    // Converte os nomes em objetos para createMany
    const marketData = RAW_MARKETS.map(name => {
      let sportSlug = 'futebol'
      if (name.startsWith('Basket -')) sportSlug = 'basquete'
      if (name.startsWith('Vôlei -')) sportSlug = 'volei'
      return { name, sportSlug }
    })

    console.log('Seeding markets starting...')
    // Inserção em massa para performance (evita timeout)
    const seedResult = await prisma.market.createMany({
      data: marketData,
      skipDuplicates: true
    })
    console.log('Markets seed finished:', seedResult)

    const sportCounts = await prisma.sport.count()
    const leagueCounts = await prisma.league.count()
    const bmCounts = await prisma.bookmaker.count()
    const mkCounts = await prisma.market.count()

    console.log('Final counts:', { sportCounts, leagueCounts, bmCounts, mkCounts })

    res.json({
      message: 'Seed executado com sucesso!',
      sports: Number(sportCounts),
      leagues: Number(leagueCounts),
      bookmakers: Number(bmCounts),
      markets: Number(mkCounts),
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao executar seed.' })
  }
})

export default router
