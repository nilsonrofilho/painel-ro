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
import { ImageUpload } from "@/components/image-upload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ESTADOS_BR, STATUS_LOTEAMENTO } from "@/lib/constants";
import {
  createLoteamento,
  updateLoteamento,
  type LoteamentoInput,
} from "@/lib/actions/loteamentos";
import type { Funcionario, Loteamento } from "@/lib/supabase/types";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  endereco: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  imagem_url: z.string().optional().nullable(),
  data_inicio: z.string().optional(),
  previsao_entrega: z.string().optional(),
  responsavel_id: z.string().optional(),
  status: z.enum(["planejamento", "em_obra", "concluido", "pausado"]),
  descricao: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LoteamentoFormProps {
  loteamento?: Loteamento;
  funcionarios: Funcionario[];
}

export function LoteamentoForm({ loteamento, funcionarios }: LoteamentoFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [imagemUrl, setImagemUrl] = React.useState<string | null>(
    loteamento?.imagem_url ?? null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: loteamento?.nome ?? "",
      cidade: loteamento?.cidade ?? "",
      estado: loteamento?.estado ?? "",
      endereco: loteamento?.endereco ?? "",
      lat: loteamento?.lat?.toString() ?? "",
      lng: loteamento?.lng?.toString() ?? "",
      data_inicio: loteamento?.data_inicio ?? "",
      previsao_entrega: loteamento?.previsao_entrega ?? "",
      responsavel_id: loteamento?.responsavel_id ?? "",
      status: loteamento?.status ?? "planejamento",
      descricao: loteamento?.descricao ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload: LoteamentoInput = {
        nome: values.nome,
        cidade: values.cidade || null,
        estado: values.estado || null,
        endereco: values.endereco || null,
        lat: values.lat ? Number(values.lat) : null,
        lng: values.lng ? Number(values.lng) : null,
        imagem_url: imagemUrl,
        data_inicio: values.data_inicio || null,
        previsao_entrega: values.previsao_entrega || null,
        responsavel_id: values.responsavel_id || null,
        status: values.status,
        descricao: values.descricao || null,
      };
      if (loteamento) {
        await updateLoteamento(loteamento.id, payload);
        toast.success("Loteamento atualizado");
      } else {
        await createLoteamento(payload);
        toast.success("Loteamento criado");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do loteamento *</Label>
              <Input
                id="nome"
                placeholder="Ex: Residencial Vista Verde"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
              <div className="space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register("cidade")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado">Estado</Label>
                <Select id="estado" {...register("estado")}>
                  <option value="">—</option>
                  {ESTADOS_BR.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endereco">Endereço completo</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro"
                {...register("endereco")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  {...register("lat")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  {...register("lng")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                rows={3}
                placeholder="Informações livres sobre o empreendimento"
                {...register("descricao")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagem de capa</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="loteamentos"
                value={imagemUrl}
                onChange={setImagemUrl}
                pathPrefix={loteamento?.id ?? "novo"}
                aspectRatio="video"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Cronograma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select id="status" {...register("status")}>
                  {Object.entries(STATUS_LOTEAMENTO).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_inicio">Data de início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  {...register("data_inicio")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="previsao_entrega">Previsão de entrega</Label>
                <Input
                  id="previsao_entrega"
                  type="date"
                  {...register("previsao_entrega")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="responsavel_id">Responsável pela obra</Label>
                <Select id="responsavel_id" {...register("responsavel_id")}>
                  <option value="">—</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                      {f.funcao ? ` — ${f.funcao}` : ""}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loteamento ? "Salvar alterações" : "Criar loteamento"}
        </Button>
      </div>
    </form>
  );
}
