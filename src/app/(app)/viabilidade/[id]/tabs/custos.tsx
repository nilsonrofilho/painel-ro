"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
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
import {
  addCustoItbi,
  deleteCustoItbi,
  selecionarCidadeItbi,
  updateViabilidade,
} from "@/lib/actions/viabilidade";
import {
  calcITBI,
  calcCustoAquisicao,
  calcCustoObra,
} from "@/lib/viabilidade";
import { formatBRL } from "@/lib/utils";
import type {
  EstudoViabilidade,
  ViabilidadeCustosItbi,
  ViabilidadePrograma,
  MunicipioParametros,
} from "@/lib/supabase/types";

interface Props {
  estudo: EstudoViabilidade;
  custos: ViabilidadeCustosItbi[];
  programas: ViabilidadePrograma[];
  municipios: MunicipioParametros[];
  cubM2: number;
}

const PIE_COLORS = [
  "hsl(220, 79%, 45%)",
  "hsl(5, 64%, 48%)",
  "hsl(160, 64%, 42%)",
  "hsl(35, 90%, 52%)",
  "hsl(217, 16%, 55%)",
];

export function CustosTab({
  estudo,
  custos,
  programas,
  municipios,
  cubM2,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [savingCub, setSavingCub] = React.useState(false);

  const cidadeSelecionada = custos.find((c) => c.selecionado);
  const itbiSelecionado = cidadeSelecionada?.valor_estimado ?? 0;

  const custoAquisicao = calcCustoAquisicao({
    custoTerreno: Number(estudo.custo_terreno ?? 0),
    itbiValor: itbiSelecionado,
    outorgaValor: Number(estudo.outorga_valor ?? 0),
    custosCartorio: Number(estudo.custos_cartorio ?? 0),
  });

  const custoObra = calcCustoObra(
    programas,
    cubM2,
    Number(estudo.bdi_pct ?? 0),
  );

  const composicao = [
    { nome: "Terreno", valor: Number(estudo.custo_terreno ?? 0) },
    { nome: "ITBI", valor: itbiSelecionado },
    { nome: "Outorga", valor: Number(estudo.outorga_valor ?? 0) },
    { nome: "Cartório", valor: Number(estudo.custos_cartorio ?? 0) },
    { nome: "Obra", valor: custoObra },
    { nome: "Infraestrutura", valor: Number(estudo.custo_infraestrutura ?? 0) },
  ].filter((c) => c.valor > 0);

  const barData = custos.map((c) => ({
    cidade: c.cidade,
    itbi: Number(c.valor_estimado),
  }));

  async function handleAddCidade(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const munId = (fd.get("municipio_id") as string) || null;
      const mun = municipios.find((m) => m.id === munId);
      const cidade = mun?.municipio ?? (fd.get("cidade") as string) ?? "";
      const aliquota = fd.get("aliquota_pct")
        ? Number(fd.get("aliquota_pct"))
        : (mun?.itbi_aliquota_pct ?? 2);

      const { baseCalculo, valor } = calcITBI({
        base: mun?.itbi_base ?? "maior_entre",
        custoTerreno: Number(estudo.custo_terreno ?? 0),
        valorVenalReferencia: estudo.valor_venal_referencia,
        aliquotaPct: aliquota,
      });

      await addCustoItbi({
        estudo_id: estudo.id,
        municipio_id: munId,
        cidade,
        estado: mun?.estado ?? estudo.estado ?? null,
        aliquota_pct: aliquota,
        base_calculo: baseCalculo,
        valor_estimado: valor,
        selecionado: custos.length === 0,
      });
      toast.success("Cidade adicionada");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSelecionar(id: string) {
    try {
      await selecionarCidadeItbi(id, estudo.id);
      toast.success("Cidade selecionada para o estudo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCustoItbi(id, estudo.id);
      toast.success("Removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleSaveCustos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSavingCub(true);
    try {
      await updateViabilidade(estudo.id, {
        outorga_valor: fd.get("outorga_valor")
          ? Number(fd.get("outorga_valor"))
          : null,
        custos_cartorio: fd.get("custos_cartorio")
          ? Number(fd.get("custos_cartorio"))
          : null,
        custo_infraestrutura: fd.get("custo_infraestrutura")
          ? Number(fd.get("custo_infraestrutura"))
          : null,
        bdi_pct: fd.get("bdi_pct") ? Number(fd.get("bdi_pct")) : null,
        cub_valor_m2: fd.get("cub_valor_m2")
          ? Number(fd.get("cub_valor_m2"))
          : null,
      });
      toast.success("Custos atualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSavingCub(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Custo de aquisição"
          value={formatBRL(custoAquisicao)}
          variant="primary"
        />
        <KPICard label="Custo de obra" value={formatBRL(custoObra)} />
        <KPICard
          label="Infraestrutura"
          value={formatBRL(Number(estudo.custo_infraestrutura ?? 0))}
        />
        <KPICard
          label="ITBI (cidade selec.)"
          value={formatBRL(itbiSelecionado)}
          variant="accent"
        />
      </div>

      {/* ITBI por cidade */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">ITBI por cidade</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar cidade
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {custos.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Adicione cidades para comparar o ITBI e escolher a base do estudo.
              A alíquota vem do catálogo de Parâmetros, mas é editável.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Alíquota</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">ITBI estimado</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {custos.map((c) => (
                  <TableRow
                    key={c.id}
                    className={c.selecionado ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleSelecionar(c.id)}
                        aria-label="Selecionar cidade"
                      >
                        {c.selecionado ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {c.cidade}
                      {c.selecionado && (
                        <Badge variant="default" className="ml-2">
                          Selecionada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.aliquota_pct}%
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {formatBRL(c.base_calculo)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatBRL(c.valor_estimado)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(c.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        {barData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ITBI por cidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="cidade" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="itbi" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        {composicao.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Composição de custos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={composicao}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="valor"
                      nameKey="nome"
                    >
                      {composicao.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Demais custos editáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" />
            Outros custos & CUB
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCustos} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="outorga_valor">Outorga onerosa (R$)</Label>
                <Input id="outorga_valor" name="outorga_valor" type="number" step="0.01" defaultValue={estudo.outorga_valor ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custos_cartorio">Cartório/registro (R$)</Label>
                <Input id="custos_cartorio" name="custos_cartorio" type="number" step="0.01" defaultValue={estudo.custos_cartorio ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custo_infraestrutura">Infraestrutura (R$)</Label>
                <Input id="custo_infraestrutura" name="custo_infraestrutura" type="number" step="0.01" defaultValue={estudo.custo_infraestrutura ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cub_valor_m2">CUB (R$/m²)</Label>
                <Input id="cub_valor_m2" name="cub_valor_m2" type="number" step="0.01" defaultValue={estudo.cub_valor_m2 ?? cubM2 ?? ""} placeholder={cubM2 ? String(cubM2) : ""} />
                <p className="text-[10px] text-muted-foreground">
                  Vazio = usa o CUB vigente do catálogo ({cubM2 ? formatBRL(cubM2) : "não definido"}).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bdi_pct">BDI (%)</Label>
                <Input id="bdi_pct" name="bdi_pct" type="number" step="0.01" defaultValue={estudo.bdi_pct ?? ""} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingCub}>
                {savingCub && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar custos
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal adicionar cidade */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar cidade (ITBI)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCidade} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="municipio_id">Cidade do catálogo</Label>
              <Select id="municipio_id" name="municipio_id" defaultValue="">
                <option value="">— digitar manualmente —</option>
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.municipio} / {m.estado} — ITBI {m.itbi_aliquota_pct}%
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cidade">Cidade (se manual)</Label>
                <Input id="cidade" name="cidade" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aliquota_pct">Alíquota (%)</Label>
                <Input id="aliquota_pct" name="aliquota_pct" type="number" step="0.01" placeholder="Auto do catálogo" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              ITBI calculado sobre {estudo.valor_venal_referencia ? "o maior entre custo do terreno e valor venal" : "o custo do terreno"}.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
