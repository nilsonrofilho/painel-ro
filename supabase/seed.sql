-- Painel RO — dados de exemplo (opcional)
-- Rode após as migrations para popular com dados iniciais e ver o dashboard
-- com gráficos e cards preenchidos.

-- ============================================================
-- FUNCIONÁRIOS
-- ============================================================
insert into public.funcionarios (nome, funcao, tipo_contratacao, salario, telefone, status)
values
  ('João da Silva', 'Mestre de obra', 'clt', 4500, '(62) 99999-0001', 'ativo'),
  ('Pedro Souza', 'Pedreiro', 'diarista', null, '(62) 99999-0002', 'ativo'),
  ('Carlos Lima', 'Eletricista', 'empreitada', null, '(62) 99999-0003', 'ativo'),
  ('Marcos Oliveira', 'Encanador', 'diarista', null, '(62) 99999-0004', 'ativo')
on conflict do nothing;

-- ============================================================
-- CORRETORES
-- ============================================================
insert into public.corretores (nome, creci, telefone, comissao_padrao_pct)
values
  ('Maria Imobiliária', '12345-F', '(62) 98888-0001', 5),
  ('Roberto Vendas', '67890-F', '(62) 98888-0002', 4)
on conflict do nothing;

-- ============================================================
-- FORNECEDORES
-- ============================================================
insert into public.fornecedores (razao_social, nome_fantasia, categoria, telefone)
values
  ('Materiais ABC Ltda', 'Casa do Construtor', 'material', '(62) 4002-8922'),
  ('Cimentos União S/A', 'União', 'material', '(62) 3030-3030'),
  ('Serviços de Acabamento ME', 'Acabamentos Premium', 'servico', '(62) 95555-0001')
on conflict do nothing;

-- ============================================================
-- LOTEAMENTOS, QUADRAS, LOTES (com nomes determinísticos p/ idempotência)
-- ============================================================
do $$
declare
  v_lot_id_1 uuid;
  v_lot_id_2 uuid;
  v_q_a uuid;
  v_q_b uuid;
  v_q_c uuid;
  v_q_d uuid;
  v_lote uuid;
  v_corretor uuid;
  i int;
begin
  -- ---- Loteamento 1: Vista Verde ----
  select id into v_lot_id_1 from public.loteamentos where nome = 'Residencial Vista Verde';
  if v_lot_id_1 is null then
    insert into public.loteamentos
      (nome, cidade, estado, status, data_inicio, previsao_entrega, descricao)
    values
      ('Residencial Vista Verde', 'Goiânia', 'GO', 'em_obra',
        current_date - interval '6 months', current_date + interval '12 months',
        'Loteamento fechado com 24 lotes e área de lazer.')
    returning id into v_lot_id_1;
  end if;

  -- Quadras A, B
  select id into v_q_a from public.quadras
   where loteamento_id = v_lot_id_1 and identificador = 'A';
  if v_q_a is null then
    insert into public.quadras (loteamento_id, identificador, descricao)
    values (v_lot_id_1, 'A', 'Quadra frontal')
    returning id into v_q_a;
  end if;

  select id into v_q_b from public.quadras
   where loteamento_id = v_lot_id_1 and identificador = 'B';
  if v_q_b is null then
    insert into public.quadras (loteamento_id, identificador, descricao)
    values (v_lot_id_1, 'B', 'Quadra do meio')
    returning id into v_q_b;
  end if;

  -- Lotes da quadra A: 6 lotes
  for i in 1..6 loop
    if not exists (select 1 from public.lotes
                    where quadra_id = v_q_a and numero = lpad(i::text, 2, '0')) then
      insert into public.lotes
        (quadra_id, numero, status, etapa, area_lote, area_construida,
         quartos, suites, banheiros, vagas,
         valor_venda, orcamento_total, previsao_entrega)
      values
        (v_q_a, lpad(i::text, 2, '0'),
         case when i <= 2 then 'vendido'
              when i = 3 then 'reservado'
              else 'disponivel' end,
         case when i <= 2 then 'concluido'
              when i = 3 then 'cobertura'
              when i = 4 then 'alvenaria'
              else 'fundacao' end,
         250, 110, 3, 1, 2, 2,
         320000 + (i * 5000),
         180000,
         current_date + interval '6 months');
    end if;
  end loop;

  -- Lotes da quadra B: 6 lotes
  for i in 1..6 loop
    if not exists (select 1 from public.lotes
                    where quadra_id = v_q_b and numero = lpad(i::text, 2, '0')) then
      insert into public.lotes
        (quadra_id, numero, status, etapa, area_lote, area_construida,
         quartos, suites, banheiros, vagas,
         valor_venda, orcamento_total, previsao_entrega)
      values
        (v_q_b, lpad(i::text, 2, '0'),
         case when i = 1 then 'vendido'
              when i in (2,3) then 'reservado'
              else 'disponivel' end,
         case when i = 1 then 'concluido'
              when i <= 3 then 'acabamento'
              when i = 4 then 'cobertura'
              else 'planejamento' end,
         260, 120, 3, 1, 2, 2,
         340000 + (i * 5000),
         190000,
         current_date + interval '9 months');
    end if;
  end loop;

  -- ---- Loteamento 2: Solar do Lago ----
  select id into v_lot_id_2 from public.loteamentos where nome = 'Condomínio Solar do Lago';
  if v_lot_id_2 is null then
    insert into public.loteamentos
      (nome, cidade, estado, status, data_inicio, previsao_entrega, descricao)
    values
      ('Condomínio Solar do Lago', 'Aparecida de Goiânia', 'GO', 'planejamento',
        current_date - interval '1 month', current_date + interval '24 months',
        'Loteamento com vista para o lago.')
    returning id into v_lot_id_2;
  end if;

  select id into v_q_c from public.quadras
   where loteamento_id = v_lot_id_2 and identificador = 'C';
  if v_q_c is null then
    insert into public.quadras (loteamento_id, identificador, descricao)
    values (v_lot_id_2, 'C', 'Quadra à beira do lago')
    returning id into v_q_c;
  end if;

  select id into v_q_d from public.quadras
   where loteamento_id = v_lot_id_2 and identificador = 'D';
  if v_q_d is null then
    insert into public.quadras (loteamento_id, identificador, descricao)
    values (v_lot_id_2, 'D', 'Quadra dos fundos')
    returning id into v_q_d;
  end if;

  for i in 1..4 loop
    if not exists (select 1 from public.lotes
                    where quadra_id = v_q_c and numero = lpad(i::text, 2, '0')) then
      insert into public.lotes
        (quadra_id, numero, status, etapa, area_lote, area_construida,
         quartos, suites, banheiros, vagas,
         valor_venda, orcamento_total, previsao_entrega)
      values
        (v_q_c, lpad(i::text, 2, '0'),
         'disponivel', 'planejamento',
         300, 140, 4, 2, 3, 2,
         480000, 250000,
         current_date + interval '18 months');
    end if;
  end loop;

  -- ============================================================
  -- VENDA de exemplo + lançamentos de material (para dashboard ter dados)
  -- ============================================================
  select id into v_corretor from public.corretores order by nome limit 1;

  -- Pega o primeiro lote vendido da quadra A
  select id into v_lote from public.lotes
   where quadra_id = v_q_a and status = 'vendido'
   order by numero limit 1;

  if v_lote is not null
     and not exists (select 1 from public.vendas where lote_id = v_lote) then
    insert into public.vendas
      (lote_id, tipo, cliente_nome, cliente_telefone, corretor_id,
       comissao_pct, comissao_valor, valor, forma_pagamento, data, status)
    values
      (v_lote, 'venda', 'Ana Cliente Exemplo', '(62) 97777-0001',
       v_corretor, 5, 16250, 325000, 'Financiamento bancário',
       current_date - interval '15 days', 'ativa');

    -- Alguns lançamentos de material p/ esse lote
    insert into public.lancamentos_material
      (lote_id, tipo, data, material, quantidade, unidade,
       valor_unitario, valor_total)
    values
      (v_lote, 'saida', current_date - interval '60 days',
       'Cimento CPII 50kg', 100, 'saco', 38, 3800),
      (v_lote, 'saida', current_date - interval '45 days',
       'Areia média', 10, 'm³', 95, 950),
      (v_lote, 'saida', current_date - interval '30 days',
       'Tijolo 6 furos', 5000, 'un', 0.85, 4250),
      (v_lote, 'saida', current_date - interval '15 days',
       'Telha cerâmica', 800, 'un', 2.5, 2000);
  end if;
end$$;
