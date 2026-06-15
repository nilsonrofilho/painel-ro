"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addAporte, deleteAporte } from "@/lib/actions/investidores";
import { formatBRL } from "@/lib/utils";
import type { AporteDoLote } from "@/lib/queries";
import type { Investidor } from "@/lib/supabase/types";

function retorno(a: {
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
  loteId: string;
  aportes: AporteDoLote[];
  investidores: Investidor[];
}

export function InvestidoresCard({ loteId, aportes, investidores }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Investidores que ainda não têm aporte neste lote
  const disponiveis = investidores.filter(
    (i) => !aportes.some((a) => a.investidor_id === i.id),
  );

  const totalInvestido = aportes.reduce((s, a) => s + a.valor_investido, 0);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await addAporte({
        investidor_id: String(fd.get("investidor_id") ?? ""),
        lote_id: loteId,
        valor_investido: Number(fd.get("valor_investido") ?? 0),
        retorno_pct: fd.get("retorno_pct")
          ? Number(fd.get("retorno_pct"))
          : null,
        retorno_valor: fd.get("retorno_valor")
          ? Number(fd.get("retorno_valor"))
          : null,
        data_aporte: (fd.get("data_aporte") as string) || null,
        observacao: null,
      });
      toast.success("Investidor vinculado");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(aporteId: string, investidorId: string) {
    if (!confirm("Desvincular este investidor do lote?")) return;
    try {
      // deleteAporte revalida o painel do investidor; revalidação do lote
      // acontece naturalmente ao recarregar a página do lote.
      await deleteAporte(aporteId, investidorId);
      toast.success("Investidor desvinculado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Investidores
          {aportes.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({aportes.length})
            </span>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={investidores.length === 0}
        >
          <Plus className="h-4 w-4" />
          Vincular
        </Button>
      </CardHeader>
      <CardContent>
        {aportes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {investidores.length === 0
              ? "Cadastre investidores para vinculá-los a este lote."
              : "Nenhum investidor vinculado a este lote ainda."}
          </p>
        ) : (
          <div className="space-y-2">
            {aportes.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/investidores/${a.investidor_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {a.investidor_nome}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Investido: {formatBRL(a.valor_investido)} · Retorno proj.:{" "}
                    <span className="text-success">{formatBRL(retorno(a))}</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(a.id, a.investidor_id)}
                  aria-label="Desvincular"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 text-sm font-semibold">
              <span>Total investido no lote</span>
              <span>{formatBRL(totalInvestido)}</span>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular investidor a este lote</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="investidor_id">Investidor *</Label>
              <Select id="investidor_id" name="investidor_id" required>
                <option value="">Selecione…</option>
                {disponiveis.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </Select>
              {disponiveis.length === 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Todos os investidores já estão vinculados a este lote.
                </p>
              )}
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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_aporte">Data do aporte</Label>
                <Input id="data_aporte" name="data_aporte" type="date" />
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
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="retorno_valor">Retorno em R$</Label>
                <Input
                  id="retorno_valor"
                  name="retorno_valor"
                  type="number"
                  step="0.01"
                />
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
              <Button type="submit" disabled={submitting || disponiveis.length === 0}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Vincular
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
