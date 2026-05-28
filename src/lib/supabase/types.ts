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
