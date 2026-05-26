"use client";

import * as React from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
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
import {
  addFornecedorPreco,
  deleteFornecedorPreco,
} from "@/lib/actions/fornecedores";
import { formatBRL, formatDateBR } from "@/lib/utils";
import type { FornecedorPreco } from "@/lib/supabase/types";

interface Props {
  fornecedorId: string;
  precos: FornecedorPreco[];
}

export function PrecosManager({ fornecedorId, precos }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await addFornecedorPreco({
        fornecedor_id: fornecedorId,
        material: String(fd.get("material") ?? ""),
        unidade: (fd.get("unidade") as string) || null,
        preco: Number(fd.get("preco")),
      });
      toast.success("Preço adicionado");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este preço?")) return;
    try {
      await deleteFornecedorPreco(id, fornecedorId);
      toast.success("Preço excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Tabela de preços ({precos.length})
        </CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo preço
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {precos.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            Nenhum preço cadastrado. Adicione materiais com seus valores para consulta rápida.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {precos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.material}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.unidade ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatBRL(p.preco)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateBR(p.atualizado_em)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id)}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo preço</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="material">Material *</Label>
              <Input
                id="material"
                name="material"
                required
                placeholder="Ex: Cimento CPII 50kg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unidade">Unidade</Label>
                <Input id="unidade" name="unidade" placeholder="saco, m³, un" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preco">Preço (R$) *</Label>
                <Input
                  id="preco"
                  name="preco"
                  type="number"
                  step="0.01"
                  required
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
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
