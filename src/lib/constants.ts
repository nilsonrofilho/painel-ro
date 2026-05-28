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
