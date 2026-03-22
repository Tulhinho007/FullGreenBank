import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const registerSchema = z.object({
  name:     z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  email:    z.string().email('Email inválido'),
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres').max(30),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

// ── Futevôlei ─────────────────────────────────────────────────────
export const createMatchSchema = z.object({
  player1:     z.string().min(2).max(50),
  player2:     z.string().min(2).max(50),
  player3:     z.string().min(2).max(50),
  player4:     z.string().min(2).max(50),
  stake:       z.number().positive('Valor deve ser positivo'),
  totalSets:   z.number().int().min(1).max(5),
  pointsPerSet: z.number().int().min(1).max(30),
})

// ── Middleware de validação ────────────────────────────────────────
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors,
      })
      return
    }
    req.body = result.data
    next()
  }