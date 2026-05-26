# Supabase — Painel RO

## Setup inicial

1. Crie um projeto novo em https://supabase.com
2. Em **SQL Editor**, rode os arquivos em ordem:
   - `migrations/0001_init.sql` — cria todas as tabelas
   - `migrations/0002_rls.sql` — habilita RLS (auth-only)
   - `migrations/0003_storage.sql` — cria buckets de storage
   - `seed.sql` *(opcional)* — popula dados de exemplo
3. Copie a URL e a `anon key` (Settings → API) para o `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Criar usuário admin

Em **Authentication → Users → Add user**, crie seu primeiro usuário.
Como o sistema é single-user no MVP, basta um login.

Pelo próprio app você pode usar "Primeiro acesso? Criar conta" na tela de login.

## Buckets de Storage

- `loteamentos` — imagens de capa de loteamentos
- `lotes` — fotos e plantas dos lotes
- `funcionarios` — fotos dos funcionários
- `notas-fiscais` — NF de materiais
- `documentos` — alvarás, contratos, projetos

Todos os buckets são públicos no MVP para simplificar `<Image src>`. Em produção,
considere mover NF e documentos para buckets privados e usar URLs assinadas.

## Atualizando o schema

Para mudanças futuras, crie novos arquivos numerados em `migrations/` (ex: `0004_xxx.sql`)
e rode-os manualmente no SQL Editor. Não modifique migrations já aplicadas.
