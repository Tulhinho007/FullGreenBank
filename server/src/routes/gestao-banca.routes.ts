import { Router } from 'express'
import { body, query } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'

const router = Router()
const prisma = new PrismaClient()

// ── GET /gestao-banca/:casaAposta
// Retorna a config e as linhas do mẽs/casa específicos
router.get(
  '/:casaAposta',
  authenticate,
  async (req: any, res: any) => {
    try {
      const { casaAposta } = req.params
      const userId = req.user!.id

      // Busca configs
      let config = await prisma.gestaoBancaConfig.findUnique({
        where: { userId_casaAposta: { userId, casaAposta } },
      })

      // Auto-cria config inicial pra essa casa se não existir
      if (!config) {
        config = await prisma.gestaoBancaConfig.create({
          data: { userId, casaAposta, bancaInicial: 1000, perfilRisco: 'moderado' },
        })
      }

      // Busca os itens do usuario pra essa casa
      const itens = await prisma.gestaoBancaItem.findMany({
        where: { userId, casaAposta },
        orderBy: { dataReferencia: 'asc' },
      })

      res.json({
        config,
        itens: itens.map((i) => ({
          ...i,
          // Formatando DateTime pro Front End
          dataReferencia: i.dataReferencia.toISOString().split('T')[0], 
          deposito: Number(i.deposito),
          saque: Number(i.saque),
          resultado: Number(i.resultado),
        })),
      })
    } catch (error) {
      console.error('Erro ao buscar dados da banca:', error)
      res.status(500).json({ message: 'Erro interno ao buscar gestão de banca.' })
    }
  }
)

// ── PATCH /gestao-banca/:casaAposta/config
// Atualiza a Banca Inicial e Perfil de Risco da casa x
router.patch(
  '/:casaAposta/config',
  authenticate,
  [
    body('bancaInicial').isFloat({ min: 0 }),
    body('perfilRisco').isString().notEmpty(),
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { casaAposta } = req.params
      const userId = req.user!.id
      const { bancaInicial, perfilRisco } = req.body

      const config = await prisma.gestaoBancaConfig.upsert({
        where: { userId_casaAposta: { userId, casaAposta } },
        update: { bancaInicial: Number(bancaInicial), perfilRisco },
        create: { userId, casaAposta, bancaInicial: Number(bancaInicial), perfilRisco },
      })

      res.json(config)
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar configurações da banca.' })
    }
  }
)

// ── POST /gestao-banca/:casaAposta/item
// Salva TODA a cadeia de linhas que o frontend manda (substituição completa) 
// ou só as alterações. O react envia [Array de linhas] para simplificar, 
// a gente deleta e reinsere ou dá upsert? 
// Upsert é mais rápido, mas como ID muda? 
// No React criamos ID provisório (Date.now()), no BD temos o UUID.
router.post(
  '/:casaAposta/sync',
  authenticate,
  [body('linhas').isArray()],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const { casaAposta } = req.params
      const userId = req.user!.id
      const { linhas } = req.body

      // Apaga todos os itens dessa casa pro usuario (sync total para evitar órfãos e complexidades de ordem/deleção mista)
      // Como não tem ID externo além da gestão da UI, essa abordagem é 100% confiável pra recriar:
      await prisma.$transaction(async (tx) => {
        await tx.gestaoBancaItem.deleteMany({
          where: { userId, casaAposta }
        })

        if (linhas.length > 0) {
          await tx.gestaoBancaItem.createMany({
            data: linhas.map((r: any) => ({
              userId,
              casaAposta,
              dataReferencia: new Date(r.date + 'T12:00:00Z'),
              deposito: Number(r.deposit),
              saque: Number(r.withdrawal),
              resultado: Number(r.result),
            }))
          })
        }
      })
      
      const newItems = await prisma.gestaoBancaItem.findMany({
         where: { userId, casaAposta },
         orderBy: { dataReferencia: 'asc' },
      })

      res.json({ success: true, itens: newItems.map(i => ({
          ...i,
          dataReferencia: i.dataReferencia.toISOString().split('T')[0], 
          deposito: Number(i.deposito),
          saque: Number(i.saque),
          resultado: Number(i.resultado),
      })) })
    } catch (error) {
       console.error(error)
       res.status(500).json({ message: 'Erro ao sincronizar linhas diárias.' })
    }
  }
)

export default router
