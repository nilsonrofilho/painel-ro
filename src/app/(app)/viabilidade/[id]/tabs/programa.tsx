"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, Boxes } from "lucide-react";
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
  addPrograma,
  updatePrograma,
  deletePrograma,
} from "@/lib/actions/viabilidade";
import { vgvUnidade, calcVGV } from "@/lib/viabilidade";
import { TIPO_UNIDADE } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import type {
  EstudoViabilidade,
  ViabilidadePrograma,
} from "@/lib/supabase/types";

interface Props {
  estudo: EstudoViabilidade;
  programas: ViabilidadePrograma[];
}

export function ProgramaTab({ estudo, programas }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editing, setEditing] = React.useState<ViabilidadePrograma | null>(null);

  const vgvTotal = React.useMemo(() => calcVGV(programas), [programas]);
  const areaConstruidaTotal = React.useMemo(
    () =>
      programas.reduce(
        (s, p) => s + Number(p.quantidade) * Number(p.area_construida_m2 ?? 0),
        0,
      ),
    [programas],
  );
  const areaPrivativaTotal = React.useMemo(
    () =>
      programas.reduce(
        (s, p) => s + Number(p.quantidade) * Number(p.area_privativa_m2 ?? 0),
        0,
      ),
    [programas],
  );
  const unidadesTotal = programas.reduce(
    (s, p) => s + Number(p.quantidade),
    0,
  );

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: ViabilidadePrograma) {
    setEditing(p);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const payload = {
        estudo_id: estudo.id,
        tipo_unidade: String(fd.get("tipo_unidade") ?? ""),
        descricao: (fd.get("descricao") as string) || null,
        quantidade: Number(fd.get("quantidade") ?? 1),
        area_privativa_m2: fd.get("area_privativa_m2")
          ? Number(fd.get("area_privativa_m2"))
          : null,
        area_construida_m2: fd.get("area_construida_m2")
          ? Number(fd.get("area_construida_m2"))
          : null,
        preco_m2_venda: fd.get("preco_m2_venda")
          ? Number(fd.get("preco_m2_venda"))
          : null,
        valor_venda_unitario: fd.get("valor_venda_unitario")
          ? Number(fd.get("valor_venda_unitario"))
          : null,
        ordem: editing ? editing.ordem : programas.length + 1,
      };
      if (editing) {
        await updatePrograma(editing.id, estudo.id, payload);
        toast.success("Unidade atualizada");
      } else {
        await addPrograma(payload);
        toast.success("Unidade adicionada");
      }
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta unidade?")) return;
    try {
      await deletePrograma(id, estudo.id);
      toast.success("Unidade removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="VGV total" value={formatBRL(vgvTotal)} variant="primary" />
        <KPICard label="Unidades" value={unidadesTotal} />
        <KPICard
          label="Área construída"
          value={`${areaConstruidaTotal.toFixed(0)} m²`}
        />
        <KPICard
          label="Área privativa"
          value={`${areaPrivativaTotal.toFixed(0)} m²`}
          variant="success"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Programa de unidades</CardTitle>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nova unidade
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {programas.length === 0 ? (
            <EmptyState
              icon={<Boxes className="h-7 w-7" />}
              title="Nenhuma unidade no programa"
              description="Adicione os tipos de unidade (lotes, casas, apês) com área e preço para calcular o VGV."
              action={
                <Button size="sm" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Adicionar unidade
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Priv. (m²)</TableHead>
                  <TableHead className="text-right">Constr. (m²)</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Subtotal VGV</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.tipo_unidade}</p>
                      {p.descricao && (
                        <p className="text-[10px] text-muted-foreground">
                          {p.descricao}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{p.quantidade}</TableCell>
                    <TableCell className="text-right">
                      {p.area_privativa_m2 ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.area_construida_m2 ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {p.valor_venda_unitario
                        ? `${formatBRL(p.valor_venda_unitario)}/un`
                        : p.preco_m2_venda
                          ? `${formatBRL(p.preco_m2_venda)}/m²`
                          : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatBRL(vgvUnidade(p))}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(p)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(p.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 bg-muted/30 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{unidadesTotal}</TableCell>
                  <TableCell className="text-right">
                    {areaPrivativaTotal.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {areaConstruidaTotal.toFixed(0)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right text-primary">
                    {formatBRL(vgvTotal)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar unidade" : "Nova unidade"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            key={editing?.id ?? "novo"}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tipo_unidade">Tipo *</Label>
                <Select
                  id="tipo_unidade"
                  name="tipo_unidade"
                  required
                  defaultValue={editing?.tipo_unidade ?? "Lote"}
                >
                  {TIPO_UNIDADE.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  name="quantidade"
                  type="number"
                  min="1"
                  required
                  defaultValue={editing?.quantidade ?? 1}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                name="descricao"
                placeholder="Ex: Lote 200m² padrão"
                defaultValue={editing?.descricao ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="area_privativa_m2">Área privativa (m²)</Label>
                <Input
                  id="area_privativa_m2"
                  name="area_privativa_m2"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.area_privativa_m2 ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="area_construida_m2">Área construída (m²)</Label>
                <Input
                  id="area_construida_m2"
                  name="area_construida_m2"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.area_construida_m2 ?? ""}
                />
                <p className="text-[10px] text-muted-foreground">
                  Base do custo de obra (CUB).
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="preco_m2_venda">Preço de venda / m²</Label>
                <Input
                  id="preco_m2_venda"
                  name="preco_m2_venda"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.preco_m2_venda ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor_venda_unitario">Valor por unidade</Label>
                <Input
                  id="valor_venda_unitario"
                  name="valor_venda_unitario"
                  type="number"
                  step="0.01"
                  defaultValue={editing?.valor_venda_unitario ?? ""}
                />
                <p className="text-[10px] text-muted-foreground">
                  Se preenchido, tem prioridade sobre preço/m².
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={close}
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
