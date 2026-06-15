-- Painel RO — Configuração das fases padrão de obra
-- Permite editar pelo app (Parâmetros) os nomes/durações das fases que são
-- aplicadas aos lotes (seedFasesPadrao e duplicação). Antes ficavam no código.

create table if not exists public.fases_padrao_config (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordem int not null default 0,
  duracao_dias int not null default 15,
  created_at timestamptz not null default now()
);

create index if not exists idx_fases_padrao_ordem
  on public.fases_padrao_config(ordem);

alter table public.fases_padrao_config enable row level security;
drop policy if exists "authenticated_all_fases_padrao_config" on public.fases_padrao_config;
create policy "authenticated_all_fases_padrao_config" on public.fases_padrao_config
  for all to authenticated using (true) with check (true);

-- Seed com as 8 fases padrão atuais (só se a tabela estiver vazia).
insert into public.fases_padrao_config (nome, ordem, duracao_dias)
select * from (values
  ('Planejamento', 1, 7),
  ('Serviços preliminares', 2, 10),
  ('Fundação', 3, 15),
  ('Alvenaria', 4, 30),
  ('Cobertura', 5, 15),
  ('Acabamento', 6, 30),
  ('Concluído', 7, 5),
  ('Documentação Final', 8, 15)
) as v(nome, ordem, duracao_dias)
where not exists (select 1 from public.fases_padrao_config);
