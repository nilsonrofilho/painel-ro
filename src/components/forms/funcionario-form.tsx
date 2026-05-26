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
import { ImageUpload } from "@/components/image-upload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FUNCOES_OBRA } from "@/lib/constants";
import {
  createFuncionario,
  updateFuncionario,
  type FuncionarioInput,
} from "@/lib/actions/funcionarios";
import type { Funcionario } from "@/lib/supabase/types";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  funcao: z.string().optional(),
  tipo_contratacao: z.enum(["clt", "diarista", "empreitada"]).optional(),
  salario: z.string().optional(),
  diaria: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  data_admissao: z.string().optional(),
  status: z.enum(["ativo", "inativo"]),
});

type FormValues = z.infer<typeof schema>;

export function FuncionarioForm({ funcionario }: { funcionario?: Funcionario }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [fotoUrl, setFotoUrl] = React.useState<string | null>(
    funcionario?.foto_url ?? null,
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: funcionario?.nome ?? "",
      cpf: funcionario?.cpf ?? "",
      rg: funcionario?.rg ?? "",
      funcao: funcionario?.funcao ?? "",
      tipo_contratacao: funcionario?.tipo_contratacao ?? undefined,
      salario: funcionario?.salario?.toString() ?? "",
      diaria: funcionario?.diaria?.toString() ?? "",
      telefone: funcionario?.telefone ?? "",
      endereco: funcionario?.endereco ?? "",
      data_admissao: funcionario?.data_admissao ?? "",
      status: funcionario?.status ?? "ativo",
    },
  });

  async function onSubmit(v: FormValues) {
    setSubmitting(true);
    try {
      const payload: FuncionarioInput = {
        nome: v.nome,
        cpf: v.cpf || null,
        rg: v.rg || null,
        funcao: v.funcao || null,
        tipo_contratacao: v.tipo_contratacao || null,
        salario: v.salario ? Number(v.salario) : null,
        diaria: v.diaria ? Number(v.diaria) : null,
        telefone: v.telefone || null,
        endereco: v.endereco || null,
        data_admissao: v.data_admissao || null,
        foto_url: fotoUrl,
        status: v.status,
      };
      if (funcionario) {
        await updateFuncionario(funcionario.id, payload);
        toast.success("Funcionário atualizado");
      } else {
        await createFuncionario(payload);
        toast.success("Funcionário criado");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados do funcionário</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" {...register("nome")} />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" {...register("cpf")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rg">RG</Label>
              <Input id="rg" {...register("rg")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="funcao">Função</Label>
              <Select id="funcao" {...register("funcao")}>
                <option value="">—</option>
                {FUNCOES_OBRA.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo_contratacao">Tipo de contratação</Label>
              <Select id="tipo_contratacao" {...register("tipo_contratacao")}>
                <option value="">—</option>
                <option value="clt">CLT</option>
                <option value="diarista">Diarista</option>
                <option value="empreitada">Empreitada</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salario">Salário (R$)</Label>
              <Input
                id="salario"
                type="number"
                step="0.01"
                {...register("salario")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diaria">Diária (R$)</Label>
              <Input
                id="diaria"
                type="number"
                step="0.01"
                {...register("diaria")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register("telefone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data_admissao">Data de admissão</Label>
              <Input
                id="data_admissao"
                type="date"
                {...register("data_admissao")}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" {...register("endereco")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...register("status")}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foto</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              bucket="funcionarios"
              value={fotoUrl}
              onChange={setFotoUrl}
              pathPrefix={`fotos/${funcionario?.id ?? "novo"}`}
              aspectRatio="square"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {funcionario ? "Salvar alterações" : "Cadastrar funcionário"}
        </Button>
      </div>
    </form>
  );
}
