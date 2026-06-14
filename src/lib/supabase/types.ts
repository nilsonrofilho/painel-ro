export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================
// Row shapes
// ============================================================
export interface LoteamentoRow {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  imagem_url: string | null;
  data_inicio: string | null;
  previsao_entrega: string | null;
  responsavel_id: string | null;
  status: "planejamento" | "em_obra" | "concluido" | "pausado" | null;
  descricao: string | null;
  created_at: string;
}

export interface QuadraRow {
  id: string;
  loteamento_id: string;
  identificador: string;
  descricao: string | null;
  imagem_url: string | null;
  created_at: string;
}

export interface LoteRow {
  id: string;
  quadra_id: string;
  numero: string;
  status: "disponivel" | "reservado" | "vendido";
  etapa:
    | "planejamento"
    | "fundacao"
    | "alvenaria"
    | "cobertura"
    | "acabamento"
    | "concluido"
    | null;
  area_lote: number | null;
  area_construida: number | null;
  quartos: number | null;
  suites: number | null;
  banheiros: number | null;
  vagas: number | null;
  tipo_planta: string | null;
  planta_url: string | null;
  foto_url: string | null;
  data_inicio_obra: string | null;
  previsao_entrega: string | null;
  data_entrega_real: string | null;
  responsavel_id: string | null;
  valor_venda: number | null;
  orcamento_total: number | null;
  observacoes: string | null;
  created_at: string;
}

export interface MaterialRow {
  id: string;
  nome: string;
  unidade: string | null;
  categoria: string | null;
  preco_referencia: number | null;
  observacao: string | null;
  ativo: boolean;
  created_at: string;
}

export interface VendaRow {
  id: string;
  lote_id: string;
  tipo: "reserva" | "venda";
  cliente_nome: string | null;
  cliente_cpf: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  corretor_id: string | null;
  comissao_pct: number | null;
  comissao_valor: number | null;
  valor: number | null;
  valor_sinal: number | null;
  forma_pagamento: string | null;
  data: string | null;
  status: "ativa" | "cancelada" | "convertida";
  observacao: string | null;
  created_at: string;
}

export interface FaseObraRow {
  id: string;
  lote_id: string;
  nome: string;
  orcamento: number | null;
  gasto: number;
  data_inicio: string | null;
  data_fim: string | null;
  status: "pendente" | "em_andamento" | "concluida";
  ordem: number;
  predecessora_id: string | null;
  duracao_dias: number | null;
}

export interface FornecedorRow {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  categoria: "material" | "servico" | "ambos";
  observacao: string | null;
  created_at: string;
}

export interface FornecedorPrecoRow {
  id: string;
  fornecedor_id: string;
  material: string;
  unidade: string | null;
  preco: number;
  atualizado_em: string;
}

export interface LancamentoMaterialRow {
  id: string;
  lote_id: string;
  fase_id: string | null;
  tipo: "entrada" | "saida";
  data: string;
  material: string;
  material_id: string | null;
  quantidade: number;
  unidade: string | null;
  valor_unitario: number | null;
  valor_total: number;
  fornecedor_id: string | null;
  nota_fiscal_numero: string | null;
  nota_fiscal_url: string | null;
  observacao: string | null;
  created_at: string;
}

export interface FuncionarioRow {
  id: string;
  nome: string;
  cpf: string | null;
  rg: string | null;
  funcao: string | null;
  tipo_contratacao: "clt" | "diarista" | "empreitada" | null;
  salario: number | null;
  diaria: number | null;
  telefone: string | null;
  endereco: string | null;
  data_admissao: string | null;
  foto_url: string | null;
  status: "ativo" | "inativo";
  created_at: string;
}

export interface AlocacaoRow {
  id: string;
  funcionario_id: string;
  lote_id: string;
  funcao_no_lote: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  valor_pago: number | null;
  observacao: string | null;
  created_at: string;
}

export interface CorretorRow {
  id: string;
  nome: string;
  creci: string | null;
  telefone: string | null;
  email: string | null;
  comissao_padrao_pct: number | null;
  created_at: string;
}

export interface DocumentoRow {
  id: string;
  entidade_tipo: "lote" | "loteamento" | "funcionario" | "venda";
  entidade_id: string;
  nome: string;
  etapa: string | null;
  arquivo_url: string;
  uploaded_at: string;
}

export interface MunicipioParametrosRow {
  id: string;
  municipio: string;
  estado: string;
  codigo_ibge: string | null;
  itbi_aliquota_pct: number;
  itbi_base: "valor_transacao" | "valor_venal" | "maior_entre";
  cub_estado: string | null;
  areas_publicas_min_pct: number | null;
  vigencia_mes: string | null;
  observacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CubIndiceRow {
  id: string;
  estado: string;
  padrao: "baixo" | "normal" | "alto";
  tipo_projeto: "R1" | "R8" | "R16" | "PP4" | "CAL8" | "loteamento" | "outro";
  valor_m2: number;
  mes_referencia: string;
  fonte: string | null;
  created_at: string;
}

export interface ZonaUrbanisticaRow {
  id: string;
  municipio_id: string | null;
  municipio: string;
  estado: string;
  zona: string;
  descricao: string | null;
  densidade: string | null;
  to_pct: number;
  ca_basico: number;
  ca_maximo: number | null;
  ca_minimo: number | null;
  recuo_frontal_m: number | null;
  recuo_lateral_m: number | null;
  recuo_fundos_m: number | null;
  gabarito_max_m: number | null;
  gabarito_max_pavimentos: number | null;
  taxa_permeabilidade_pct: number | null;
  permite_outorga: boolean;
  fator_outorga_fp: number | null;
  fator_outorga_fs: number | null;
  valor_m2_terreno_pgv: number | null;
  created_at: string;
}

export interface EstudoViabilidadeRow {
  id: string;
  loteamento_id: string | null;
  nome: string;
  municipio: string | null;
  estado: string | null;
  municipio_id: string | null;
  zona_id: string | null;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  tipo_empreendimento: "loteamento" | "casas" | "vertical" | "misto";
  area_terreno_m2: number | null;
  custo_terreno: number | null;
  valor_venal_referencia: number | null;
  itbi_aliquota_pct: number | null;
  outorga_valor: number | null;
  custos_cartorio: number | null;
  ca_pretendido: number | null;
  fator_eficiencia: number | null;
  pe_direito_m: number | null;
  custo_infraestrutura: number | null;
  padrao_construcao: "baixo" | "normal" | "alto" | null;
  tipo_projeto_cub: string | null;
  cub_valor_m2: number | null;
  bdi_pct: number | null;
  comissao_venda_pct: number | null;
  regime_tributario: "RET" | "RET_social" | "presumido" | "real" | null;
  imposto_venda_pct: number | null;
  custos_indiretos_pct: number | null;
  distratos_pct: number | null;
  custo_financeiro: number | null;
  tma_pct: number | null;
  status: "rascunho" | "aprovado" | "reprovado";
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface ViabilidadeProgramaRow {
  id: string;
  estudo_id: string;
  tipo_unidade: string;
  descricao: string | null;
  quantidade: number;
  area_privativa_m2: number | null;
  area_construida_m2: number | null;
  preco_m2_venda: number | null;
  valor_venda_unitario: number | null;
  ordem: number;
  created_at: string;
}

export interface ViabilidadeCustosItbiRow {
  id: string;
  estudo_id: string;
  municipio_id: string | null;
  cidade: string;
  estado: string | null;
  aliquota_pct: number;
  base_calculo: number;
  valor_estimado: number;
  selecionado: boolean;
  atualizado_em: string;
}

export interface ViabilidadeFluxoRow {
  id: string;
  estudo_id: string;
  periodo: number;
  rotulo: string | null;
  entradas: number;
  saidas: number;
  created_at: string;
}

export interface InvestidorRow {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  observacao: string | null;
  token_publico: string;
  ativo: boolean;
  created_at: string;
}

export interface AporteRow {
  id: string;
  investidor_id: string;
  lote_id: string;
  valor_investido: number;
  retorno_pct: number | null;
  retorno_valor: number | null;
  data_aporte: string | null;
  observacao: string | null;
  created_at: string;
}

export interface LancamentoFinanceiroRow {
  id: string;
  tipo: "pagar" | "receber";
  descricao: string;
  valor: number;
  valor_pago: number | null;
  data_competencia: string | null;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "pendente" | "pago" | "cancelado";
  categoria:
    | "obra"
    | "terreno"
    | "administrativo"
    | "marketing"
    | "comissao"
    | "imposto"
    | "financeiro"
    | "venda"
    | "outro";
  loteamento_id: string | null;
  lote_id: string | null;
  fase_id: string | null;
  fornecedor_id: string | null;
  venda_id: string | null;
  corretor_id: string | null;
  forma_pagamento:
    | "pix"
    | "boleto"
    | "transferencia"
    | "dinheiro"
    | "cartao"
    | null;
  nota_fiscal_numero: string | null;
  comprovante_url: string | null;
  observacao: string | null;
  parcela_numero: number | null;
  total_parcelas: number | null;
  grupo_id: string | null;
  recorrencia: "none" | "mensal" | "semanal" | "anual";
  created_at: string;
  updated_at: string;
}

export interface DiarioObraRow {
  id: string;
  lote_id: string;
  data: string;
  responsavel_id: string | null;
  total_efetivo: number;
  presentes: number;
  ausentes: number;
  atividades_executadas: number;
  clima:
    | "ensolarado"
    | "nublado"
    | "chuvoso"
    | "parcialmente_nublado"
    | "garoa"
    | null;
  resumo_atividades: string | null;
  observacao: string | null;
  fotos: string[];
  created_at: string;
}

// ============================================================
// Database interface (para createBrowserClient/createServerClient)
// ============================================================
type GenericInsert<T> = Partial<T>;
type GenericUpdate<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      loteamentos: {
        Row: LoteamentoRow;
        Insert: GenericInsert<LoteamentoRow> & { nome: string };
        Update: GenericUpdate<LoteamentoRow>;
        Relationships: [];
      };
      quadras: {
        Row: QuadraRow;
        Insert: GenericInsert<QuadraRow> & {
          loteamento_id: string;
          identificador: string;
        };
        Update: GenericUpdate<QuadraRow>;
        Relationships: [];
      };
      lotes: {
        Row: LoteRow;
        Insert: GenericInsert<LoteRow> & {
          quadra_id: string;
          numero: string;
        };
        Update: GenericUpdate<LoteRow>;
        Relationships: [];
      };
      vendas: {
        Row: VendaRow;
        Insert: GenericInsert<VendaRow> & {
          lote_id: string;
          tipo: "reserva" | "venda";
        };
        Update: GenericUpdate<VendaRow>;
        Relationships: [];
      };
      fases_obra: {
        Row: FaseObraRow;
        Insert: GenericInsert<FaseObraRow> & { lote_id: string; nome: string };
        Update: GenericUpdate<FaseObraRow>;
        Relationships: [];
      };
      fornecedores: {
        Row: FornecedorRow;
        Insert: GenericInsert<FornecedorRow> & { razao_social: string };
        Update: GenericUpdate<FornecedorRow>;
        Relationships: [];
      };
      fornecedor_precos: {
        Row: FornecedorPrecoRow;
        Insert: GenericInsert<FornecedorPrecoRow> & {
          fornecedor_id: string;
          material: string;
          preco: number;
        };
        Update: GenericUpdate<FornecedorPrecoRow>;
        Relationships: [];
      };
      lancamentos_material: {
        Row: LancamentoMaterialRow;
        Insert: GenericInsert<LancamentoMaterialRow> & {
          lote_id: string;
          tipo: "entrada" | "saida";
          data: string;
          material: string;
          quantidade: number;
          valor_total: number;
        };
        Update: GenericUpdate<LancamentoMaterialRow>;
        Relationships: [];
      };
      funcionarios: {
        Row: FuncionarioRow;
        Insert: GenericInsert<FuncionarioRow> & { nome: string };
        Update: GenericUpdate<FuncionarioRow>;
        Relationships: [];
      };
      alocacoes: {
        Row: AlocacaoRow;
        Insert: GenericInsert<AlocacaoRow> & {
          funcionario_id: string;
          lote_id: string;
        };
        Update: GenericUpdate<AlocacaoRow>;
        Relationships: [];
      };
      corretores: {
        Row: CorretorRow;
        Insert: GenericInsert<CorretorRow> & { nome: string };
        Update: GenericUpdate<CorretorRow>;
        Relationships: [];
      };
      documentos: {
        Row: DocumentoRow;
        Insert: GenericInsert<DocumentoRow> & {
          entidade_tipo: "lote" | "loteamento" | "funcionario" | "venda";
          entidade_id: string;
          nome: string;
          arquivo_url: string;
        };
        Update: GenericUpdate<DocumentoRow>;
        Relationships: [];
      };
      materiais: {
        Row: MaterialRow;
        Insert: GenericInsert<MaterialRow> & { nome: string };
        Update: GenericUpdate<MaterialRow>;
        Relationships: [];
      };
      diarios_obra: {
        Row: DiarioObraRow;
        Insert: GenericInsert<DiarioObraRow> & {
          lote_id: string;
          data: string;
        };
        Update: GenericUpdate<DiarioObraRow>;
        Relationships: [];
      };
      lancamentos_financeiros: {
        Row: LancamentoFinanceiroRow;
        Insert: GenericInsert<LancamentoFinanceiroRow> & {
          tipo: "pagar" | "receber";
          descricao: string;
          valor: number;
          data_vencimento: string;
        };
        Update: GenericUpdate<LancamentoFinanceiroRow>;
        Relationships: [];
      };
      investidores: {
        Row: InvestidorRow;
        Insert: GenericInsert<InvestidorRow> & { nome: string };
        Update: GenericUpdate<InvestidorRow>;
        Relationships: [];
      };
      aportes: {
        Row: AporteRow;
        Insert: GenericInsert<AporteRow> & {
          investidor_id: string;
          lote_id: string;
        };
        Update: GenericUpdate<AporteRow>;
        Relationships: [];
      };
      municipios_parametros: {
        Row: MunicipioParametrosRow;
        Insert: GenericInsert<MunicipioParametrosRow> & {
          municipio: string;
          estado: string;
        };
        Update: GenericUpdate<MunicipioParametrosRow>;
        Relationships: [];
      };
      cub_indices: {
        Row: CubIndiceRow;
        Insert: GenericInsert<CubIndiceRow> & {
          estado: string;
          padrao: "baixo" | "normal" | "alto";
          tipo_projeto: string;
          valor_m2: number;
          mes_referencia: string;
        };
        Update: GenericUpdate<CubIndiceRow>;
        Relationships: [];
      };
      zonas_urbanisticas: {
        Row: ZonaUrbanisticaRow;
        Insert: GenericInsert<ZonaUrbanisticaRow> & {
          municipio: string;
          estado: string;
          zona: string;
        };
        Update: GenericUpdate<ZonaUrbanisticaRow>;
        Relationships: [];
      };
      estudos_viabilidade: {
        Row: EstudoViabilidadeRow;
        Insert: GenericInsert<EstudoViabilidadeRow> & { nome: string };
        Update: GenericUpdate<EstudoViabilidadeRow>;
        Relationships: [];
      };
      viabilidade_programa: {
        Row: ViabilidadeProgramaRow;
        Insert: GenericInsert<ViabilidadeProgramaRow> & {
          estudo_id: string;
          tipo_unidade: string;
        };
        Update: GenericUpdate<ViabilidadeProgramaRow>;
        Relationships: [];
      };
      viabilidade_custos_itbi: {
        Row: ViabilidadeCustosItbiRow;
        Insert: GenericInsert<ViabilidadeCustosItbiRow> & {
          estudo_id: string;
          cidade: string;
          aliquota_pct: number;
        };
        Update: GenericUpdate<ViabilidadeCustosItbiRow>;
        Relationships: [];
      };
      viabilidade_fluxo: {
        Row: ViabilidadeFluxoRow;
        Insert: GenericInsert<ViabilidadeFluxoRow> & {
          estudo_id: string;
          periodo: number;
        };
        Update: GenericUpdate<ViabilidadeFluxoRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ============================================================
// Aliases convenientes
// ============================================================
export type Loteamento = LoteamentoRow;
export type Quadra = QuadraRow;
export type Lote = LoteRow;
export type Venda = VendaRow;
export type FaseObra = FaseObraRow;
export type Fornecedor = FornecedorRow;
export type FornecedorPreco = FornecedorPrecoRow;
export type LancamentoMaterial = LancamentoMaterialRow;
export type Funcionario = FuncionarioRow;
export type Alocacao = AlocacaoRow;
export type Corretor = CorretorRow;
export type Documento = DocumentoRow;
export type Material = MaterialRow;
export type DiarioObra = DiarioObraRow;
export type LancamentoFinanceiro = LancamentoFinanceiroRow;
export type Investidor = InvestidorRow;
export type Aporte = AporteRow;
export type MunicipioParametros = MunicipioParametrosRow;
export type CubIndice = CubIndiceRow;
export type ZonaUrbanistica = ZonaUrbanisticaRow;
export type EstudoViabilidade = EstudoViabilidadeRow;
export type ViabilidadePrograma = ViabilidadeProgramaRow;
export type ViabilidadeCustosItbi = ViabilidadeCustosItbiRow;
export type ViabilidadeFluxo = ViabilidadeFluxoRow;
