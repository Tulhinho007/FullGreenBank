import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/scan-bilhete', authenticate, async (req, res) => {
  try {
    const { messages } = req.body
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages }),
    })
    const data = await response.json()
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Erro ao processar imagem' })
  }
})

export default router