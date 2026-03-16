# 🟢 Full Green Bank

Sistema web para controle de banca de apostas esportivas.

## Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de dados**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Autenticação**: JWT + bcrypt

---

## 🚀 Configuração Inicial

### 1. Pré-requisitos
- Node.js 18+
- Conta no [Supabase](https://supabase.com) (grátis)

### 2. Instalar dependências
```bash
npm install          # instala concurrently
npm run install:all  # instala server + client
```

### 3. Configurar variáveis de ambiente

**Backend** — copie e edite `server/.env.example` → `server/.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="uma-chave-secreta-longa-e-aleatoria"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

> No Supabase: Settings → Database → Connection String → URI

**Frontend** — copie `client/.env.example` → `client/.env` (opcional, o proxy Vite cuida disso).

### 4. Configurar banco de dados
```bash
npm run prisma:generate  # gera o Prisma Client
npm run prisma:migrate   # cria as tabelas no Supabase
```

### 5. Rodar em desenvolvimento
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend:  http://localhost:3001
- API health: http://localhost:3001/api/health

---

## 📁 Estrutura do Projeto

```
fullgreen-app/
├── client/                    # Frontend React + Tailwind
│   └── src/
│       ├── components/        # Componentes reutilizáveis
│       │   ├── layout/        # AppLayout, Sidebar, Header
│       │   └── ui/            # StatCard, TipCard, Modal
│       ├── contexts/          # AuthContext (estado global)
│       ├── hooks/             # Hooks customizados (futuro)
│       ├── pages/             # Páginas da aplicação
│       ├── services/          # Chamadas à API (axios)
│       └── utils/             # Formatadores e helpers
│
├── server/                    # Backend Node.js + TypeScript
│   ├── prisma/schema.prisma   # Modelos do banco de dados
│   └── src/
│       ├── controllers/       # Handlers das requisições
│       ├── middlewares/       # Auth JWT + Validação
│       ├── models/            # Prisma Client singleton
│       ├── routes/            # Definição das rotas REST
│       ├── services/          # Lógica de negócio
│       └── utils/             # JWT, bcrypt, response helpers
│
└── docs/                      # Documentação
```

---

## 🔐 Roles

| Role   | Permissões |
|--------|-----------|
| MEMBRO | Ver dicas, editar próprio perfil |
| ADMIN  | + Criar dicas, gerenciar usuários |
| MASTER | + Alterar roles de usuários |

> Todo novo cadastro começa como **MEMBRO**.

---

## 🌐 Endpoints da API

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Dados do usuário logado |

### Dicas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/tips` | Listar dicas (paginado) |
| GET  | `/api/tips/:id` | Detalhe de uma dica |
| POST | `/api/tips` | Criar dica (ADMIN+) |
| PATCH| `/api/tips/:id/result` | Atualizar resultado (ADMIN+) |

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/api/users` | Listar usuários (ADMIN+) |
| GET  | `/api/users/:id` | Detalhe de usuário (ADMIN+) |
| PATCH| `/api/users/profile/me` | Atualizar perfil próprio |
| PATCH| `/api/users/:id/role` | Alterar role (MASTER) |
| PATCH| `/api/users/:id/toggle-active` | Ativar/desativar (ADMIN+) |
