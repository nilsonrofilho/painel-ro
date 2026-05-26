"use client";

import * as React from "react";
import Link from "next/link";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { addAlocacao, deleteAlocacao } from "@/lib/actions/funcionarios";
import { formatBRL, formatDateBR } from "@/lib/utils";
import type { Alocacao, Funcionario, Lote } from "@/lib/supabase/types";

interface Props {
  lote: Lote;
  alocacoes: Alocacao[];
  funcionarios: Funcionario[];
}

export function MaoDeObraTab({ lote, alocacoes, funcionarios }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const totalPago = alocacoes.reduce(
    (s, a) => s + Number(a.valor_pago ?? 0),
    0,
  );
  const ativos = alocacoes.filter((a) => !a.data_fim).length;

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await addAlocacao({
        lote_id: lote.id,
        funcionario_id: String(fd.get("funcionario_id") ?? ""),
        funcao_no_lote: (fd.get("funcao_no_lote") as string) || null,
        data_inicio: (fd.get("data_inicio") as string) || null,
        data_fim: (fd.get("data_fim") as string) || null,
        valor_pago: fd.get("valor_pago") ? Number(fd.get("valor_pago")) : null,
        observacao: (fd.get("observacao") as string) || null,
      });
      toast.success("Alocação criada");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta alocação?")) return;
    try {
      await deleteAlocacao(id, lote.id);
      toast.success("Alocação removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KPICard label="Alocações ativas" value={ativos} variant="warning" />
        <KPICard label="Total de alocações" value={alocacoes.length} />
        <KPICard
          label="Total pago"
          value={formatBRL(totalPago)}
          variant="primary"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Funcionários alocados</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/funcionarios">Gerenciar funcionários</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              disabled={funcionarios.length === 0}
            >
              <Plus className="h-4 w-4" />
              Nova alocação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {funcionarios.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Cadastre funcionários antes de criar alocações.
            </p>
          ) : alocacoes.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Nenhuma alocação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {alocacoes.map((a) => {
                  const f = funcionarios.find((x) => x.id === a.funcionario_id);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          href={`/funcionarios/${a.funcionario_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {f?.nome ?? "—"}
                        </Link>
                        {f?.funcao && (
                          <p className="text-[10px] text-muted-foreground">
                            {f.funcao}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.funcao_no_lote ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateBR(a.data_inicio)} → {formatDateBR(a.data_fim)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatBRL(Number(a.valor_pago ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(a.id)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova alocação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="funcionario_id">Funcionário *</Label>
              <Select id="funcionario_id" name="funcionario_id" required>
                <option value="">Selecione…</option>
                {funcionarios
                  .filter((f) => f.status === "ativo")
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} {f.funcao ? `— ${f.funcao}` : ""}
                    </option>
                  ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="funcao_no_lote">Função no lote</Label>
              <Input
                id="funcao_no_lote"
                name="funcao_no_lote"
                placeholder="Ex: Pedreiro chefe"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data_inicio">Início</Label>
                <Input id="data_inicio" name="data_inicio" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_fim">Fim</Label>
                <Input id="data_fim" name="data_fim" type="date" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor_pago">Valor pago (R$)</Label>
              <Input
                id="valor_pago"
                name="valor_pago"
                type="number"
                step="0.01"
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
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
