"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Link2,
  Copy,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
// Loader2 usado no botão de submit
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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
import { EmptyState } from "@/components/ui/empty-state";
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
import { KPICard } from "@/components/kpi-card";
import {
  addAporte,
  updateAporte,
  deleteAporte,
  regenerarToken,
} from "@/lib/actions/investidores";
import { formatBRL, formatDateBR } from "@/lib/utils";
import type { Investidor } from "@/lib/supabase/types";
import type { AporteComLote } from "@/lib/queries";
import type { OpcaoLote } from "@/lib/filters";

const CORES = [
  "hsl(220, 79%, 45%)",
  "hsl(5, 64%, 48%)",
  "hsl(160, 64%, 42%)",
  "hsl(35, 90%, 52%)",
  "hsl(265, 55%, 55%)",
  "hsl(190, 70%, 48%)",
  "hsl(217, 16%, 55%)",
];

function retornoDoAporte(a: {
  valor_investido: number;
  retorno_pct: number | null;
  retorno_valor: number | null;
}): number {
  if (a.retorno_valor != null) return Number(a.retorno_valor);
  if (a.retorno_pct != null)
    return (Number(a.valor_investido) * Number(a.retorno_pct)) / 100;
  return 0;
}

interface Props {
  investidor: Investidor;
  aportes: AporteComLote[];
  lotes: OpcaoLote[];
}

export function InvestidorPainel({ investidor, aportes, lotes }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editing, setEditing] = React.useState<AporteComLote | null>(null);

  const totalInvestido = aportes.reduce((s, a) => s + a.valor_investido, 0);
  const totalRetorno = aportes.reduce((s, a) => s + retornoDoAporte(a), 0);

  // Distribuição por loteamento (gráfico pizza)
  const porLoteamento = React.useMemo(() => {
    const mapa = new Map<string, number>();
    for (const a of aportes) {
      mapa.set(
        a.loteamento_nome,
        (mapa.get(a.loteamento_nome) ?? 0) + a.valor_investido,
      );
    }
    return Array.from(mapa.entries()).map(([nome, valor], i) => ({
      nome,
      valor,
      cor: CORES[i % CORES.length],
    }));
  }, [aportes]);

  const linkAcompanhamento =
    typeof window !== "undefined"
      ? `${window.location.origin}/acompanhamento/${investidor.token_publico}`
      : `/acompanhamento/${investidor.token_publico}`;

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(a: AporteComLote) {
    setEditing(a);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const payload = {
        investidor_id: investidor.id,
        lote_id: String(fd.get("lote_id") ?? ""),
        valor_investido: Number(fd.get("valor_investido") ?? 0),
        retorno_pct: fd.get("retorno_pct")
          ? Number(fd.get("retorno_pct"))
          : null,
        retorno_valor: fd.get("retorno_valor")
          ? Number(fd.get("retorno_valor"))
          : null,
        data_aporte: (fd.get("data_aporte") as string) || null,
        observacao: (fd.get("observacao") as string) || null,
      };
      if (editing) {
        await updateAporte(editing.id, investidor.id, payload);
        toast.success("Aporte atualizado");
      } else {
        await addAporte(payload);
        toast.success("Aporte adicionado");
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
    if (!confirm("Remover este aporte?")) return;
    try {
      await deleteAporte(id, investidor.id);
      toast.success("Aporte removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkAcompanhamento);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  async function handleRegenerar() {
    if (!confirm("Gerar um novo link? O link atual deixará de funcionar."))
      return;
    try {
      await regenerarToken(investidor.id);
      toast.success("Novo link gerado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Total investido"
          value={formatBRL(totalInvestido)}
          variant="primary"
          currency
        />
        <KPICard
          label="Retorno projetado"
          value={formatBRL(totalRetorno)}
          variant="success"
          currency
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KPICard
          label="Total + retorno"
          value={formatBRL(totalInvestido + totalRetorno)}
          variant="accent"
          currency
        />
        <KPICard label="Lotes" value={aportes.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Investimento por loteamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {porLoteamento.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                Sem aportes ainda
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porLoteamento}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="valor"
                      nameKey="nome"
                    >
                      {porLoteamento.map((d, i) => (
                        <Cell key={i} fill={d.cor} stroke="hsl(var(--card))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link de acompanhamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-primary" />
              Link de acompanhamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com o investidor. Ele vê os próprios
              investimentos, sem precisar de login.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={linkAcompanhamento}
                readOnly
                className="text-xs"
                onFocus={(e) => e.target.select()}
              />
              <Button variant="outline" size="icon" onClick={copiarLink} aria-label="Copiar link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/acompanhamento/${investidor.token_publico}`}
                  target="_blank"
                >
                  <Link2 className="h-4 w-4" />
                  Abrir
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerar}
                className="text-muted-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Gerar novo link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aportes / lotes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Seus lotes</CardTitle>
          <Button
            size="sm"
            onClick={openNew}
            disabled={lotes.length === 0}
          >
            <Plus className="h-4 w-4" />
            Novo aporte
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {aportes.length === 0 ? (
            <EmptyState
              icon={<Plus className="h-7 w-7" />}
              title="Nenhum aporte ainda"
              description="Vincule lotes a este investidor com o valor investido e o retorno projetado."
              action={
                <Button size="sm" onClick={openNew} disabled={lotes.length === 0}>
                  <Plus className="h-4 w-4" />
                  Adicionar aporte
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Loteamento</TableHead>
                  <TableHead className="text-right">Investido</TableHead>
                  <TableHead className="text-right">Retorno proj.</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aportes.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Link
                        href={`/lotes/${a.lote_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Lote {a.lote_numero}
                      </Link>
                      <p className="text-[10px] text-muted-foreground">
                        Q.{a.quadra_identificador}
                        {a.data_aporte
                          ? ` · ${formatDateBR(a.data_aporte)}`
                          : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{a.loteamento_nome}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatBRL(a.valor_investido)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatBRL(retornoDoAporte(a))}
                      {a.retorno_pct != null && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          ({a.retorno_pct}%)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(a)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(a.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 bg-muted/30 font-bold">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right">
                    {formatBRL(totalInvestido)}
                  </TableCell>
                  <TableCell className="text-right text-success">
                    {formatBRL(totalRetorno)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal aporte */}
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : setOpen(false))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar aporte" : "Novo aporte"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            key={editing?.id ?? "novo"}
          >
            <div className="space-y-1.5">
              <Label htmlFor="lote_id">Lote *</Label>
              <Select
                id="lote_id"
                name="lote_id"
                required
                defaultValue={editing?.lote_id ?? ""}
              >
                <option value="">Selecione…</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    Lote {l.numero} · Q.{l.quadraIdentificador}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="valor_investido">Valor investido (R$) *</Label>
                <Input
                  id="valor_investido"
                  name="valor_investido"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editing?.valor_investido ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_aporte">Data do aporte</Label>
                <Input
                  id="data_aporte"
                  name="data_aporte"
                  type="date"
                  defaultValue={editing?.data_aporte ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="retorno_pct">Retorno projetado (%)</Label>
                <Input
                  id="retorno_pct"
                  name="retorno_pct"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.retorno_pct ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retorno_valor">Retorno em R$</Label>
                <Input
                  id="retorno_valor"
                  name="retorno_valor"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.retorno_valor ?? ""}
                />
                <p className="text-[10px] text-muted-foreground">
                  Se preenchido, tem prioridade sobre o %.
                </p>
              </div>
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
                {editing ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
