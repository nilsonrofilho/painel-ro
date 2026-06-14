export const STATUS_LOTE = {
  disponivel: { label: "Disponível", color: "success", emoji: "🟢" },
  reservado: { label: "Reservado", color: "warning", emoji: "🟡" },
  vendido: { label: "Vendido", color: "primary", emoji: "🔵" },
} as const;

export type StatusLote = keyof typeof STATUS_LOTE;

export const ETAPAS_OBRA = {
  planejamento: { label: "Planejamento", order: 0, percent: 0 },
  fundacao: { label: "Fundação", order: 1, percent: 20 },
  alvenaria: { label: "Alvenaria", order: 2, percent: 45 },
  cobertura: { label: "Cobertura", order: 3, percent: 65 },
  acabamento: { label: "Acabamento", order: 4, percent: 85 },
  concluido: { label: "Concluído", order: 5, percent: 100 },
} as const;

export type EtapaObra = keyof typeof ETAPAS_OBRA;

export const STATUS_LOTEAMENTO = {
  planejamento: { label: "Planejamento", color: "muted" },
  em_obra: { label: "Em obra", color: "warning" },
  concluido: { label: "Concluído", color: "success" },
  pausado: { label: "Pausado", color: "destructive" },
} as const;

export type StatusLoteamento = keyof typeof STATUS_LOTEAMENTO;

export const TIPO_CONTRATACAO = {
  clt: "CLT",
  diarista: "Diarista",
  empreitada: "Empreitada",
} as const;

export const CATEGORIA_FORNECEDOR = {
  material: "Material",
  servico: "Serviço",
  ambos: "Ambos",
} as const;

export const FUNCOES_OBRA = [
  "Coordenador de obras",
  "Engenheiro",
  "Mestre de obra",
  "Pedreiro",
  "Servente",
  "Eletricista",
  "Encanador",
  "Pintor",
  "Carpinteiro",
  "Outro",
] as const;

export const TIPO_VENDA = {
  reserva: "Reserva",
  venda: "Venda",
} as const;

export const STATUS_VENDA = {
  ativa: "Ativa",
  cancelada: "Cancelada",
  convertida: "Convertida",
} as const;

export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

// ============================================================
// Viabilidade de empreendimentos
// ============================================================
export const STATUS_VIABILIDADE = {
  rascunho: { label: "Rascunho", color: "muted" },
  aprovado: { label: "Aprovado", color: "success" },
  reprovado: { label: "Reprovado", color: "destructive" },
} as const;

export type StatusViabilidade = keyof typeof STATUS_VIABILIDADE;

export const TIPO_EMPREENDIMENTO = {
  loteamento: "Loteamento",
  casas: "Casas",
  vertical: "Vertical (apartamentos)",
  misto: "Misto",
} as const;

export const TIPO_UNIDADE = [
  "Lote",
  "Casa isolada",
  "Casa geminada",
  "Apartamento",
  "Loja",
  "Sala comercial",
  "Outro",
] as const;

export const PADRAO_CONSTRUCAO = {
  baixo: "Baixo",
  normal: "Normal",
  alto: "Alto",
} as const;

export const TIPO_PROJETO_CUB = [
  "R1",
  "R8",
  "R16",
  "PP4",
  "CAL8",
  "loteamento",
  "outro",
] as const;

// Regime tributário → alíquota efetiva sobre a venda (pré-preenche imposto_venda_pct)
export const REGIME_TRIBUTARIO = {
  RET: { label: "RET (incorporação)", imposto_pct: 4 },
  RET_social: { label: "RET social (HIS)", imposto_pct: 1 },
  presumido: { label: "Lucro presumido", imposto_pct: 6.73 },
  real: { label: "Lucro real", imposto_pct: 0 },
} as const;

export type RegimeTributario = keyof typeof REGIME_TRIBUTARIO;

export const ITBI_BASE = {
  valor_transacao: "Valor da transação",
  valor_venal: "Valor venal",
  maior_entre: "Maior entre (venal × transação)",
} as const;

export const CLIMA_DIARIO = {
  ensolarado: "☀️ Ensolarado",
  parcialmente_nublado: "⛅ Parcialmente nublado",
  nublado: "☁️ Nublado",
  garoa: "🌦️ Garoa",
  chuvoso: "🌧️ Chuvoso",
} as const;

// ============================================================
// Financeiro
// ============================================================
export const TIPO_LANCAMENTO = {
  pagar: "A pagar",
  receber: "A receber",
} as const;

export const STATUS_LANCAMENTO = {
  pendente: { label: "Pendente", color: "warning" },
  pago: { label: "Pago", color: "success" },
  cancelado: { label: "Cancelado", color: "muted" },
} as const;

export const CATEGORIA_FINANCEIRA = {
  obra: "Obra",
  terreno: "Terreno",
  administrativo: "Administrativo",
  marketing: "Marketing",
  comissao: "Comissão",
  imposto: "Imposto",
  financeiro: "Financeiro",
  venda: "Venda",
  outro: "Outro",
} as const;

export type CategoriaFinanceira = keyof typeof CATEGORIA_FINANCEIRA;

export const FORMA_PAGAMENTO = {
  pix: "PIX",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
} as const;

export const RECORRENCIA = {
  none: "Sem recorrência",
  mensal: "Mensal",
  semanal: "Semanal",
  anual: "Anual",
} as const;

export const GRANULARIDADE_FLUXO = {
  dia: "Diária",
  semana: "Semanal",
  mes: "Mensal",
} as const;

export type GranularidadeFluxo = keyof typeof GRANULARIDADE_FLUXO;
