"use client";

import * as React from "react";
import { Plus, Trash2, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
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
import { upsertFluxo, deleteFluxoPeriodo } from "@/lib/actions/viabilidade";
import {
  calcVGV,
  calcCustoObra,
  calcCustoAquisicao,
  calcDemonstrativo,
  calcVPL,
  calcTIRAnualPct,
  calcPaybackSimples,
  calcExposicaoMaxima,
  saldoAcumulado,
  tmaMensal,
} from "@/lib/viabilidade";
import { formatBRL, formatPercent } from "@/lib/utils";
import type {
  EstudoViabilidade,
  ViabilidadePrograma,
  ViabilidadeCustosItbi,
  ViabilidadeFluxo,
} from "@/lib/supabase/types";

interface Props {
  estudo: EstudoViabilidade;
  programas: ViabilidadePrograma[];
  custos: ViabilidadeCustosItbi[];
  fluxo: ViabilidadeFluxo[];
  cubM2: number;
}

export function RetornoTab({ estudo, programas, custos, fluxo, cubM2 }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const itbiSelecionado =
    custos.find((c) => c.selecionado)?.valor_estimado ?? 0;

  const demo = React.useMemo(() => {
    const vgv = calcVGV(programas);
    const custoAquisicao = calcCustoAquisicao({
      custoTerreno: Number(estudo.custo_terreno ?? 0),
      itbiValor: itbiSelecionado,
      outorgaValor: Number(estudo.outorga_valor ?? 0),
      custosCartorio: Number(estudo.custos_cartorio ?? 0),
    });
    const custoObra = calcCustoObra(programas, cubM2, Number(estudo.bdi_pct ?? 0));
    return calcDemonstrativo({
      vgv,
      custoAquisicao,
      custoObra,
      custoInfraestrutura: Number(estudo.custo_infraestrutura ?? 0),
      custosIndiretosPct: Number(estudo.custos_indiretos_pct ?? 0),
      custoFinanceiro: Number(estudo.custo_financeiro ?? 0),
      comissaoVendaPct: Number(estudo.comissao_venda_pct ?? 0),
      impostoVendaPct: Number(estudo.imposto_venda_pct ?? 0),
      distratosPct: Number(estudo.distratos_pct ?? 0),
    });
  }, [estudo, programas, cubM2, itbiSelecionado]);

  const fluxoInput = fluxo.map((f) => ({
    periodo: f.periodo,
    entradas: Number(f.entradas),
    saidas: Number(f.saidas),
  }));
  const taxaMensal = tmaMensal(Number(estudo.tma_pct ?? 12));
  const vpl = fluxo.length > 0 ? calcVPL(fluxoInput, taxaMensal) : null;
  const tirAnual = fluxo.length > 0 ? calcTIRAnualPct(fluxoInput) : null;
  const payback = fluxo.length > 0 ? calcPaybackSimples(fluxoInput) : null;
  const exposicao = fluxo.length > 0 ? calcExposicaoMaxima(fluxoInput) : 0;
  const serie = saldoAcumulado(fluxoInput);

  const tirViavel =
    tirAnual != null && tirAnual > Number(estudo.tma_pct ?? 12);

  async function handleAddPeriodo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await upsertFluxo({
        estudo_id: estudo.id,
        periodo: Number(fd.get("periodo") ?? 0),
        entradas: fd.get("entradas") ? Number(fd.get("entradas")) : 0,
        saidas: fd.get("saidas") ? Number(fd.get("saidas")) : 0,
      });
      toast.success("Período salvo");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePeriodo(id: string) {
    try {
      await deleteFluxoPeriodo(id, estudo.id);
      toast.success("Período removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      {/* Demonstrativo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard label="VGV" value={formatBRL(demo.vgv)} variant="primary" />
        <KPICard label="Receita líquida" value={formatBRL(demo.receitaLiquida)} />
        <KPICard label="Custo total" value={formatBRL(demo.custoTotal)} />
        <KPICard
          label="Lucro"
          value={formatBRL(demo.lucro)}
          variant={demo.lucro >= 0 ? "success" : "destructive"}
        />
        <KPICard
          label="Margem / VGV"
          value={formatPercent(demo.margemVgvPct, 1)}
          variant={demo.margemVgvPct >= 15 ? "success" : "warning"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demonstrativo de resultado</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableBody>
              <LinhaDemo label="VGV (Valor Geral de Vendas)" valor={demo.vgv} forte />
              <LinhaDemo label="(–) Deduções de venda (comissão, impostos, distratos)" valor={-demo.deducoesVenda} />
              <LinhaDemo label="(=) Receita líquida" valor={demo.receitaLiquida} forte />
              <LinhaDemo label="(–) Custo direto (terreno+ITBI+obra+infra)" valor={-demo.custoDireto} />
              <LinhaDemo label="(–) Custos indiretos" valor={-demo.custosIndiretos} />
              <LinhaDemo label="(=) Lucro" valor={demo.lucro} forte destaque />
              <TableRow>
                <TableCell className="text-muted-foreground">ROI sobre custo total</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatPercent(demo.roiPct, 1)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Indicadores de fluxo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="TIR (a.a.)"
          value={tirAnual != null ? formatPercent(tirAnual, 1) : "—"}
          hint={
            tirAnual != null
              ? tirViavel
                ? `acima da TMA (${estudo.tma_pct ?? 12}%)`
                : `abaixo da TMA (${estudo.tma_pct ?? 12}%)`
              : "preencha o fluxo"
          }
          variant={tirAnual == null ? "default" : tirViavel ? "success" : "warning"}
        />
        <KPICard
          label="VPL"
          value={vpl != null ? formatBRL(vpl) : "—"}
          variant={vpl != null && vpl >= 0 ? "success" : "default"}
        />
        <KPICard
          label="Payback simples"
          value={payback != null ? `${payback} mês(es)` : "—"}
        />
        <KPICard
          label="Exposição máx. de caixa"
          value={formatBRL(exposicao)}
          hint="capital próprio necessário"
          variant="accent"
        />
      </div>

      {/* Fluxo de caixa */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fluxo de caixa mensal</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Período
          </Button>
        </CardHeader>
        <CardContent>
          {fluxo.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Adicione períodos (mês 0, 1, 2…) com entradas (vendas) e saídas
              (terreno, obra) para calcular TIR, VPL, payback e exposição de caixa.
            </p>
          ) : (
            <>
              <div className="mb-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serie}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                    <Line type="monotone" dataKey="saldo" name="Caixa acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fluxo.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">Mês {f.periodo}</TableCell>
                      <TableCell className="text-right text-success">
                        {formatBRL(f.entradas)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {formatBRL(f.saidas)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatBRL(Number(f.entradas) - Number(f.saidas))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeletePeriodo(f.id)}
                          aria-label="Excluir período"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {tirAnual == null && fluxo.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
          <TrendingUp className="h-4 w-4" />
          Não foi possível calcular a TIR (o fluxo não troca de sinal). Ajuste
          entradas/saídas para ter ao menos um período negativo e um positivo.
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Período do fluxo de caixa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPeriodo} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="periodo">Mês (0, 1, 2…) *</Label>
              <Input id="periodo" name="periodo" type="number" min="0" required />
              <p className="text-[10px] text-muted-foreground">
                Reusar um mês existente atualiza os valores dele.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entradas">Entradas (R$)</Label>
                <Input id="entradas" name="entradas" type="number" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saidas">Saídas (R$)</Label>
                <Input id="saidas" name="saidas" type="number" step="0.01" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinhaDemo({
  label,
  valor,
  forte,
  destaque,
}: {
  label: string;
  valor: number;
  forte?: boolean;
  destaque?: boolean;
}) {
  return (
    <TableRow className={destaque ? "bg-muted/30" : ""}>
      <TableCell className={forte ? "font-semibold" : "text-muted-foreground"}>
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
