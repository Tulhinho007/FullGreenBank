# 📘 Full Green Bank — Resumo Completo do Projeto

> Documento gerado em: 20/03/2026
> Repositório: [github.com/Tulhinho007/FullGreenBank](https://github.com/Tulhinho007/FullGreenBank)

---

## 🏗️ O que é o Full Green Bank?

O **Full Green Bank** é uma plataforma SaaS de gestão de apostas esportivas voltada para tipsters e seus assinantes. O sistema permite:

- Gerenciar e publicar tips (dicas de apostas)
- Controlar bancas (bankroll) com múltiplas carteiras
- Acompanhar resultados, ROI, e desempenho
- Gerenciar assinaturas e pagamentos mensais de membros
- Controlar acesso de usuários por plano e status de pagamento

---

## 🧱 Arquitetura Técnica

### Stack Completa

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript + Vite |
| Estilização | TailwindCSS (com tema customizado dark/light) |
| Ícones | Lucide React |
| Roteamento | React Router v6 |
| Estado Global | Context API (AuthContext) |
| HTTP Client | Axios |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Banco de Dados | PostgreSQL (Supabase) |
| Autenticação | JWT (Bearer Token em localStorage) |
| Hospedagem | Vercel (frontend + backend serverless) |

### Estrutura de Pastas

```
Projeto Full Green Bank/
├── client/                         # Frontend React
│   ├── src/
│   │   ├── components/             # Componentes reutilizáveis
│   │   │   ├── layout/             # Header, Sidebar, Layout
│   │   │   └── ui/                 # Modal, Badges, Cards, etc.
│   │   ├── contexts/               # AuthContext (estado global de auth)
│   │   ├── pages/                  # Todas as páginas da aplicação
│   │   ├── services/               # Chamadas à API (Axios)
│   │   └── utils/                  # Utilitários (formatter, subscription, i18n)
│
└── server/                         # Backend Node.js
    ├── prisma/                     # Schema e migrations do banco
    └── src/
        ├── controllers/            # Controladores REST
        ├── middlewares/            # Auth, validação, rate limit
        ├── models/                 # Prisma Client
        ├── routes/                 # Definição das rotas
        ├── services/               # Lógica de negócio
        └── utils/                  # Helpers (JWT, hash, response)
```

---

## 👤 Usuários & Controle de Acesso

### Roles (Funções)

| Role | Descrição | Acesso |
|------|-----------|--------|
| **MASTER** | Super admin | Total — pode editar qualquer usuário incluindo ADMIN |
| **ADMIN** | Administrador | Gestão de membros, financeiro, cadastros, logs |
| **MEMBRO** | Assinante | Acesso às ferramentas de análise (condicional ao plano) |
| **TESTER** | Conta de teste | Somente leitura em todo o sistema |

### Controle por Assinatura (MEMBRO)

- Se `isActive = true` → acesso completo às ferramentas
- Se `isActive = false` (PENDENTE ou ATRASADO) → sidebar bloqueada, apenas Dashboard visível
- Mensagem exibida: *"Assinatura Expirada"* ou *"Assinatura Atrasada"*

---

## 💳 Sistema de Assinaturas & Pagamentos

### Planos Disponíveis

| Plano | Cor |
|-------|-----|
| **STARTER** | Verde — plano padrão de todo novo usuário |
| **STANDARD** | Índigo |
| **PRO** | Laranja |

### Status de Pagamento

| Status | Significado |
|--------|-------------|
| **ATIVO** | Assinatura em dia, acesso liberado |
| **PENDENTE** | Sem pagamento cadastrado |
| **ATRASADO** | Vencimento ultrapassado |
| **CANCELADO** | Cancelado manualmente |

### Regras de Negócio (Automáticas)

1. **Novo usuário** → começa como STARTER com status PENDENTE
2. **Admin confirma pagamento** → `createPayment()` define:
   - `purchaseDate = hoje`
   - `lastPaymentDate = hoje`
   - `dueDate = hoje + 30 dias`
   - `paymentStatus = ATIVO`
   - `isActive = true`
3. **A cada login/reload** → `checkSubscription()` verifica se `hoje > dueDate`:
   - Sim → `ATRASADO`, `isActive = false`
   - Não → `ATIVO`, `isActive = true`
4. **Renovação** → sempre usa a data atual como base (nunca soma ao vencimento antigo)

### Campos no Banco (tabela `users`)

```
plan            String   @default("STARTER")
value           Float?
payMethod       String?
purchaseDate    String?    -- data da compra (YYYY-MM-DD)
lastPaymentDate String?    -- data do último pagamento
dueDate         String?    -- data de vencimento
paymentStatus   String   @default("PENDENTE")
isActive        Boolean  @default(false)
notes           String?    -- histórico de pagamentos em texto
```

---

## 📄 Páginas da Aplicação

### Área do Membro
| Página | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | KPIs, resumo de tips, gráficos |
| Dicas | `/tips` | Lista de tips com filtros e resultados |
| Bancas | `/gestao/banca` | Gestão de bankroll com múltiplas carteiras |
| Tipsters | `/gestao/tipsters` | Dashboard de tipsters com área chart |
| Histórico de Contratos | `/gestao/historico` | Contratos de banca com clientes |
| Performance | `/reports` | Análise de performance por período |
| Nossos Planos | `/planos` | Página pública de planos disponíveis |
| FAQ | `/faq` | Central de Ajuda com acordeão |
| Report Bug | `/report` | Relato de problemas e feedback |
| Legal | `/legal/:type` | Termos, Privacidade, Cookies |
| Perfil | `/profile` | Configurações pessoais, senha, tema |

### Área de Administração
| Página | Rota | Descrição |
|--------|------|-----------|
| Financeiro / Pagamentos | `/financeiro/pagamentos` | Gestão de assinaturas dos membros |
| Banca Gerenciada | `/financeiro/banca-gerenciada` | Visão consolidada de bancas |
| Usuários | `/admin/users` | Listagem e gestão de usuários |
| Cadastros | `/admin/cadastros` | Cadastro rápido de usuários, esportes, times |
| Logs / Eventos | `/admin/log` | Histórico de ações no sistema |

---

## 🔧 Funcionalidades Implementadas (Esta Sessão)

### 1. Página de Pagamentos (FinanceiroPagamentosPage)
- Tabela exclusiva para MEMBROS (admin/master não aparecem)
- Colunas: Usuário, Plano, Valor, Forma de Pagamento, Status, Data de Compra, Próxima Mensalidade, Ações
- Badges coloridos para status e plano
- Ícones por forma de pagamento (Pix, Cartão, Boleto, Transferência)
- Botões "Editar" e "Histórico" sempre visíveis
- Modal unificado (sem abas) com todos os campos
- Datas exibidas apenas como DD/MM/YYYY
- Data vazia para usuários PENDENTE

### 2. Lógica de Assinatura Mensal
- Arquivo `subscription.ts` com `checkSubscription()` e `createPayment()`
- Verificação automática no login e refresh
- Status ATRASADO calculado automaticamente quando dueDate passa

### 3. Controle de Acesso no Sidebar
- Sidebar bloqueia por `isActive = false`
- Cobre tanto PENDENTE quanto ATRASADO
- Mensagem diferente para cada caso

### 4. Remoção do Plano FREE / TRIAL
- FREE removido de todo o sistema
- TRIAL removido como status de pagamento
- STARTER é agora o plano padrão

### 5. Correções de Bug
- Erro 422 no endpoint `/auth/me` — código status corrigido de 422 para 500
- Datas com cor branca no modo claro — corrigido para `text-slate-700 dark:text-slate-100`
- Campos financeiros não persistindo — Prisma schema e controller atualizados

### 6. Impersonation (Gerenciar Como)
- Admin pode assumir a conta de um membro para visualizar o sistema
- Botão "Voltar à minha conta" sempre visível

### 7. Sistema de Logs
- Toda ação importante é registrada: login, logout, edições, cadastros
- Visualizável em `/admin/log`

### 8. Multi-Carteira (Bancas)
- Cada usuário pode ter múltiplas carteiras por casa de apostas
- Adicionado campo `carteiraId` opcional na tabela `GestaoBancaItem`

### 9. Tipster Dashboard
- Página de gestão de Tipsters com filtros, KPI cards, área chart (Recharts) e tabela de dados

---

## 📡 API — Principais Endpoints

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/auth/login` | Público | Login |
| POST | `/api/auth/register` | Público | Cadastro |
| GET | `/api/auth/me` | Autenticado | Perfil atual |
| GET | `/api/users` | ADMIN/MASTER | Listar usuários |
| PATCH | `/api/users/:id/profile` | ADMIN/MASTER | Editar usuário |
| PATCH | `/api/users/profile/me` | Autenticado | Editar próprio perfil |
| PATCH | `/api/users/:id/role` | MASTER | Alterar role |
| PATCH | `/api/users/:id/toggle-active` | ADMIN/MASTER | Ativar/desativar |
| GET | `/api/tips` | Autenticado | Listar tips |
| POST | `/api/tips` | ADMIN/MASTER | Criar tip |
| GET | `/api/banca/contratos` | Autenticado | Contratos de banca |

---

## 🗂️ Variáveis de Ambiente Necessárias

### Backend (`.env`)
```
DATABASE_URL=        # URL de conexão Supabase (pooling)
DIRECT_URL=          # URL direta Supabase (para Prisma migrations)
JWT_SECRET=          # Chave secreta para JWT
```

### Frontend (`.env`)
```
VITE_API_URL=        # URL base da API (ex: https://full-green-bank-backend.vercel.app/api)
```

---

## 📌 Últimos Commits (Resumo)

| Commit | Descrição |
|--------|-----------|
| `a7e2e6c` | fix: remove FREE plan, set STARTER as default, fix date color in light mode |
| `bb5f698` | feat: implement monthly subscription renewal logic |
| `fb8c11d` | feat: refine Financeiro UI Phase 2 - unified modal, persistent buttons |
| `3e28959` | feat: financial page full redesign + access control by payment status |
| `f5fe198` | fix: 422 error on profile update, schema migration |
