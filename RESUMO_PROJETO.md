# 📘 Full Green Bank — Resumo Completo do Projeto

> Documento atualizado em: 28/03/2026
> Repositório: [github.com/Tulhinho007/FullGreenBank](https://github.com/Tulhinho007/FullGreenBank)

---

## 🏗️ O que é o Full Green Bank?

O **Full Green Bank** é uma plataforma SaaS de gestão de apostas esportivas voltada para tipsters e seus assinantes. O sistema permite:

- Gerenciar e publicar tips (dicas de apostas)
- Controlar bancas (bankroll) com múltiplas carteiras
- Acompanhar resultados, ROI e desempenho
- Gerenciar assinaturas e pagamentos mensais de membros
- Controlar acesso de usuários por plano e status de pagamento
- Registrar contratos com clientes e histórico financeiro

---

## 🧱 Arquitetura Técnica

### Stack Completa

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + TypeScript + Vite |
| Estilização | TailwindCSS (tema customizado, Light Mode Premium) |
| Design System | Neumorfismo (nm-flat, nm-inset, nm-icon) |
| Ícones | Lucide React |
| Roteamento | React Router v6 |
| Estado Global | Context API (AuthContext) |
| HTTP Client | Axios |
| Gráficos | Recharts + Chart.js |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Banco de Dados | PostgreSQL (Supabase) |
| Autenticação | JWT (HttpOnly, Secure, SameSite Cookie) |
| Hospedagem | Vercel (frontend + backend serverless) |

### Estrutura de Pastas

```
Projeto Full Green Bank/
├── client/                         # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/             # Header, Sidebar, Footer, AppLayout
│   │   │   └── ui/                 # Modal, StatCard, SportSelect, TipCard, etc.
│   │   ├── contexts/               # AuthContext (estado global)
│   │   ├── pages/                  # 27 páginas da aplicação
│   │   ├── services/               # Chamadas à API (Axios)
│   │   └── utils/                  # formatters, subscription, validators
│
└── server/                         # Backend Node.js
    ├── prisma/                     # Schema e migrations do banco
    └── src/
        ├── controllers/            # Controladores REST
        ├── middlewares/            # Auth, validação, rate limit, RBAC
        ├── routes/                 # Definição das rotas
        ├── services/               # Lógica de negócio
        └── utils/                  # JWT, hash, response, validators
```

---

## 🎨 Design System — Neumorfismo

O sistema utiliza um design baseado em **neumorfismo** (soft UI) aplicado globalmente:

| Classe CSS | Efeito | Uso |
|-----------|--------|-----|
| `.nm-flat` | Elemento "extrudado" do fundo | Cards, botões secundários, badges |
| `.nm-inset` | Elemento "afundado" no fundo | Inputs, campos de busca |
| `.nm-pressed` | Estado pressionado | Botões em `:active` |
| `.nm-icon` | Caixinha de ícone com profundidade | Icon boxes em cards e sidebar |

- **Base:** `bg-slate-50` (`#f8fafc`)
- **Sombra clara:** `#ffffff`
- **Sombra escura:** `rgba(209, 213, 219, 0.8)`
- Classes `.card`, `.input-field`, `.btn-primary` e `.btn-secondary` já integram neumorfismo

---

## 👤 Usuários & Controle de Acesso

### Roles

| Role | Acesso |
|------|--------|
| **MASTER** | Total — pode editar qualquer usuário, incluindo ADMINs |
| **ADMIN** | Gestão de membros, financeiro, cadastros, logs |
| **MEMBRO** | Ferramentas de análise (condicional ao plano e `isActive`) |
| **TESTER** | Somente leitura em todo o sistema |

### Controle por Assinatura

- `isActive = true` → acesso completo
- `isActive = false` → sidebar e ferramentas bloqueadas (PENDENTE / ATRASADO)

### Permissões Granulares (RBAC)

- Cada usuário pode ter permissões específicas por página: `canView`, `canEdit`, `canDelete`
- Permissões explícitas sobrepõem o bloqueio por plano

---

## 💳 Planos & Assinaturas

| Plano | Descrição |
|-------|-----------|
| **STARTER** | Padrão de todo novo usuário |
| **STANDARD** | Plano intermediário |
| **PRO** | Acesso total a todas as ferramentas |
| **VIP PREMIUM** | Acesso super restrito a módulos fechados (Área VIP) |

| Status | Significado |
|--------|-------------|
| **ATIVO** | Em dia, acesso liberado |
| **PENDENTE** | Sem pagamento cadastrado |
| **ATRASADO** | Vencimento ultrapassado |
| **CANCELADO** | Cancelado manualmente |

### Regras Automáticas

1. Novo usuário → STARTER + PENDENTE + `isActive = false`
2. Admin confirma pagamento → `dueDate = hoje + 30d`, `isActive = true`
3. A cada login → verifica se `hoje > dueDate` → ATRASADO se sim
4. Renovação → sempre usa data atual como base

---

## 📄 Páginas da Aplicação (27 páginas)

### Área do Membro
| Página | Rota | Descrição |
|--------|------|-----------|
| Dashboard | `/dashboard` | KPIs, resumo de tips, gráficos |
| Dicas | `/tips` | Tips com filtros, status, modal de aposta reformulado |
| Bancas | `/gestao/banca` | Bankroll com múltiplas carteiras por casa |
| Tipsters | `/gestao/tipsters` | Dashboard analítico com área chart e KPIs |
| Histórico de Dicas | `/reports/tips` | Tabela unificada (Simples, Múltipla, Criar Aposta) |
| Histórico de Contratos | `/gestao/historico` | Contratos com clientes (CRUD completo) |
| Performance | `/reports` | Análise por período |
| Investimentos | `/gestao/investimentos` | Controle de investimentos externos (Área VIP) |
| Alavancagem | `/gestao/alavancagem` | Calculadora de alavancagem de banca |
| Simulador Consistência | `/gestao/simulador` | Projeção de lucros via juros compostos diários |
| Calculadora | `/gestao/calculadora` | Ferramentas de cálculo geral |
| Dicas de Gestão | `/gestao/dicas-gestao` | Guia por perfil (Conservador, Moderado, Agressivo) |
| Nossos Planos | `/planos` | Página pública de planos |
| Perfil | `/profile` | Configurações pessoais |
| FAQ | `/faq` | Central de Ajuda |
| Guia | `/guide` | Tutorial completo |
| Report Bug | `/report` | Feedback e chamados (com aba "Meus Chamados") |
| Legal | `/legal/:type` | Termos, Privacidade, Cookies |

### Área de Administração
| Página | Rota | Descrição |
|--------|------|-----------|
| Pagamentos | `/financeiro/pagamentos` | Gestão de assinaturas |
| Transações | `/financeiro/transacoes` | Histórico de movimentações financeiras |
| Usuários | `/admin/users` | Listagem e gestão de usuários |
| Cadastros | `/admin/cadastros` | Esportes, Times, Ligas, Mercados, Casas |
| Solicitações | `/admin/solicitacoes` | Aportes e solicitações de saque |
| Suporte | `/admin/support` | Gestão de chamados |
| Logs | `/admin/log` | Histórico de ações do sistema |
| Permissões | `/admin/permissoes` | Controle de acesso granular por usuário/página |

---

## 🔧 Histórico de Funcionalidades Implementadas

### Design & UX
- **Neumorfismo Global** — Sistema de sombras suaves e componentes "inset"
- **Glassmorphism** — Efeitos translúcidos aplicados no Simulador de Consistência e Landing Page
- **Design Premium** — Nova Landing Page com 5 pilares institucionais e mockups de alta qualidade
- **Light Mode Premium** — Tema claro focado em legibilidade e cores esmeralda/dourado
- **Dark Mode Moderno** — Landing Page agora utiliza um fundo ultra-dark (#06080B) para maior contraste corporativo

### Operacional & Crescimento
- **Simulador de Consistência**: Ferramenta interativa que puxa o total da banca automaticamente e projeta alcance do "Objetivo Final" através de juros compostos diários e Perfil de Risco simulado.
- **Landing Page 2.0**: Reformulação total com seções para Dashboard, Performance, Inteligência Operacional, Simulador e Curadoria de Conteúdo.
- **Plano VIP PREMIUM**: Categoria exclusiva para membros selecionados pela administração.
- **Criação de Contas por Administradores**: Workflow modal seguro para geração instantânea de usuários.

### Módulo de Dicas (TipsPage)
- **Modal Reformulado** — Campos: Data, Link de Aposta, Tipo de Aposta (Simples/Múltipla/Criar Aposta), Quantidade de Esportes (gera selects dinâmicos), Odd, Stake, Status
- **Header de Status Colorido** — Cabeçalho do modal muda de cor conforme status (Verde/Vermelho/Cinza etc.)
- **Nenhum campo obrigatório** — Todos os campos são opcionais para salvar
- **Bilhetes Múltiplos** — Modal de múltipla com cálculo automático de Odd Total
- **Criar Aposta / Bet Builder** — Modal com múltiplos mercados por evento
- **Edição Avançada** — Identifica tipo do bilhete e abre modal correto com dados pré-preenchidos
- **Link de Aposta** — Link externo exibido como badge "🔗 Ver Aposta" no card

### Módulo de Contratos (HistoryPage)
- CRUD completo de contratos de gestão de banca com clientes
- Backend com schema Prisma atualizado e sincronizado
- Interface limpa sem elementos de apostas legados

### Módulo Bancas
- Múltiplas carteiras por casa de apostas (Banca Principal, Banca de Alavancagem)
- CRUD via API (`GET`, `POST`, `PATCH`, `DELETE`)
- Histórico com `carteiraId` permitindo análise individual

### Módulo Cadastros (Admin)
- Esportes, Ligas, Times, Casas de Apostas e Mercados persistidos no PostgreSQL
- 425+ mercados padrão disponíveis via seed
- Ordenação alfabética automática em todas as tabelas
- Endpoint `/api/cadastros/seed` para carga inicial

### Segurança & Autenticação
- JWT em cookies `httpOnly`, `secure`, `sameSite: strict`
- RBAC no backend para todos os endpoints sensíveis
- **Política de Senhas Fortes**: Validação Regex no frontend/backend (Min 6 chars, Maiúscula, Minúscula, Número, Caractere Especial)
- Normalização de e-mail automática no login/cadastro
- Remoção do campo `username` — apenas e-mail + senha
- `console.log` removidos no build de produção (esbuild)
- Code splitting com `manualChunks` (vendor, charts, utils)
- Sessões de 7 dias
- Prevenção de loop infinito de redirect em rotas públicas

### Financeiro
- Tabela exclusiva de membros com badges de status e plano
- Modal unificado de pagamento (sem abas)
- Datas exibidas como DD/MM/YYYY
- Histórico de notas em texto livre por usuário

### Logs & Auditoria
- Toda ação relevante é registrada no backend
- Página `/admin/log` para visualização
- Logs de login/cadastro criados de forma confiável no servidor

### Suporte & Feedback
- Sistema de tickets com resposta do admin
- Usuário vê status e resposta na aba "Meus Chamados"
- Filtro padrão: tickets pendentes

### Impersonation
- Admin pode assumir a conta de um membro para suporte
- Banner "Voltar à minha conta" sempre visível

---

## 📡 API — Principais Endpoints

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/auth/login` | Público | Login |
| POST | `/api/auth/register` | Público | Cadastro |
| GET | `/api/auth/me` | Autenticado | Perfil atual |
| GET | `/api/tips` | Autenticado | Listar dicas |
| POST | `/api/tips` | ADMIN/MASTER | Criar dica |
| PATCH | `/api/tips/:id` | ADMIN/MASTER | Atualizar dica |
| DELETE | `/api/tips/:id` | ADMIN/MASTER | Excluir dica |
| GET | `/api/gestao-banca/carteiras` | Autenticado | Listar carteiras |
| DELETE | `/api/gestao-banca/carteiras/:id` | Autenticado | Excluir carteira |
| GET | `/api/cadastros/sports` | Autenticado | Listar esportes |
| POST | `/api/cadastros/seed` | ADMIN/MASTER | Popular dados padrão |
| GET | `/api/logs` | ADMIN/MASTER | Histórico de ações |
| GET | `/api/users` | ADMIN/MASTER | Listar usuários |
| PATCH | `/api/users/:id` | ADMIN/MASTER | Atualizar usuário |
| GET | `/api/contracts` | ADMIN/MASTER | Contratos de clientes |

---

## 🗂️ Variáveis de Ambiente

### Backend (`.env`)
```
DATABASE_URL=        # URL de conexão Supabase (pooling - porta 6543)
DIRECT_URL=          # URL direta Supabase (migrations - porta 5432)
JWT_SECRET=          # Chave secreta para JWT
PORT=3001
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001  # Local
# Produção: https://full-green-bank-backend.vercel.app
```

---

## 📌 Últimos Commits

| `HEAD` | feat: nova Landing Page premium com 5 pilares e integração de link direto para suporte via WhatsApp |
| `bdc4aa0` | fix(planos): rota do botão voltar apontando para a Landing Page |
| `109cfee` | feat: aprimoramento visual da Landing Page e correção de filtros de visibilidade |
| `7b672ae` | feat: correção de fuso horário em datas e bypass de reset de pagamentos |
| `25397c2` | feat(ui): aplica design neumorfismo global |
| _anterior_ | feat(tips): reformula modais de nova e edição de dica |
