-- Painel RO — adiciona data de início da obra por lote
-- Antes, o Gantt usava a data_inicio do loteamento para todos os lotes.
-- Agora cada lote pode ter sua própria data de início individual.

alter table public.lotes
  add column if not exists data_inicio_obra date;

comment on column public.lotes.data_inicio_obra is
  'Data em que a obra deste lote começou. Cai pra data_inicio do loteamento se nulo.';
