"use client";

import * as React from "react";
import { Plus, Trash2, Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
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
import { FileUpload } from "@/components/file-upload";
import { KPICard } from "@/components/kpi-card";
import {
  addLancamentoMaterial,
  deleteLancamento,
} from "@/lib/actions/materiais";
import { formatBRL, formatDateBR } from "@/lib/utils";
import type {
  FaseObra,
  Fornecedor,
  LancamentoMaterial,
  Lote,
} from "@/lib/supabase/types";

interface Props {
  lote: Lote;
  materiais: LancamentoMaterial[];
  fases: FaseObra[];
  fornecedores: Fornecedor[];
}

export function MateriaisTab({ lote, materiais, fases, fornecedores }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [tipo, setTipo] = React.useState<"entrada" | "saida">("entrada");
  const [filtroTipo, setFiltroTipo] = React.useState<"todos" | "entrada" | "saida">("todos");
  const [nfUrl, setNfUrl] = React.useState<string | null>(null);

  const filtrados = React.useMemo(() => {
    if (filtroTipo === "todos") return materiais;
    return materiais.filter((m) => m.tipo === filtroTipo);
  }, [materiais, filtroTipo]);

  const totalEntradas = materiais
    .filter((m) => m.tipo === "entrada")
    .reduce((s, m) => s + Number(m.valor_total), 0);
  const totalSaidas = materiais
    .filter((m) => m.tipo === "saida")
    .reduce((s, m) => s + Number(m.valor_total), 0);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const quantidade = Number(fd.get("quantidade"));
      const valorUnit = fd.get("valor_unitario")
        ? Number(fd.get("valor_unitario"))
        : null;
      const valorTotal = fd.get("valor_total")
        ? Number(fd.get("valor_total"))
        : valorUnit && quantidade
          ? valorUnit * quantidade
          : 0;
      await addLancamentoMaterial({
        lote_id: lote.id,
        fase_id: (fd.get("fase_id") as string) || null,
        tipo,
        data: (fd.get("data") as string) ?? new Date().toISOString().slice(0, 10),
        material: String(fd.get("material") ?? ""),
        quantidade,
        unidade: (fd.get("unidade") as string) || null,
        valor_unitario: valorUnit,
        valor_total: valorTotal,
        fornecedor_id: (fd.get("fornecedor_id") as string) || null,
        nota_fiscal_numero: (fd.get("nota_fiscal_numero") as string) || null,
        nota_fiscal_url: nfUrl,
        observacao: (fd.get("observacao") as string) || null,
      });
      toast.success("Lançamento adicionado");
      setOpen(false);
      setNfUrl(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    try {
      await deleteLancamento(id, lote.id);
      toast.success("Lançamento removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KPICard
          label="Entradas"
          value={formatBRL(totalEntradas)}
          icon={<ArrowDownToLine className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          label="Saídas"
          value={formatBRL(totalSaidas)}
          icon={<ArrowUpFromLine className="h-5 w-5" />}
          variant="destructive"
        />
        <KPICard
          label="Saldo"
          value={formatBRL(totalEntradas - totalSaidas)}
          variant={totalEntradas - totalSaidas >= 0 ? "default" : "warning"}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Lançamentos</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)}
              className="h-8 w-auto text-xs"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </Select>
            <Button
              size="sm"
              onClick={() => {
                setTipo("entrada");
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo lançamento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {filtrados.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Nenhum lançamento ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Vlr unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((m) => {
                  const forn = fornecedores.find((f) => f.id === m.fornecedor_id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs">
                        {formatDateBR(m.data)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={m.tipo === "entrada" ? "success" : "warning"}
                        >
                          {m.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{m.material}</p>
                        {forn && (
                          <p className="text-[10px] text-muted-foreground">
                            {forn.nome_fantasia ?? forn.razao_social}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.quantidade} {m.unidade ?? ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.valor_unitario ? formatBRL(m.valor_unitario) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(m.valor_total)}
                      </TableCell>
                      <TableCell>
                        {m.nota_fiscal_url ? (
                          <a
                            href={m.nota_fiscal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {m.nota_fiscal_numero ?? "Ver NF"}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {m.nota_fiscal_numero ?? "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(m.id)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo lançamento de material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as "entrada" | "saida")}
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="material">Material *</Label>
              <Input
                id="material"
                name="material"
                required
                placeholder="Ex: Cimento CPII"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  name="unidade"
                  placeholder="kg, m³, un…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor_unitario">Vlr unitário</Label>
                <Input
                  id="valor_unitario"
                  name="valor_unitario"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="valor_total">Valor total</Label>
                <Input
                  id="valor_total"
                  name="valor_total"
                  type="number"
                  step="0.01"
                  placeholder="Auto se vazio"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fase_id">Fase</Label>
                <Select id="fase_id" name="fase_id">
                  <option value="">—</option>
                  {fases.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fornecedor_id">Fornecedor</Label>
                <Select id="fornecedor_id" name="fornecedor_id">
                  <option value="">—</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome_fantasia ?? f.razao_social}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nota_fiscal_numero">Nº da Nota Fiscal</Label>
                <Input
                  id="nota_fiscal_numero"
                  name="nota_fiscal_numero"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Anexar NF (opcional)</Label>
              <FileUpload
                bucket="notas-fiscais"
                value={nfUrl}
                onChange={setNfUrl}
                pathPrefix={lote.id}
                accept=".pdf,image/*"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea id="observacao" name="observacao" rows={2} />
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
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
