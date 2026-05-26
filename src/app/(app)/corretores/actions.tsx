"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  createCorretor,
  updateCorretor,
  deleteCorretor,
} from "@/lib/actions/corretores";
import type { Corretor } from "@/lib/supabase/types";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  creci: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  comissao_padrao_pct: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CorretoresActionsProps {
  corretor?: Corretor;
  trigger?: "default" | "row" | "empty";
}

export function CorretoresActions({
  corretor,
  trigger = "default",
}: CorretoresActionsProps) {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: corretor?.nome ?? "",
      creci: corretor?.creci ?? "",
      telefone: corretor?.telefone ?? "",
      email: corretor?.email ?? "",
      comissao_padrao_pct: corretor?.comissao_padrao_pct?.toString() ?? "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        nome: corretor?.nome ?? "",
        creci: corretor?.creci ?? "",
        telefone: corretor?.telefone ?? "",
        email: corretor?.email ?? "",
        comissao_padrao_pct: corretor?.comissao_padrao_pct?.toString() ?? "",
      });
    }
  }, [open, corretor, reset]);

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        nome: v.nome,
        creci: v.creci || null,
        telefone: v.telefone || null,
        email: v.email || null,
        comissao_padrao_pct: v.comissao_padrao_pct
          ? Number(v.comissao_padrao_pct)
          : null,
      };
      if (corretor) {
        await updateCorretor(corretor.id, payload);
        toast.success("Corretor atualizado");
      } else {
        await createCorretor(payload);
        toast.success("Corretor criado");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!corretor) return;
    try {
      await deleteCorretor(corretor.id);
      toast.success("Corretor excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <>
      {trigger === "row" ? (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setOpen(true)}
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmOpen(true)}
            aria-label="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} size={trigger === "empty" ? "default" : "default"}>
          <Plus className="h-4 w-4" />
          Novo corretor
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {corretor ? "Editar corretor" : "Novo corretor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register("nome")} />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="creci">CRECI</Label>
                <Input id="creci" {...register("creci")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comissao_padrao_pct">Comissão padrão %</Label>
                <Input
                  id="comissao_padrao_pct"
                  type="number"
                  step="0.01"
                  {...register("comissao_padrao_pct")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" {...register("telefone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register("email")} />
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
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir corretor "${corretor?.nome}"?`}
        description="As vendas vinculadas a este corretor não serão excluídas, mas perderão a referência."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
      />
    </>
  );
}
