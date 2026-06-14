"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
import { ResumoEtapasChart } from "@/components/charts/resumo-etapas-chart";
import { addFase, updateFase, deleteFase, seedFasesPadrao } from "@/lib/actions/fases";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/utils";
import type { FaseObra, Lote } from "@/lib/supabase/types";

interface Props {
  lote: Lote;
  fases: FaseObra[];
  gastoTotal: number;
}

export function ObraCustosTab({ lote, fases, gastoTotal }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editingFase, setEditingFase] = React.useState<FaseObra | null>(null);
  const orcamentoTotal = Number(lote.orcamento_total ?? 0);
  const orcadoFases = fases.reduce(
    (s, f) => s + Number(f.orcamento ?? 0),
    0,
  );
  const gastoFases = fases.reduce((s, f) => s + Number(f.gasto ?? 0), 0);
  const saldo = orcamentoTotal - gastoTotal;

  const barData = fases.map((f) => ({
    nome: f.nome,
    orçado: Number(f.orcamento ?? 0),
    gasto: Number(f.gasto ?? 0),
  }));

  // Linha cumulativa por mês de gasto
  const lineData = React.useMemo(() => {
    // Aqui usamos só as fases concluídas com data_fim como pontos
    const pontos: { mes: string; total: number }[] = [];
    let acumulado = 0;
    const ordenadas = [...fases].sort((a, b) => {
      const da = a.data_fim ?? a.data_inicio ?? "";
      const db = b.data_fim ?? b.data_inicio ?? "";
      return da.localeCompare(db);
    });
    ordenadas.forEach((f) => {
      acumulado += Number(f.gasto ?? 0);
      const data = f.data_fim ?? f.data_inicio;
      if (data) {
        pontos.push({
          mes: formatDateBR(data),
          total: acumulado,
        });
      }
    });
    return pontos;
  }, [fases]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const payload = {
        lote_id: lote.id,
        nome: String(fd.get("nome") ?? ""),
        orcamento: fd.get("orcamento") ? Number(fd.get("orcamento")) : null,
        data_inicio: (fd.get("data_inicio") as string) || null,
        data_fim: (fd.get("data_fim") as string) || null,
        status: (fd.get("status") as "pendente" | "em_andamento" | "concluida") ?? "pendente",
        ordem: editingFase ? editingFase.ordem : fases.length + 1,
        predecessora_id: (fd.get("predecessora_id") as string) || null,
        duracao_dias: fd.get("duracao_dias")
          ? Number(fd.get("duracao_dias"))
          : null,
      };
      if (editingFase) {
        await updateFase(editingFase.id, payload);
        toast.success("Fase atualizada");
      } else {
        await addFase(payload);
        toast.success("Fase adicionada");
      }
      setOpen(false);
      setEditingFase(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(f: FaseObra) {
    setEditingFase(f);
    setOpen(true);
  }

  function openNew() {
    setEditingFase(null);
    setOpen(true);
  }

  function handleClose(o: boolean) {
    setOpen(o);
    if (!o) setEditingFase(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta fase?")) return;
    try {
      await deleteFase(id, lote.id);
      toast.success("Fase removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleSeed() {
    if (!confirm("Adicionar 5 fases padrão (Fundação, Alvenaria, Cobertura, Instalações, Acabamento)?"))
      return;
    try {
      await seedFasesPadrao(lote.id);
      toast.success("Fases padrão criadas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Orçamento total"
          value={formatBRL(orcamentoTotal)}
          variant="primary"
        />
        <KPICard
          label="Gasto até agora"
          value={formatBRL(gastoTotal)}
          variant={
            saldo < 0 ? "destructive" : gastoTotal > orcamentoTotal * 0.8 ? "warning" : "default"
          }
        />
        <KPICard
          label="Saldo"
          value={formatBRL(saldo)}
          variant={saldo < 0 ? "destructive" : "success"}
        />
        <KPICard
          label="% usado"
          value={
            orcamentoTotal > 0
              ? formatPercent((gastoTotal / orcamentoTotal) * 100, 1)
              : "—"
          }
          variant={
            orcamentoTotal > 0 && gastoTotal > orcamentoTotal
              ? "destructive"
              : "accent"
          }
        />
      </div>

      {/* Resumo por etapa (donut + tabela) */}
      {fases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResumoEtapasChart
              etapas={fases.map((f) => ({
                nome: f.nome,
                orcamento: Number(f.orcamento ?? 0),
                gasto: Number(f.gasto ?? 0),
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Fases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fases da obra</CardTitle>
          <div className="flex gap-2">
            {fases.length === 0 && (
              <Button variant="outline" size="sm" onClick={handleSeed}>
                <Sparkles className="h-4 w-4" />
                Usar fases padrão
              </Button>
            )}
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Nova fase
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {fases.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Nenhuma fase cadastrada. Use as fases padrão ou crie uma personalizada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fase</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Orçado</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="w-32">%</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fases.map((f) => {
                  const orc = Number(f.orcamento ?? 0);
                  const gst = Number(f.gasto ?? 0);
                  const pct = orc > 0 ? (gst / orc) * 100 : 0;
                  const indicator =
                    pct > 100
                      ? "bg-destructive"
                      : pct > 80
                        ? "bg-warning"
                        : "bg-success";
                  const duracao =
                    f.duracao_dias != null
                      ? f.duracao_dias
                      : f.data_inicio && f.data_fim
                        ? Math.max(
                            1,
                            Math.round(
                              (new Date(f.data_fim).getTime() -
                                new Date(f.data_inicio).getTime()) /
                                86400000,
                            ),
                          )
                        : null;
                  const predecessora = f.predecessora_id
                    ? fases.find((x) => x.id === f.predecessora_id)?.nome
                    : null;
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <p className="font-medium">{f.nome}</p>
                        {predecessora && (
                          <p className="text-[10px] text-muted-foreground">
                            após: {predecessora}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateBR(f.data_inicio)} → {formatDateBR(f.data_fim)}
                        {duracao != null && (
                          <span className="ml-1 font-medium text-foreground">
                            ({duracao}d)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatBRL(orc)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatBRL(gst)}
                      </TableCell>
                      <TableCell>
                        <Progress value={pct} indicatorClassName={indicator} />
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatPercent(pct, 0)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            f.status === "concluida"
                              ? "success"
                              : f.status === "em_andamento"
                                ? "warning"
                                : "muted"
                          }
                        >
                          {f.status === "concluida"
                            ? "Concluída"
                            : f.status === "em_andamento"
                              ? "Em andamento"
                              : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(f)}
                            className="h-7 w-7"
                            aria-label="Editar fase"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(f.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            aria-label="Excluir fase"
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
          {fases.length > 0 && (
            <div className="mx-6 mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
              <span>Totais</span>
              <span className="flex gap-6">
                <span>Orçado: {formatBRL(orcadoFases)}</span>
                <span>Gasto: {formatBRL(gastoFases)}</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orçado x Gasto por fase</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Adicione fases para ver o gráfico.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="nome"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="orçado"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="gasto"
                      fill="hsl(var(--accent))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Preencha datas nas fases para ver a evolução.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal nova/editar fase */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFase ? "Editar fase" : "Nova fase de obra"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            key={editingFase?.id ?? "novo"}
          >
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                name="nome"
                required
                placeholder="Ex: Fundação"
                defaultValue={editingFase?.nome ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orcamento">Orçamento (R$)</Label>
              <Input
                id="orcamento"
                name="orcamento"
                type="number"
                step="0.01"
                defaultValue={editingFase?.orcamento ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data_inicio">Início da atividade</Label>
                <Input
                  id="data_inicio"
                  name="data_inicio"
                  type="date"
                  defaultValue={editingFase?.data_inicio ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_fim">Fim da atividade</Label>
                <Input
                  id="data_fim"
                  name="data_fim"
                  type="date"
                  defaultValue={editingFase?.data_fim ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="duracao_dias">Duração (dias)</Label>
                <Input
                  id="duracao_dias"
                  name="duracao_dias"
                  type="number"
                  min="0"
                  placeholder="Auto pelas datas"
                  defaultValue={editingFase?.duracao_dias ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="predecessora_id">Atividade predecessora</Label>
                <Select
                  id="predecessora_id"
                  name="predecessora_id"
                  defaultValue={editingFase?.predecessora_id ?? ""}
                >
                  <option value="">— nenhuma —</option>
                  {fases
                    .filter((f) => f.id !== editingFase?.id)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome}
                      </option>
                    ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                defaultValue={editingFase?.status ?? "pendente"}
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingFase ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
