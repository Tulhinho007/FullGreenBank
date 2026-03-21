import { Router } from 'express'
import { body, query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'

const router = Router()
const prisma = new PrismaClient()

// ── GET /gestao-banca/carteiras
// Retorna as carteiras de todas as casas de aposta do usuário
router.get('/carteiras', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user!.userId
    const carteiras = await prisma.bancaCarteira.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(carteiras.map((c: any) => ({
      ...c,
      bancaInicial: Number(c.bancaInicial)
    })))
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar carteiras.' })
  }
})

// ── GET /gestao-banca/carteiras/:id
router.get('/carteiras/:id', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params
    const carteira = await prisma.bancaCarteira.findUnique({
      where: { id }
    })
    
    if (!carteira || carteira.userId !== userId) {
      return res.status(404).json({ message: 'Banca não encontrada.' })
    }

    res.json({
      ...carteira,
      bancaInicial: Number(carteira.bancaInicial)
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar banca.' })
  }
})


// ── GET /gestao-banca/bookmakers
// ... pode deletar se o front não usar, mantivemos só pra clean code (não será acessado pq mudamos pro localstorage)
router.get('/bookmakers', authenticate, async (req: any, res: any) => {
  res.json([]) // deprecado
})

// ── GET /gestao-banca/carteiras/:id/itens
// Retorna os itens de uma carteira específica
router.get('/carteiras/:carteiraId/itens', authenticate, async (req: any, res: any) => {
  try {
    const { carteiraId } = req.params
    const userId = req.user!.userId
    
    // verifica a posse da carteira
    const carteira = await prisma.bancaCarteira.findUnique({ where: { id: carteiraId } })
    if (!carteira || carteira.userId !== userId) return res.status(403).json([])

    const itens = await prisma.gestaoBancaItem.findMany({
      where: { carteiraId },
      orderBy: { dataReferencia: 'asc' },
    })

    res.json({
      itens: itens.map((i) => ({
        ...i,
        dataReferencia: i.dataReferencia.toISOString().split('T')[0], 
        deposito: Number(i.deposito),
        saque: Number(i.saque),
        resultado: Number(i.resultado),
      })),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro interno ao buscar gestão de banca.' })
  }
})

// ── POST /gestao-banca/carteiras
// Cria nova carteira
router.post('/carteiras', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user!.userId
    const { nome, casaAposta, perfilRisco } = req.body
    
    const nova = await prisma.bancaCarteira.create({
      data: {
        userId,
        nome,
        casaAposta,
        bancaInicial: 0,
        perfilRisco: perfilRisco || 'moderado'
      }
    })
    
    res.status(201).json({ ...nova, bancaInicial: Number(nova.bancaInicial) })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar banca.' })
  }
})

// ── PATCH /gestao-banca/carteiras/:id
router.patch('/carteiras/:id', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params
    const { bancaInicial, perfilRisco } = req.body
    
    // Atualiza apenas se for do usuário
    const atualizada = await prisma.bancaCarteira.updateMany({
      where: { id, userId },
      data: {
        ...(bancaInicial !== undefined ? { bancaInicial: Number(bancaInicial) } : {}),
        ...(perfilRisco ? { perfilRisco } : {})
      }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Erro ao atualizar banca.' })
  }
})

// ── POST /gestao-banca/carteiras/:carteiraId/item
router.post('/carteiras/:carteiraId/item', authenticate, async (req: any, res: any) => {
  try {
    const { carteiraId } = req.params
    const { date, deposit, withdrawal, result } = req.body

    const newItem = await prisma.gestaoBancaItem.create({
      data: {
        carteiraId,
        dataReferencia: new Date(date + 'T12:00:00Z'),
        deposito: Number(deposit || 0),
        saque: Number(withdrawal || 0),
        resultado: Number(result || 0),
      }
    })

    res.status(201).json({
      ...newItem,
      dataReferencia: newItem.dataReferencia.toISOString().split('T')[0],
      deposito: Number(newItem.deposito),
      saque: Number(newItem.saque),
      resultado: Number(newItem.resultado)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro ao criar linha.' })
  }
})

// ── PATCH /gestao-banca/item/:id
router.patch('/item/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { date, deposit, withdrawal, result } = req.body

    const updated = await prisma.gestaoBancaItem.update({
      where: { id },
      data: {
        dataReferencia: new Date(date + 'T12:00:00Z'),
        deposito: Number(deposit || 0),
        saque: Number(withdrawal || 0),
        resultado: Number(result || 0),
      }
    })

    res.json({
      ...updated,
      dataReferencia: updated.dataReferencia.toISOString().split('T')[0],
      deposito: Number(updated.deposito),
      saque: Number(updated.saque),
      resultado: Number(updated.resultado)
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro ao atualizar linha.' })
  }
})

// ── DELETE /gestao-banca/item/:id
router.delete('/item/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params
    await prisma.gestaoBancaItem.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir.' })
  }
})

// ── DELETE /gestao-banca/carteiras/:id
router.delete('/carteiras/:id', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    // Primeiro deleta os itens da carteira (onCascade faria isso, mas garantimos aqui)
    await prisma.gestaoBancaItem.deleteMany({ where: { carteiraId: id } })
    
    // Deleta a carteira
    await prisma.bancaCarteira.deleteMany({
      where: { id, userId }
    })

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Erro ao excluir banca.' })
  }
})


export default router
