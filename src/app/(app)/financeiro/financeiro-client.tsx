"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  RotateCcw,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { KPICard } from "@/components/kpi-card";
import { ExportarPDF } from "@/components/exportar-pdf";
import {
  createLancamento,
  updateLancamento,
  deleteLancamento,
  baixarPagamento,
  reabrirLancamento,
} from "@/lib/actions/financeiro";
import {
  construirFluxoCaixa,
  calcularDRE,
  situacaoLancamento,
  type Granularidade,
  type LinhaDRE,
} from "@/lib/financeiro";
import {
  CATEGORIA_FINANCEIRA,
  FORMA_PAGAMENTO,
  RECORRENCIA,
  GRANULARIDADE_FLUXO,
} from "@/lib/constants";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/utils";
import type {
  LancamentoFinanceiro,
  Fornecedor,
  Corretor,
} from "@/lib/supabase/types";
import type { ResumoFinanceiro } from "@/lib/queries";
import type { OpcaoLoteamento, OpcaoLote } from "@/lib/filters";

interface Props {
  lancamentos: LancamentoFinanceiro[];
  resumo: ResumoFinanceiro;
  dreLinhas: LinhaDRE[];
  fornecedores: Fornecedor[];
  corretores: Corretor[];
  opcoes: { loteamentos: OpcaoLoteamento[]; lotes: OpcaoLote[] };
}

const SIT_BADGE: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  pago: "success",
  pendente: "warning",
  atrasado: "destructive",
  cancelado: "muted",
};
const SIT_LABEL: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export function FinanceiroClient({
  lancamentos,
  resumo,
  dreLinhas,
  fornecedores,
  corretores,
  opcoes,
}: Props) {
  return (
    <Tabs defaultValue="visao">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="visao" icon={<Wallet className="h-4 w-4" />}>
          Visão geral
        </TabsTrigger>
        <TabsTrigger value="pagar" icon={<ArrowUpCircle className="h-4 w-4" />}>
          Contas a pagar
        </TabsTrigger>
        <TabsTrigger value="receber" icon={<ArrowDownCircle className="h-4 w-4" />}>
          Contas a receber
        </TabsTrigger>
        <TabsTrigger value="fluxo" icon={<TrendingUp className="h-4 w-4" />}>
          Fluxo de caixa
        </TabsTrigger>
        <TabsTrigger value="dre" icon={<Wallet className="h-4 w-4" />}>
          DRE
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visao">
        <VisaoGeral resumo={resumo} />
      </TabsContent>
      <TabsContent value="pagar">
        <ContasTab
          tipo="pagar"
          lancamentos={lancamentos.filter((l) => l.tipo === "pagar")}
          fornecedores={fornecedores}
          corretores={corretores}
          opcoes={opcoes}
        />
      </TabsContent>
      <TabsContent value="receber">
        <ContasTab
          tipo="receber"
          lancamentos={lancamentos.filter((l) => l.tipo === "receber")}
          fornecedores={fornecedores}
          corretores={corretores}
          opcoes={opcoes}
        />
      </TabsContent>
      <TabsContent value="fluxo">
        <FluxoCaixaTab lancamentos={lancamentos} />
      </TabsContent>
      <TabsContent value="dre">
        <DRETab linhas={dreLinhas} />
      </TabsContent>
    </Tabs>
  );
}

// ============================================================
// Visão geral
// ============================================================
function VisaoGeral({ resumo }: { resumo: ResumoFinanceiro }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <KPICard
        label="A receber (pendente)"
        value={formatBRL(resumo.totalReceber)}
        variant="success"
        currency
        icon={<ArrowDownCircle className="h-5 w-5" />}
      />
      <KPICard
        label="A pagar (pendente)"
        value={formatBRL(resumo.totalPagar)}
        variant="destructive"
        currency
        icon={<ArrowUpCircle className="h-5 w-5" />}
      />
      <KPICard
        label="Saldo previsto"
        value={formatBRL(resumo.saldoPrevisto)}
        variant={resumo.saldoPrevisto >= 0 ? "primary" : "warning"}
        currency
        icon={<Wallet className="h-5 w-5" />}
      />
      <KPICard
        label="Atrasado a pagar"
        value={formatBRL(resumo.atrasadoPagar)}
        variant={resumo.atrasadoPagar > 0 ? "destructive" : "default"}
        currency
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <KPICard
        label="Recebido no mês"
        value={formatBRL(resumo.recebidoMes)}
        variant="success"
        currency
      />
      <KPICard
        label="Pago no mês"
        value={formatBRL(resumo.pagoMes)}
        variant="default"
        currency
      />
      <KPICard
        label="Atrasado a receber"
        value={formatBRL(resumo.atrasadoReceber)}
        variant={resumo.atrasadoReceber > 0 ? "warning" : "default"}
        currency
      />
    </div>
  );
}

// ============================================================
// Contas a pagar / receber
// ============================================================
function ContasTab({
  tipo,
  lancamentos,
  fornecedores,
  corretores,
  opcoes,
}: {
  tipo: "pagar" | "receber";
  lancamentos: LancamentoFinanceiro[];
  fornecedores: Fornecedor[];
  corretores: Corretor[];
  opcoes: { loteamentos: OpcaoLoteamento[]; lotes: OpcaoLote[] };
}) {
  const [open, setOpen] = React.useState(false);
  const [baixaOpen, setBaixaOpen] = React.useState<LancamentoFinanceiro | null>(null);
  const [editing, setEditing] = React.useState<LancamentoFinanceiro | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(l: LancamentoFinanceiro) {
    setEditing(l);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const payload = {
        tipo,
        descricao: String(fd.get("descricao") ?? ""),
        valor: Number(fd.get("valor") ?? 0),
        data_vencimento: String(fd.get("data_vencimento") ?? ""),
        categoria: (fd.get("categoria") as string) || "outro",
        loteamento_id: (fd.get("loteamento_id") as string) || null,
        lote_id: (fd.get("lote_id") as string) || null,
        fornecedor_id: (fd.get("fornecedor_id") as string) || null,
        corretor_id: (fd.get("corretor_id") as string) || null,
        observacao: (fd.get("observacao") as string) || null,
        recorrencia: (fd.get("recorrencia") as string) || "none",
        parcelas: Number(fd.get("parcelas") ?? 1),
      } as Parameters<typeof createLancamento>[0];

      if (editing) {
        await updateLancamento(editing.id, payload);
        toast.success("Lançamento atualizado");
      } else {
        await createLancamento(payload);
        toast.success("Lançamento criado");
      }
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    try {
      await deleteLancamento(id);
      toast.success("Excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleReabrir(id: string) {
    try {
      await reabrirLancamento(id);
      toast.success("Reaberto");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  const total = lancamentos
    .filter((l) => l.status !== "cancelado")
    .reduce((s, l) => s + Number(l.valor ?? 0), 0);

  const pdfSecoes = [
    {
      head: ["Vencimento", "Descrição", "Categoria", "Situação", "Valor"],
      body: lancamentos.map((l) => [
        formatDateBR(l.data_vencimento),
        l.descricao,
        CATEGORIA_FINANCEIRA[l.categoria],
        SIT_LABEL[situacaoLancamento(l)],
        formatBRL(l.valor),
      ]),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {lancamentos.length} lançamento(s) ·{" "}
          <span className="font-semibold text-foreground">{formatBRL(total)}</span>
        </p>
        <div className="flex gap-2">
          <ExportarPDF
            titulo={tipo === "pagar" ? "Contas a pagar" : "Contas a receber"}
            secoes={pdfSecoes}
            arquivo={`contas-${tipo}`}
          />
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo lançamento
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {lancamentos.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-7 w-7" />}
              title={`Nenhuma conta a ${tipo === "pagar" ? "pagar" : "receber"}`}
              description="Lance e agende vencimentos para acompanhar aqui."
              action={
                <Button size="sm" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Novo lançamento
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((l) => {
                  const sit = situacaoLancamento(l);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">
                        {formatDateBR(l.data_vencimento)}
                        {l.parcela_numero && (
                          <span className="ml-1 text-muted-foreground">
                            ({l.parcela_numero}/{l.total_parcelas})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{l.descricao}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {CATEGORIA_FINANCEIRA[l.categoria]}
                      </TableCell>
                      <TableCell>
                        <Badge variant={SIT_BADGE[sit]}>{SIT_LABEL[sit]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(l.valor)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {l.status === "pendente" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-success hover:bg-success/10"
                              onClick={() => setBaixaOpen(l)}
                              aria-label="Dar baixa"
                              title="Dar baixa (pagar/receber)"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : l.status === "pago" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleReabrir(l.id)}
                              aria-label="Reabrir"
                              title="Reabrir"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(l)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(l.id)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal novo/editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar lançamento" : "Novo lançamento"} —{" "}
              {tipo === "pagar" ? "a pagar" : "a receber"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            key={editing?.id ?? "novo"}
          >
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                name="descricao"
                required
                defaultValue={editing?.descricao ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editing?.valor ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_vencimento">Vencimento *</Label>
                <Input
                  id="data_vencimento"
                  name="data_vencimento"
                  type="date"
                  required
                  defaultValue={
                    editing?.data_vencimento ??
                    new Date().toISOString().slice(0, 10)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  id="categoria"
                  name="categoria"
                  defaultValue={editing?.categoria ?? "outro"}
                >
                  {Object.entries(CATEGORIA_FINANCEIRA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loteamento_id">Centro de custo (loteamento)</Label>
                <Select
                  id="loteamento_id"
                  name="loteamento_id"
                  defaultValue={editing?.loteamento_id ?? ""}
                >
                  <option value="">—</option>
                  {opcoes.loteamentos.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {tipo === "pagar" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="fornecedor_id">Fornecedor</Label>
                  <Select
                    id="fornecedor_id"
                    name="fornecedor_id"
                    defaultValue={editing?.fornecedor_id ?? ""}
                  >
                    <option value="">—</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome_fantasia ?? f.razao_social}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="corretor_id">Corretor</Label>
                  <Select
                    id="corretor_id"
                    name="corretor_id"
                    defaultValue={editing?.corretor_id ?? ""}
                  >
                    <option value="">—</option>
                    {corretores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="lote_id">Lote (opcional)</Label>
                <Select
                  id="lote_id"
                  name="lote_id"
                  defaultValue={editing?.lote_id ?? ""}
                >
                  <option value="">—</option>
                  {opcoes.lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      Lote {l.numero} · Q.{l.quadraIdentificador}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="recorrencia">Recorrência</Label>
                  <Select id="recorrencia" name="recorrencia" defaultValue="none">
                    {Object.entries(RECORRENCIA).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parcelas">Nº de parcelas</Label>
                  <Input
                    id="parcelas"
                    name="parcelas"
                    type="number"
                    min="1"
                    defaultValue={1}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Com recorrência, gera N lançamentos.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                name="observacao"
                rows={2}
                defaultValue={editing?.observacao ?? ""}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal baixa de pagamento */}
      <BaixaDialog
        lancamento={baixaOpen}
        onClose={() => setBaixaOpen(null)}
      />
    </div>
  );
}

function BaixaDialog({
  lancamento,
  onClose,
}: {
  lancamento: LancamentoFinanceiro | null;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lancamento) return;
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await baixarPagamento(lancamento.id, {
        data_pagamento: String(fd.get("data_pagamento") ?? ""),
        valor_pago: Number(fd.get("valor_pago") ?? 0),
        forma_pagamento: (fd.get("forma_pagamento") as string) || null,
      });
      toast.success("Baixa registrada");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={!!lancamento} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar baixa — {lancamento?.descricao}</DialogTitle>
        </DialogHeader>
        {lancamento && (
          <form onSubmit={handle} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data_pagamento">Data do pagamento *</Label>
                <Input
                  id="data_pagamento"
                  name="data_pagamento"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor_pago">Valor pago (R$) *</Label>
                <Input
                  id="valor_pago"
                  name="valor_pago"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={lancamento.valor}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="forma_pagamento">Forma de pagamento</Label>
              <Select id="forma_pagamento" name="forma_pagamento" defaultValue="">
                <option value="">—</option>
                {Object.entries(FORMA_PAGAMENTO).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar baixa
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Fluxo de caixa
// ============================================================
function FluxoCaixaTab({
  lancamentos,
}: {
  lancamentos: LancamentoFinanceiro[];
}) {
  const [granularidade, setGranularidade] = React.useState<Granularidade>("mes");
  const [saldoInicial, setSaldoInicial] = React.useState("0");

  const serie = React.useMemo(
    () =>
      construirFluxoCaixa(
        Number(saldoInicial) || 0,
        lancamentos.map((l) => ({
          tipo: l.tipo,
          valor: Number(l.valor),
          valor_pago: l.valor_pago,
          status: l.status,
          data_vencimento: l.data_vencimento,
          data_pagamento: l.data_pagamento,
          categoria: l.categoria,
          loteamento_id: l.loteamento_id,
          lote_id: l.lote_id,
        })),
        granularidade,
      ),
    [lancamentos, saldoInicial, granularidade],
  );

  const temRuptura = serie.some((s) => s.ruptura);

  const pdfSecoes = [
    {
      head: ["Período", "Entradas", "Saídas", "Saldo", "Acumulado"],
      body: serie.map((s) => [
        s.rotulo,
        formatBRL(s.entradas),
        formatBRL(s.saidas),
        formatBRL(s.saldo),
        formatBRL(s.acumulado),
      ]),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="granularidade">Granularidade</Label>
            <Select
              id="granularidade"
              value={granularidade}
              onChange={(e) =>
                setGranularidade(e.target.value as Granularidade)
              }
              className="h-9 w-auto"
            >
              {Object.entries(GRANULARIDADE_FLUXO).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="saldoInicial">Saldo inicial (R$)</Label>
            <Input
              id="saldoInicial"
              type="number"
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              className="h-9 w-36"
            />
          </div>
        </div>
        <ExportarPDF
          titulo="Fluxo de caixa"
          subtitulo={`Granularidade: ${GRANULARIDADE_FLUXO[granularidade]}`}
          secoes={pdfSecoes}
          arquivo="fluxo-caixa"
        />
      </div>

      {temRuptura && (
        <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm text-accent">
          <AlertTriangle className="h-4 w-4" />
          Há períodos com saldo acumulado negativo (ruptura de caixa). Veja em
          laranja no gráfico.
        </div>
      )}

      {serie.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-7 w-7" />}
          title="Sem dados de fluxo"
          description="Cadastre lançamentos a pagar e a receber para ver o fluxo de caixa."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entradas x Saídas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saldo acumulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <ReferenceLine y={0} stroke="#f97316" strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serie.map((s) => (
                    <TableRow key={s.chave} className={s.ruptura ? "bg-accent/5" : ""}>
                      <TableCell className="font-medium">{s.rotulo}</TableCell>
                      <TableCell className="text-right text-success">{formatBRL(s.entradas)}</TableCell>
                      <TableCell className="text-right text-destructive">{formatBRL(s.saidas)}</TableCell>
                      <TableCell className="text-right">{formatBRL(s.saldo)}</TableCell>
                      <TableCell className={`text-right font-semibold ${s.ruptura ? "text-accent" : ""}`}>
                        {formatBRL(s.acumulado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// DRE
// ============================================================
function DRETab({ linhas }: { linhas: LinhaDRE[] }) {
  const dre = React.useMemo(() => calcularDRE(linhas), [linhas]);

  const receitasCat = dre.porCategoria.filter((c) => c.natureza === "receita");
  const custosCat = dre.porCategoria.filter((c) => c.natureza === "custo_direto");
  const despesasCat = dre.porCategoria.filter(
    (c) => c.natureza === "despesa_operacional",
  );

  const pdfSecoes = [
    {
      titulo: "Demonstrativo de Resultado (DRE)",
      head: ["Conta", "Valor"],
      body: [
        ["Receitas", formatBRL(dre.receitas)],
        ["(–) Custos diretos", formatBRL(-dre.custosDirectos)],
        ["(=) Lucro bruto", formatBRL(dre.lucroBruto)],
        ["(–) Despesas operacionais", formatBRL(-dre.despesasOperacionais)],
        ["(=) Resultado líquido", formatBRL(dre.resultadoLiquido)],
        ["Margem bruta", formatPercent(dre.margemBrutaPct, 1)],
        ["Margem líquida", formatPercent(dre.margemLiquidaPct, 1)],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <KPICard label="Receitas" value={formatBRL(dre.receitas)} variant="success" currency />
          <KPICard label="Custos diretos" value={formatBRL(dre.custosDirectos)} currency />
          <KPICard
            label="Resultado"
            value={formatBRL(dre.resultadoLiquido)}
            variant={dre.resultadoLiquido >= 0 ? "success" : "destructive"}
            currency
          />
          <KPICard
            label="Margem líquida"
            value={formatPercent(dre.margemLiquidaPct, 1)}
            variant="accent"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <ExportarPDF titulo="DRE gerencial" secoes={pdfSecoes} arquivo="dre" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demonstrativo de Resultado</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableBody>
              <DRELinhaRow label="Receitas" valor={dre.receitas} forte />
              {receitasCat.map((c) => (
                <DRELinhaRow key={`r-${c.categoria}`} label={`  ${CATEGORIA_FINANCEIRA[c.categoria as keyof typeof CATEGORIA_FINANCEIRA] ?? c.categoria}`} valor={c.valor} indent />
              ))}
              <DRELinhaRow label="(–) Custos diretos" valor={-dre.custosDirectos} forte />
              {custosCat.map((c) => (
                <DRELinhaRow key={`c-${c.categoria}`} label={`  ${CATEGORIA_FINANCEIRA[c.categoria as keyof typeof CATEGORIA_FINANCEIRA] ?? c.categoria}`} valor={-c.valor} indent />
              ))}
              <DRELinhaRow label="(=) Lucro bruto" valor={dre.lucroBruto} forte destaque />
              <DRELinhaRow label="(–) Despesas operacionais" valor={-dre.despesasOperacionais} forte />
              {despesasCat.map((c) => (
                <DRELinhaRow key={`d-${c.categoria}`} label={`  ${CATEGORIA_FINANCEIRA[c.categoria as keyof typeof CATEGORIA_FINANCEIRA] ?? c.categoria}`} valor={-c.valor} indent />
              ))}
              <DRELinhaRow label="(=) Resultado líquido" valor={dre.resultadoLiquido} forte destaque />
              <TableRow>
                <TableCell className="text-muted-foreground">Margem bruta / líquida</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatPercent(dre.margemBrutaPct, 1)} / {formatPercent(dre.margemLiquidaPct, 1)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DRELinhaRow({
  label,
  valor,
  forte,
  destaque,
  indent,
}: {
  label: string;
  valor: number;
  forte?: boolean;
  destaque?: boolean;
  indent?: boolean;
}) {
  return (
    <TableRow className={destaque ? "bg-muted/30" : ""}>
      <TableCell
        className={`${forte ? "font-semibold" : indent ? "pl-8 text-sm text-muted-foreground" : ""}`}
      >
        {label}
      </TableCell>
      <TableCell
        className={`text-right ${forte ? "font-bold" : ""} ${
          valor < 0 ? "text-destructive" : destaque ? "text-success" : ""
        }`}
      >
        {formatBRL(valor)}
      </TableCell>
    </TableRow>
  );
}
