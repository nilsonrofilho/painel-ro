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
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "@/lib/actions/catalogo-materiais";
import type { Material } from "@/lib/supabase/types";

const CATEGORIAS = [
  "Cimentícios",
  "Agregados",
  "Cerâmicos",
  "Madeira",
  "Metálicos",
  "Hidráulica",
  "Elétrica",
  "Acabamento",
  "Pintura",
  "Outros",
];

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  unidade: z.string().optional(),
  categoria: z.string().optional(),
  preco_referencia: z.string().optional(),
  estoque_minimo: z.string().optional(),
  observacao: z.string().optional(),
  ativo: z.enum(["ativo", "inativo"]),
});

type FormValues = z.infer<typeof schema>;

interface MaterialActionsProps {
  material?: Material;
  trigger?: "default" | "row" | "empty";
}

export function MaterialActions({
  material,
  trigger = "default",
}: MaterialActionsProps) {
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
      nome: material?.nome ?? "",
      unidade: material?.unidade ?? "",
      categoria: material?.categoria ?? "",
      preco_referencia: material?.preco_referencia?.toString() ?? "",
      estoque_minimo: material?.estoque_minimo?.toString() ?? "",
      observacao: material?.observacao ?? "",
      ativo: material?.ativo === false ? "inativo" : "ativo",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        nome: material?.nome ?? "",
        unidade: material?.unidade ?? "",
        categoria: material?.categoria ?? "",
        preco_referencia: material?.preco_referencia?.toString() ?? "",
        estoque_minimo: material?.estoque_minimo?.toString() ?? "",
        observacao: material?.observacao ?? "",
        ativo: material?.ativo === false ? "inativo" : "ativo",
      });
    }
  }, [open, material, reset]);

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        nome: v.nome,
        unidade: v.unidade || null,
        categoria: v.categoria || null,
        preco_referencia: v.preco_referencia
          ? Number(v.preco_referencia)
          : null,
        estoque_minimo: v.estoque_minimo ? Number(v.estoque_minimo) : null,
        observacao: v.observacao || null,
        ativo: v.ativo === "ativo",
      };
      if (material) {
        await updateMaterial(material.id, payload);
        toast.success("Material atualizado");
      } else {
        await createMaterial(payload);
        toast.success("Material criado");
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
    if (!material) return;
    try {
      await deleteMaterial(material.id);
      toast.success("Material excluído");
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
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo material
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {material ? "Editar material" : "Novo material"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                placeholder="Ex: Cimento CPII 50kg"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">
                  {errors.nome.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="categoria">Categoria</Label>
                <Select id="categoria" {...register("categoria")}>
                  <option value="">—</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  placeholder="saco, m³, un, kg"
                  {...register("unidade")}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="preco_referencia">Preço ref. (R$)</Label>
                <Input
                  id="preco_referencia"
                  type="number"
                  step="0.01"
                  {...register("preco_referencia")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estoque_minimo">Estoque mínimo</Label>
                <Input
                  id="estoque_minimo"
                  type="number"
                  step="0.01"
                  {...register("estoque_minimo")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ativo">Status</Label>
                <Select id="ativo" {...register("ativo")}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observação</Label>
              <Textarea
                id="observacao"
                rows={2}
                {...register("observacao")}
              />
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
        title={`Excluir "${material?.nome}"?`}
        description="Lançamentos de material existentes que referenciam este item perdem a referência (mas o texto do nome continua). Considere desativar em vez de excluir."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
      />
    </>
  );
}
