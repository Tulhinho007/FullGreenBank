import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import tipsRoutes from './routes/tips.routes';
import userRoutes from './routes/user.routes';
import teamsRoutes from './routes/teams.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middlewares ────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://full-green-bank.vercel.app'
      ];
      
      // Permite origins da lista ou qualquer subdomínio da vercel.app (para branches de preview)
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/tips',  tipsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamsRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Full Green Bank API running 🟢' });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🟢 Full Green Bank API`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
