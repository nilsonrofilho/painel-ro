"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil, ShoppingCart, X } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  reservarLote,
  venderLote,
  updateVenda,
  cancelarVenda,
} from "@/lib/actions/vendas";
import { formatBRL, formatDateBR } from "@/lib/utils";
import type { Corretor, Lote, Venda } from "@/lib/supabase/types";

const schema = z.object({
  cliente_nome: z.string().min(1, "Informe o nome"),
  cliente_cpf: z.string().optional(),
  cliente_telefone: z.string().optional(),
  cliente_email: z.string().optional(),
  corretor_id: z.string().optional(),
  comissao_pct: z.string().optional(),
  valor: z.string().optional(),
  valor_sinal: z.string().optional(),
  forma_pagamento: z.string().optional(),
  data: z.string().optional(),
  observacao: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  lote: Lote;
  vendas: Venda[];
  corretores: Corretor[];
}

export function VendaTab({ lote, vendas, corretores }: Props) {
  const [open, setOpen] = React.useState<"reserva" | "venda" | null>(null);
  const [editing, setEditing] = React.useState<Venda | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const vendaAtiva = vendas.find((v) => v.status === "ativa");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_nome: "",
      data: new Date().toISOString().slice(0, 10),
      valor: lote.valor_venda?.toString() ?? "",
    },
  });

  function openModal(tipo: "reserva" | "venda") {
    setEditing(null);
    reset({
      cliente_nome: "",
      cliente_cpf: "",
      cliente_telefone: "",
      cliente_email: "",
      corretor_id: "",
      comissao_pct: "",
      valor: tipo === "venda" ? lote.valor_venda?.toString() ?? "" : "",
      valor_sinal: "",
      forma_pagamento: "",
      data: new Date().toISOString().slice(0, 10),
      observacao: "",
    });
    setOpen(tipo);
  }

  function openEdit(v: Venda) {
    setEditing(v);
    reset({
      cliente_nome: v.cliente_nome ?? "",
      cliente_cpf: v.cliente_cpf ?? "",
      cliente_telefone: v.cliente_telefone ?? "",
      cliente_email: v.cliente_email ?? "",
      corretor_id: v.corretor_id ?? "",
      comissao_pct: v.comissao_pct?.toString() ?? "",
      valor: v.valor?.toString() ?? "",
      valor_sinal: v.valor_sinal?.toString() ?? "",
      forma_pagamento: v.forma_pagamento ?? "",
      data: v.data ?? new Date().toISOString().slice(0, 10),
      observacao: v.observacao ?? "",
    });
    setOpen(v.tipo);
  }

  function closeModal() {
    setOpen(null);
    setEditing(null);
  }

  async function onSubmit(values: FormValues) {
    if (!open) return;
    setSubmitting(true);
    try {
      const corretor = corretores.find((c) => c.id === values.corretor_id);
      const pct = values.comissao_pct
        ? Number(values.comissao_pct)
        : corretor?.comissao_padrao_pct
          ? Number(corretor.comissao_padrao_pct)
          : null;
      const valor = values.valor ? Number(values.valor) : null;
      const comissaoValor = pct != null && valor != null
        ? (valor * pct) / 100
        : null;

      const payload = {
        lote_id: lote.id,
        tipo: open,
        cliente_nome: values.cliente_nome || null,
        cliente_cpf: values.cliente_cpf || null,
        cliente_telefone: values.cliente_telefone || null,
        cliente_email: values.cliente_email || null,
        corretor_id: values.corretor_id || null,
        comissao_pct: pct,
        comissao_valor: comissaoValor,
        valor,
        valor_sinal: values.valor_sinal ? Number(values.valor_sinal) : null,
        forma_pagamento: values.forma_pagamento || null,
        data: values.data || null,
        observacao: values.observacao || null,
      };

      if (editing) {
        // edição: não troca tipo nem cria novo registro
        const { lote_id: _l, tipo: _t, ...patch } = payload;
        void _l;
        void _t;
        await updateVenda(editing.id, patch);
        toast.success(
          editing.tipo === "venda" ? "Venda atualizada" : "Reserva atualizada",
        );
      } else if (open === "reserva") {
        await reservarLote(payload);
        toast.success("Lote reservado");
      } else {
        await venderLote(payload);
        toast.success("Venda registrada");
      }
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(vendaId: string) {
    try {
      await cancelarVenda(vendaId);
      toast.success("Registro cancelado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      {/* Ações */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Status atual
            </p>
            <p className="mt-1 text-lg font-bold">
              {lote.status === "disponivel"
                ? "Disponível para venda"
                : lote.status === "reservado"
                  ? "Reservado"
                  : "Vendido"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => openModal("reserva")}
              disabled={lote.status === "vendido"}
            >
              <ShoppingCart className="h-4 w-4" />
              Reservar
            </Button>
            <Button
              variant="accent"
              onClick={() => openModal("venda")}
              disabled={lote.status === "vendido"}
            >
              <ShoppingCart className="h-4 w-4" />
              Vender
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reserva/venda ativa */}
      {vendaAtiva && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {vendaAtiva.tipo === "venda" ? "Venda ativa" : "Reserva ativa"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Cliente" value={vendaAtiva.cliente_nome ?? "—"} />
              <Info label="CPF" value={vendaAtiva.cliente_cpf ?? "—"} />
              <Info
                label="Telefone"
                value={vendaAtiva.cliente_telefone ?? "—"}
              />
              <Info label="E-mail" value={vendaAtiva.cliente_email ?? "—"} />
              <Info
                label="Data"
                value={formatDateBR(vendaAtiva.data)}
              />
              <Info
                label={vendaAtiva.tipo === "venda" ? "Valor" : "Valor previsto"}
                value={vendaAtiva.valor ? formatBRL(vendaAtiva.valor) : "—"}
              />
              {vendaAtiva.valor_sinal != null && (
                <Info
                  label="Sinal pago"
                  value={formatBRL(vendaAtiva.valor_sinal)}
                />
              )}
              {vendaAtiva.forma_pagamento && (
                <Info
                  label="Forma de pagamento"
                  value={vendaAtiva.forma_pagamento}
                />
              )}
              {vendaAtiva.comissao_valor != null && (
                <Info
                  label="Comissão"
                  value={`${formatBRL(vendaAtiva.comissao_valor)} (${
                    vendaAtiva.comissao_pct ?? 0
                  }%)`}
                />
              )}
            </div>
            {vendaAtiva.observacao && (
              <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
                {vendaAtiva.observacao}
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(vendaAtiva)}
              >
                <Pencil className="h-4 w-4" />
                Editar dados
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel(vendaAtiva.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
                Cancelar {vendaAtiva.tipo === "venda" ? "venda" : "reserva"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {vendas.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              Nenhum registro ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{formatDateBR(v.data)}</TableCell>
                    <TableCell className="capitalize">{v.tipo}</TableCell>
                    <TableCell>{v.cliente_nome ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {v.valor ? formatBRL(v.valor) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          v.status === "ativa"
                            ? "success"
                            : v.status === "cancelada"
                              ? "destructive"
                              : "muted"
                        }
                      >
                        {v.status === "ativa"
                          ? "Ativa"
                          : v.status === "cancelada"
                            ? "Cancelada"
                            : "Convertida"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={!!open} onOpenChange={(v) => !v && closeModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? editing.tipo === "venda"
                  ? "Editar venda"
                  : "Editar reserva"
                : open === "venda"
                  ? "Registrar venda"
                  : "Registrar reserva"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize os dados do registro. O lote permanece no mesmo status."
                : open === "venda"
                  ? "Marca o lote como vendido."
                  : "Reserva o lote para um cliente."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cliente_nome">Nome do cliente *</Label>
                <Input
                  id="cliente_nome"
                  {...register("cliente_nome")}
                />
                {errors.cliente_nome && (
                  <p className="text-xs text-destructive">
                    {errors.cliente_nome.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cliente_cpf">CPF</Label>
                <Input id="cliente_cpf" {...register("cliente_cpf")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cliente_telefone">Telefone</Label>
                <Input
                  id="cliente_telefone"
                  {...register("cliente_telefone")}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cliente_email">E-mail</Label>
                <Input id="cliente_email" {...register("cliente_email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" {...register("data")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor">
                  Valor {open === "venda" ? "(R$)" : "previsto"}
                </Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  {...register("valor")}
                />
              </div>
              {open === "reserva" && (
                <div className="space-y-1.5">
                  <Label htmlFor="valor_sinal">Sinal pago (R$)</Label>
                  <Input
                    id="valor_sinal"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register("valor_sinal")}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="forma_pagamento">Forma de pagamento</Label>
                <Input
                  id="forma_pagamento"
                  placeholder="À vista, financiamento, parcelado…"
                  {...register("forma_pagamento")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="corretor_id">Corretor</Label>
                <Select id="corretor_id" {...register("corretor_id")}>
                  <option value="">—</option>
                  {corretores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comissao_pct">Comissão %</Label>
                <Input
                  id="comissao_pct"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Vazio = % padrão do corretor"
                  {...register("comissao_pct")}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  rows={2}
                  {...register("observacao")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant={open === "venda" ? "accent" : "default"}
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing
                  ? "Salvar alterações"
                  : open === "venda"
                    ? "Confirmar venda"
                    : "Confirmar reserva"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
