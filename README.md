# Painel RO — Construções e Incorporações

Sistema de gestão interno da **RO Construções e Incorporações** para controle de loteamentos, obras, vendas e financeiro.

Stack: **Next.js 16 (App Router) + Supabase (Postgres + Auth + Storage) + TailwindCSS v4 + shadcn/ui + Recharts**.

---

## Módulos

- **Dashboard** com KPIs, gráficos (pizza de status, área de vendas, barras de gastos) e listas de últimas vendas / obras atrasadas
- **Loteamentos → Quadras → Lotes** (hierarquia drill-down com 3 níveis)
- **Lote** com 7 abas: Visão Geral, Venda, Obra & Custos, Materiais, Mão de Obra, Documentos, Detalhes Técnicos
- **Fornecedores** com tabela de preços
- **Funcionários** com histórico de alocações
- **Corretores** com comissão padrão
- **Gráfico de Gantt** geral de obras (zoom, marca do dia atual, agrupado por loteamento, drill-down)

---

## Setup local

### 1. Pré-requisitos

- Node.js 20 ou 24
- Conta em [supabase.com](https://supabase.com) (plano gratuito atende ao MVP)

### 2. Configurar Supabase

1. Crie um projeto novo no Supabase
2. No **SQL Editor**, execute em ordem:
   - `supabase/migrations/0001_init.sql` — tabelas
   - `supabase/migrations/0002_rls.sql` — RLS
   - `supabase/migrations/0003_storage.sql` — buckets de storage
   - `supabase/seed.sql` — *(opcional)* dados de exemplo
3. Copie URL e `anon key` (Settings → API) para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Você será redirecionado para `/login`.

### 4. Criar primeiro usuário

No próprio app, clique em **"Primeiro acesso? Criar conta"** ou cadastre direto no painel do Supabase (Authentication → Users → Add user).

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (com Turbopack) |
| `npm run build` | Build de produção |
| `npm start` | Serve o build de produção |
| `npm run lint` | Lint (ESLint) |
| `npx tsc --noEmit` | Type-check |

---

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/        # Tela de login
│   └── (app)/               # Rotas autenticadas (com sidebar)
│       ├── page.tsx         # Dashboard
│       ├── loteamentos/     # CRUD loteamento → quadra → lote
│       ├── lotes/[id]/      # Detalhe do lote (7 abas)
│       ├── fornecedores/    # CRUD + tabela de preços
│       ├── funcionarios/    # CRUD + histórico
│       ├── corretores/      # CRUD
│       └── gantt/           # Cronograma visual
├── components/              # UI compartilhada (cards, forms, charts, gantt)
│   ├── ui/                  # Botão, Card, Input, Table, Dialog, Tabs, etc.
│   ├── forms/               # Forms de cada entidade
│   └── charts/              # Gráficos com Recharts
└── lib/
    ├── supabase/            # Clients (browser, server, middleware)
    ├── actions/             # Server actions (mutations)
    ├── queries.ts           # Server-side queries
    ├── gantt.ts             # Lógica do cronograma
    ├── constants.ts         # Enums e labels
    └── utils.ts             # cn(), formatBRL(), formatDateBR()
```

---

## Identidade visual

- **Primary (azul-petróleo):** `#1e3a5f` — confiança, seriedade
- **Accent (laranja construção):** `#f97316` — ação, atenção
- **Status:** 🟢 Disponível · 🟡 Reservado · 🔵 Vendido · 🔴 Atrasado

---

## Deploy na Vercel

1. Faça push do repo para GitHub/GitLab
2. Importe na [Vercel](https://vercel.com/new)
3. Adicione as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

---

## Roadmap futuro (próximas sprints)

- [ ] Filtros globais no dashboard (por loteamento, por período)
- [ ] Relatórios consolidados exportáveis (PDF/Excel)
- [ ] Audit log (quem fez o que e quando)
- [ ] Backup/export de dados
- [ ] Multi-usuário com particionamento por `owner_id`
- [ ] PWA / offline-first
