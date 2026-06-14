-- Painel RO — cronograma das fases de obra
-- Adiciona atividade predecessora e duração em dias às fases, para um
-- cronograma estilo Gantt com dependências dentro do lote.

alter table public.fases_obra
  add column if not exists predecessora_id uuid
    references public.fases_obra(id) on delete set null;

alter table public.fases_obra
  add column if not exists duracao_dias int;

comment on column public.fases_obra.predecessora_id is
  'Fase que precisa terminar antes desta começar (dependência do cronograma).';
comment on column public.fases_obra.duracao_dias is
  'Duração planejada da atividade em dias (se nulo, calcula de data_inicio→data_fim).';
