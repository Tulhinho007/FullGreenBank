import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import logRoutes from './routes/log.routes'


import authRoutes          from './routes/auth.routes';
import tipsRoutes          from './routes/tips.routes';
import userRoutes          from './routes/user.routes';
import teamsRoutes         from './routes/teams.routes';
import bancaContratosRoutes from './routes/banca-contratos.routes';
import gestaoBancaRoutes   from './routes/gestao-banca.routes';
import supportRoutes       from './routes/support.routes';
import solicitacoesRoutes  from './routes/solicitacoes.routes';
import cadastrosRoutes     from './routes/cadastros.routes';
import futvoleiRoutes      from './routes/futvolei.routes';
import permissionsRoutes   from './routes/permissions.routes';

import { securityLoggerMiddleware } from './utils/securityLogger'


const app = express();

// ── Trust Proxy (necessário para Vercel/proxies reversos) ─────────
app.set('trust proxy', 1);

// ── Helmet (deve vir primeiro) ────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  referrerPolicy:            { policy: 'strict-origin-when-cross-origin' },
  contentSecurityPolicy:     false, // configurado manualmente abaixo
  xFrameOptions:             { action: 'deny' },
}));

// ── Middlewares ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Impersonate-User-Id']
}));

// ── Security Headers (Modificado para Cross-Domain) ────────────────
app.use((_req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(securityLoggerMiddleware)

// ── Rate Limiting ─────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Muitas requisições. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/tips',            tipsRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/teams',           teamsRoutes);
app.use('/api/banca-contratos', bancaContratosRoutes);
app.use('/api/gestao-banca',    gestaoBancaRoutes);
app.use('/api/support',         supportRoutes);
app.use('/api/solicitacoes',    solicitacoesRoutes);

app.use('/api/cadastros',       cadastrosRoutes);
app.use('/api/futvolei',        futvoleiRoutes);
app.use('/api/permissions',     permissionsRoutes);
app.use('/api/logs', logRoutes)

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Full Green Bank API running 🟢' });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// ── Global Error Handler (Hides stack traces in production) ──────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('SERVER ERROR:', err);
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || 500;
  
  // No PRD, não vazamos a mensagem real do erro se for 500
  const message = (isProd && statusCode === 500) ? 'Erro interno no servidor' : (err.message || 'Erro desconhecido');
  
  res.status(statusCode).json({
    success: false,
    message,
    errors: isProd ? null : err.stack
  });
});

// ── Export para o Vercel ──────────────────────────────────────────
export default app;

// ── Start local (não roda na Vercel/Serverless) ───────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\n🟢 Full Green Bank API`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}