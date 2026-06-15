"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  addFasePadrao,
  updateFasePadrao,
  deleteFasePadrao,
} from "@/lib/actions/fases-padrao";
import type { FasePadraoConfig } from "@/lib/supabase/types";

interface Props {
  fases: FasePadraoConfig[];
}

export function FasesPadraoTab({ fases }: Props) {
  const [open, setOpen] = React.useState(false);
  const [editando, setEditando] = React.useState<FasePadraoConfig | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const totalDias = fases.reduce((s, f) => s + (f.duracao_dias ?? 0), 0);

  function abrirNovo() {
    setEditando(null);
    setOpen(true);
  }
  function abrirEdicao(f: FasePadraoConfig) {
    setEditando(f);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const payload = {
        nome: String(fd.get("nome") ?? "").trim(),
        ordem: Number(fd.get("ordem") ?? 0),
        duracao_dias: Number(fd.get("duracao_dias") ?? 15),
      };
      if (editando) {
        await updateFasePadrao(editando.id, payload);
        toast.success("Fase padrão atualizada");
      } else {
        await addFasePadrao(payload);
        toast.success("Fase padrão adicionada");
      }
      setOpen(false);
      setEditando(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmId) return;
    try {
      await deleteFasePadrao(confirmId);
      toast.success("Fase padrão removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Fases padrão da obra</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Modelo aplicado ao usar &quot;fases padrão&quot; e ao duplicar
            lotes. Total: {fases.length} fases · {totalDias} dias.
          </p>
        </div>
        <Button size="sm" onClick={abrirNovo}>
          <Plus className="h-4 w-4" />
          Nova fase
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {fases.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            Nenhuma fase padrão configurada. Adicione as fases do seu fluxo de
            obra (ou rode a migration 0015 para popular as 8 padrão).
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Ordem</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead className="text-right">Duração (dias)</TableHead>
                <TableHead className="w-20 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...fases]
                .sort((a, b) => a.ordem - b.ordem)
                .map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <GripVertical className="h-3.5 w-3.5 opacity-40" />
                        {f.ordem}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell className="text-right">
                      {f.duracao_dias}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => abrirEdicao(f)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmId(f.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar fase padrão" : "Nova fase padrão"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            key={editando?.id ?? "novo"}
          >
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                name="nome"
                required
                placeholder="Ex: Fundação"
                defaultValue={editando?.nome ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  name="ordem"
                  type="number"
                  min="0"
                  defaultValue={editando?.ordem ?? fases.length + 1}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duracao_dias">Duração (dias)</Label>
                <Input
                  id="duracao_dias"
                  name="duracao_dias"
                  type="number"
                  min="0"
                  defaultValue={editando?.duracao_dias ?? 15}
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
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        onOpenChange={(o) => !o && setConfirmId(null)}
        title="Excluir fase padrão?"
        description="Não afeta os lotes já criados — só muda o modelo aplicado daqui pra frente."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
      />
    </Card>
  );
}
