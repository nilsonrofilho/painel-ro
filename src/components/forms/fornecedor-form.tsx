"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createFornecedor,
  updateFornecedor,
  type FornecedorInput,
} from "@/lib/actions/fornecedores";
import type { Fornecedor } from "@/lib/supabase/types";

const schema = z.object({
  razao_social: z.string().min(2, "Razão social obrigatória"),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().optional(),
  endereco: z.string().optional(),
  categoria: z.enum(["material", "servico", "ambos"]),
  observacao: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function FornecedorForm({ fornecedor }: { fornecedor?: Fornecedor }) {
  const [submitting, setSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      razao_social: fornecedor?.razao_social ?? "",
      nome_fantasia: fornecedor?.nome_fantasia ?? "",
      cnpj: fornecedor?.cnpj ?? "",
      telefone: fornecedor?.telefone ?? "",
      email: fornecedor?.email ?? "",
      endereco: fornecedor?.endereco ?? "",
      categoria: fornecedor?.categoria ?? "material",
      observacao: fornecedor?.observacao ?? "",
    },
  });

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    try {
      const payload: FornecedorInput = {
        razao_social: v.razao_social,
        nome_fantasia: v.nome_fantasia || null,
        cnpj: v.cnpj || null,
        telefone: v.telefone || null,
        email: v.email || null,
        endereco: v.endereco || null,
        categoria: v.categoria,
        observacao: v.observacao || null,
      };
      if (fornecedor) {
        await updateFornecedor(fornecedor.id, payload);
        toast.success("Fornecedor atualizado");
      } else {
        await createFornecedor(payload);
        toast.success("Fornecedor criado");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="razao_social">Razão social *</Label>
            <Input id="razao_social" {...register("razao_social")} />
            {errors.razao_social && (
              <p className="text-xs text-destructive">
                {errors.razao_social.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nome_fantasia">Nome fantasia</Label>
            <Input id="nome_fantasia" {...register("nome_fantasia")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" placeholder="00.000.000/0000-00" {...register("cnpj")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" {...register("telefone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register("endereco")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select id="categoria" {...register("categoria")}>
              <option value="material">Material</option>
              <option value="servico">Serviço</option>
              <option value="ambos">Ambos</option>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="observacao">Observações</Label>
            <Textarea id="observacao" rows={3} {...register("observacao")} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {fornecedor ? "Salvar alterações" : "Criar fornecedor"}
        </Button>
      </div>
    </form>
  );
}
