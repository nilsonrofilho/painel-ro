-- Painel RO — data de nascimento em investidores, funcionários e vendas (cliente)

alter table public.investidores
  add column if not exists data_nascimento date;

alter table public.funcionarios
  add column if not exists data_nascimento date;

alter table public.vendas
  add column if not exists cliente_nascimento date;

comment on column public.vendas.cliente_nascimento is
  'Data de nascimento do cliente/comprador.';
