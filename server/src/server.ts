import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import tipsRoutes from './routes/tips.routes';
import userRoutes from './routes/user.routes';
import teamsRoutes from './routes/teams.routes';
import bancaContratosRoutes from './routes/banca-contratos.routes';

const app = express();

// ─── Middlewares ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://full-green-bank.vercel.app',
        'https://full-green-bank-49h4bm5ul-kamaelcontatos-1282s-projects.vercel.app'
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/tips',  tipsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/banca-contratos', bancaContratosRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Full Green Bank API running 🟢' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// ─── Export para o Vercel ─────────────────────────────────────────────────────
export default app;

// ─── Start local (não roda na Vercel/Serverless) ──────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => {
    console.log(`\n🟢 Full Green Bank API`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}