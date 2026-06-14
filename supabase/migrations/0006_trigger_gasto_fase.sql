-- Painel RO — recálculo automático do gasto da fase
-- Elimina a race condition do read-modify-write nas actions de material:
-- o campo fases_obra.gasto passa a ser mantido por trigger, sempre igual à
-- soma dos lançamentos de SAÍDA vinculados àquela fase.

create or replace function public.recalcular_gasto_fase(p_fase_id uuid)
returns void
language plpgsql
as $$
begin
  if p_fase_id is null then
    return;
  end if;
  update public.fases_obra f
     set gasto = coalesce((
       select sum(lm.valor_total)
         from public.lancamentos_material lm
        where lm.fase_id = p_fase_id
          and lm.tipo = 'saida'
     ), 0)
   where f.id = p_fase_id;
end;
$$;

create or replace function public.trg_lancamento_material_gasto()
returns trigger
language plpgsql
as $$
begin
  -- Recalcula a fase nova (insert/update) e a antiga (update/delete), se diferentes
  if (tg_op = 'INSERT') then
    perform public.recalcular_gasto_fase(new.fase_id);
  elsif (tg_op = 'DELETE') then
    perform public.recalcular_gasto_fase(old.fase_id);
  elsif (tg_op = 'UPDATE') then
    perform public.recalcular_gasto_fase(new.fase_id);
    if old.fase_id is distinct from new.fase_id then
      perform public.recalcular_gasto_fase(old.fase_id);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists lancamento_material_gasto on public.lancamentos_material;
create trigger lancamento_material_gasto
  after insert or update or delete on public.lancamentos_material
  for each row execute function public.trg_lancamento_material_gasto();

-- Backfill: corrige qualquer valor de gasto que esteja dessincronizado hoje
update public.fases_obra f
   set gasto = coalesce((
     select sum(lm.valor_total)
       from public.lancamentos_material lm
      where lm.fase_id = f.id
        and lm.tipo = 'saida'
   ), 0);
