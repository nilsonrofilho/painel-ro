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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  createInvestidor,
  updateInvestidor,
  deleteInvestidor,
} from "@/lib/actions/investidores";
import type { Investidor } from "@/lib/supabase/types";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf_cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  data_nascimento: z.string().optional(),
  observacao: z.string().optional(),
  ativo: z.enum(["ativo", "inativo"]),
});

type FormValues = z.infer<typeof schema>;

export function InvestidorActions({
  investidor,
  trigger = "default",
}: {
  investidor?: Investidor;
  trigger?: "default" | "row" | "empty";
}) {
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
      nome: investidor?.nome ?? "",
      cpf_cnpj: investidor?.cpf_cnpj ?? "",
      telefone: investidor?.telefone ?? "",
      email: investidor?.email ?? "",
      data_nascimento: investidor?.data_nascimento ?? "",
      observacao: investidor?.observacao ?? "",
      ativo: investidor?.ativo === false ? "inativo" : "ativo",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        nome: investidor?.nome ?? "",
        cpf_cnpj: investidor?.cpf_cnpj ?? "",
        telefone: investidor?.telefone ?? "",
        email: investidor?.email ?? "",
        observacao: investidor?.observacao ?? "",
        ativo: investidor?.ativo === false ? "inativo" : "ativo",
      });
    }
  }, [open, investidor, reset]);

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        nome: v.nome,
        cpf_cnpj: v.cpf_cnpj || null,
        telefone: v.telefone || null,
        email: v.email || null,
        data_nascimento: v.data_nascimento || null,
        observacao: v.observacao || null,
        ativo: v.ativo === "ativo",
      };
      if (investidor) {
        await updateInvestidor(investidor.id, payload);
        toast.success("Investidor atualizado");
      } else {
        await createInvestidor(payload);
        toast.success("Investidor criado");
      }
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("NEXT_REDIRECT")) toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!investidor) return;
    try {
      await deleteInvestidor(investidor.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("NEXT_REDIRECT")) toast.error(msg);
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
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo investidor
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {investidor ? "Editar investidor" : "Novo investidor"}
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
                <Label htmlFor="cpf_cnpj">CPF / CNPJ</Label>
                <Input id="cpf_cnpj" {...register("cpf_cnpj")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" {...register("telefone")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_nascimento">Data de nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  {...register("data_nascimento")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ativo">Status</Label>
              <Select id="ativo" {...register("ativo")}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea id="observacao" rows={2} {...register("observacao")} />
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
        title={`Excluir "${investidor?.nome}"?`}
        description="Todos os aportes deste investidor serão removidos. Esta ação não pode ser desfeita."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
      />
    </>
  );
}
