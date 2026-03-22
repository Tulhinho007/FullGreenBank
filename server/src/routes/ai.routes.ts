import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/scan-bilhete', authenticate, async (req, res) => {
  try {
    const { messages } = req.body

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada' })
      return
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages }),
    })

    const data = await response.json()
    res.json(data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    res.status(500).json({ error: msg })
  }
})

export default router