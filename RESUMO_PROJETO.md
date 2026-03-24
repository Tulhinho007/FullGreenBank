# 📘 Full Green Bank — Resumo Completo do Projeto

> Documento gerado em: 21/03/2026 (Atualizado)
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
| Autenticação | JWT (HttpOnly, Secure, SameSite Cookie) |
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
| Histórico de Dicas | `/reports/tips` | Tabela unificada (Simples, Múltipla, Criar Aposta) |
| Histórico de Contratos | `/gestao/historico` | Contratos de banca com clientes |
| Performance | `/reports` | Análise de performance por período |
| Nossos Planos | `/planos` | Página pública de planos disponíveis |
| FAQ | `/faq` | Central de Ajuda com acordeão |
| Guia da Plataforma | `/guide` | Tutorial completo de uso |
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
| Suporte & Feedback | `/admin/support` | Gestão de chamados e sugestões |
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

### 10. Padronização de Páginas Institucionais
- FAQ, Guia e Reportar Bug movidos para dentro do `AppLayout` (rotas protegidas).
- Visual consistente com tema dark e sidebar sempre visível.
- Rodapé de ação padronizado (`surface-200`) com botão "← Voltar para o Sistema".

### 11. Sistema de Resposta em Tickets
- Backend: Novos campos `adminResponse` e `respondedAt` no modelo `SupportTicket`.
- Admin: Interface para redactar e enviar respostas diretamente pelo painel de tickets.
- Admin: Filtro padrão alterado para "Pendentes", ocultando automaticamente tickets resolvidos/fechados.
- Usuário: Nova aba "Meus Chamados" em `/report` para acompanhar status e ler respostas da equipe.

### 12. Gestão de Mercados por Esporte
- Admin: Novo card em "Cadastros" para gerenciamento de mercados de apostas.
- Interface: Modal para Adicionar, Editar e Excluir mercados vinculados a esportes (slug-based).
- Dados: Injeção de cerca de 300 mercados padrão (Futebol, Basquete, Vôlei) para agilizar o uso.
- UX: Implementação de ordenação alfabética automática em todas as tabelas de cadastro (Esportes, Ligas, Mercados, Times, Casas de Apostas).
- Persistência: Armazenamento em `localStorage` para consistência com o restante da página de cadastros.

### 13. Bilhetes Múltiplos e Criar Aposta (Redesign)
- **ModalCriarMultipla**: Cadastro iterativo de múltiplos jogos com cálculo de Odd Total automática.
- **ModalCriarAposta**: Suporte a múltiplos mercados no mesmo evento (Criar Aposta/Bet Builder).
- **Pixel Perfect**: Layout totalmente fiel aos protótipos em 2 colunas e cartões agrupados.

### 14. Edição Avançada de Bilhetes
- Lógica inteligente que identifica o tipo de bilhete e abre o modal correto com dados pré-preenchidos.
- Suporte a edição completa de jogos em múltiplas e mercados em criar aposta.

### 15. Histórico Geral de Dicas (DataTable)
- Centralização de todas as entradas em uma única tabela de alta performance.
- Filtros dinâmicos por: Tipo (S, M, C), Status (Green, Red, Pendente) e Nome do Evento.
- Ações de edição e exclusão integradas diretamente na linha da tabela.

### 16. Correções de Deploy & TypeScript
- Resolvidos erros de TypeScript em `AdminUsersPage.tsx` e `ReportsPage.tsx`.
- Adicionado script `build` na raiz do monorepo para delegar o build ao client.
- Instalada dependência ausente `date-fns` no frontend.

### 17. Tipster Dashboard (Gestão)
- **Painel Analítico**: Nova página `/gestao/tipsters` focada na visão geral do tipster com suporte dark-mode.
- **Gráficos e KPIs**: Implementação de gráficos de área (`Recharts`) para evolução da banca, com cards dinâmicos de Green/Red/Void e métricas de ROI e Lucro Total.
- **Tabela de Dados Dinâmica**: Tabela de histórico de entradas atreladas ao tipster com ações de edição e status coloridos via badges.

### 18. Multi-Bankroll (Múltiplas Carteiras)
- **Arquitetura de Dados Retrocompatível**: Atualização do schema (`GestaoBancaItem`) para incluir `carteiraId` de forma segura.
- **Interface Múltipla**: Componentização do frontend para possibilitar criação, seleção e segregação de caixa de múltiplas carteiras (bancas) operando sob a mesma conta/casa de apostas.

### 19. Sistema de Exportação Real (Saques & Relatórios)
- **Excel & PDF Tabular**: Implementação robusta das bibliotecas `xlsx` e `jspdf` via script para a exportação fidedigna das tabelas baseadas inteiramente nas queries/filtros ativos da tela.
- **Impressão Expandida (Print Mode)**: Injeção de regras CSS Tailwind exclusivas (`print:hidden` e `print:border-none`) na Sidebar e em componentes de tela, permitindo que a funcionalidade "Imprimir Tabela" ocupe 100% da área do PDF emitido pelo sistema operacional.

### 21. Persistência de Cadastros no PostgreSQL (Infra)
- **Migração de Dados**: Esportes, Ligas, Casas, Mercados e Times Personalizados movidos do `localStorage` para tabelas reais no banco de dados.
- **Sincronização**: Novo botão "Sincronizar Defaults" para carga inicial de dados via endpoint `/api/cadastros/seed`.
- **425+ Mercados**: Injeção direta via script standalone garantindo que todos os mercados (Ambas Marcam, Handicaps, Cantos, etc.) estejam disponíveis.
- **Times Compartilhados**: Times cadastrados por administradores agora são visíveis para todos os usuários do sistema.

### 22. Gestão de Bancas Múltiplas (Carteiras)
- **Segregação por Casa**: Suporte a múltiplas bancas dentro da mesma casa de apostas (ex: Banca Principal e Banca de Alavancagem em Bet365).
- **CRUD Completo**: Implementação das rotas `GET`, `POST`, `PATCH` e `DELETE` no backend (Vercel) para controle 100% via API.
- **Histórico Persistente**: Ações de depósito, saque e resultado vinculadas à `carteiraId`, permitindo análise individual de performance.

### 23. Segurança & Refatoração de Autenticação (Sessão Atual)
- **Migração para Cookies Seguros**: Substituição do `localStorage` por `httpOnly`, `secure` e `sameSite: 'strict'` cookies para armazenamento do JWT, eliminando riscos de XSS.
- **Segurança no Backend (RBAC)**: Implementação de middleware de autorização em todos os endpoints sensíveis (Saques, Gestão, Logs). Agora a segurança é garantida no servidor, independente do estado do frontend.
- **Remoção Global do Campo "Usuário" (username)**:
    - O sistema foi simplificado para utilizar apenas **E-mail** e Senha.
    - O campo `username` foi removido do banco de dados (Prisma), serviços, controllers e de todas as telas (Login, Cadastro, Perfil, Admin).
- **Prevenção de Information Disclosure**: Configuração do build de produção (Vite/esbuild) para remover automaticamente todos os `console.log` e `debugger`, protegendo a estrutura da API contra inspeção via DevTools.
- **Otimização de Build (Code Splitting)**: Implementação de `manualChunks` no `vite.config.ts` para separar bibliotecas pesadas (`vendor`, `charts`, `utils`) em arquivos distintos, melhorando o cache do navegador e a performance de carregamento.
- **Correção de Rotas de Auth**: Resolvido erro 404 nos endpoints `/auth/me` e `/auth/refresh` após a refatoração de cookies.

---

## 📡 API — Principais Endpoints

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/auth/login` | Público | Login |
| POST | `/api/auth/register` | Público | Cadastro |
| GET | `/api/auth/me` | Autenticado | Perfil atual |
| GET | `/api/gestao-banca/carteiras` | Autenticado | Listar todas as carteiras do usuário |
| GET | `/api/gestao-banca/carteiras/:id` | Autenticado | Detalhes de uma carteira específica |
| DELETE | `/api/gestao-banca/carteiras/:id` | Autenticado | Excluir carteira e todo seu histórico (cascade) |
| GET | `/api/cadastros/sports` | Autenticado | Listar esportes do DB |
| POST | `/api/cadastros/seed` | ADMIN/MASTER | Popular dados padrão do sistema |

---

## 🗂️ Variáveis de Ambiente Necessárias

### Backend (`.env`)
```
DATABASE_URL=        # URL de conexão Supabase (pooling - porta 6543)
DIRECT_URL=          # URL direta Supabase (migrations - porta 5432)
JWT_SECRET=          # Chave secreta para JWT
PORT=3001           # Porta local (padrão 3001)
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001 # Local
# Na produção: https://full-green-bank-backend.vercel.app
```

---

## 📌 Últimos Commits (Resumo)

| `9b454dd` | refactor: remove username field system-wide and migrate to email-only auth |
| `e8e194e` | chore: remove console logs in production via Vite esbuild |
| `1202efa` | fix: adicionar rotas GET e DELETE para carteiras em gestao-banca |
| `ac9bf87` | debug: logs de seed no frontend e backend |
| `efc5cea` | feat: otimizar inserção de mercados com createMany no backend |
| `6a19f07` | feat: adicionar restrição única name_sportSlug no Prisma |
| `bc56f0f` | feat: persistência de dados de cadastros no PostgreSQL |


