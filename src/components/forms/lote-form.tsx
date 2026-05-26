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
import { ETAPAS_OBRA, STATUS_LOTE } from "@/lib/constants";
import { createLote, updateLote, type LoteInput } from "@/lib/actions/lotes";
import type { Funcionario, Lote } from "@/lib/supabase/types";

const schema = z.object({
  numero: z.string().min(1, "Número obrigatório"),
  status: z.enum(["disponivel", "reservado", "vendido"]),
  etapa: z
    .enum([
      "planejamento",
      "fundacao",
      "alvenaria",
      "cobertura",
      "acabamento",
      "concluido",
    ])
    .optional()
    .or(z.literal("")),
  area_lote: z.string().optional(),
  area_construida: z.string().optional(),
  quartos: z.string().optional(),
  suites: z.string().optional(),
  banheiros: z.string().optional(),
  vagas: z.string().optional(),
  tipo_planta: z.string().optional(),
  previsao_entrega: z.string().optional(),
  data_entrega_real: z.string().optional(),
  responsavel_id: z.string().optional(),
  valor_venda: z.string().optional(),
  orcamento_total: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LoteFormProps {
  quadraId: string;
  lote?: Lote;
  funcionarios: Funcionario[];
}

export function LoteForm({ quadraId, lote, funcionarios }: LoteFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [fotoUrl, setFotoUrl] = React.useState<string | null>(
    lote?.foto_url ?? null,
  );
  const [plantaUrl, setPlantaUrl] = React.useState<string | null>(
    lote?.planta_url ?? null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero: lote?.numero ?? "",
      status: lote?.status ?? "disponivel",
      etapa: lote?.etapa ?? "planejamento",
      area_lote: lote?.area_lote?.toString() ?? "",
      area_construida: lote?.area_construida?.toString() ?? "",
      quartos: lote?.quartos?.toString() ?? "",
      suites: lote?.suites?.toString() ?? "",
      banheiros: lote?.banheiros?.toString() ?? "",
      vagas: lote?.vagas?.toString() ?? "",
      tipo_planta: lote?.tipo_planta ?? "",
      previsao_entrega: lote?.previsao_entrega ?? "",
      data_entrega_real: lote?.data_entrega_real ?? "",
      responsavel_id: lote?.responsavel_id ?? "",
      valor_venda: lote?.valor_venda?.toString() ?? "",
      orcamento_total: lote?.orcamento_total?.toString() ?? "",
      observacoes: lote?.observacoes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload: LoteInput = {
        quadra_id: quadraId,
        numero: values.numero,
        status: values.status,
        etapa: (values.etapa || null) as LoteInput["etapa"],
        area_lote: values.area_lote ? Number(values.area_lote) : null,
        area_construida: values.area_construida
          ? Number(values.area_construida)
          : null,
        quartos: values.quartos ? Number(values.quartos) : null,
        suites: values.suites ? Number(values.suites) : null,
        banheiros: values.banheiros ? Number(values.banheiros) : null,
        vagas: values.vagas ? Number(values.vagas) : null,
        tipo_planta: values.tipo_planta || null,
        planta_url: plantaUrl,
        foto_url: fotoUrl,
        previsao_entrega: values.previsao_entrega || null,
        data_entrega_real: values.data_entrega_real || null,
        responsavel_id: values.responsavel_id || null,
        valor_venda: values.valor_venda ? Number(values.valor_venda) : null,
        orcamento_total: values.orcamento_total
          ? Number(values.orcamento_total)
          : null,
        observacoes: values.observacoes || null,
      };
      if (lote) {
        await updateLote(lote.id, payload);
        toast.success("Lote atualizado");
      } else {
        await createLote(payload);
        toast.success("Lote criado");
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
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    placeholder="Ex: 01, 02, 17A"
                    {...register("numero")}
                  />
                  {errors.numero && (
                    <p className="text-xs text-destructive">
                      {errors.numero.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" {...register("status")}>
                    {Object.entries(STATUS_LOTE).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.emoji} {v.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="etapa">Etapa da obra</Label>
                <Select id="etapa" {...register("etapa")}>
                  {Object.entries(ETAPAS_OBRA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} ({v.percent}%)
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="area_lote">Área do lote (m²)</Label>
                  <Input
                    id="area_lote"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register("area_lote")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="area_construida">Área construída (m²)</Label>
                  <Input
                    id="area_construida"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register("area_construida")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quartos">Quartos</Label>
                  <Input
                    id="quartos"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    {...register("quartos")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="suites">Suítes</Label>
                  <Input
                    id="suites"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    {...register("suites")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banheiros">Banheiros</Label>
                  <Input
                    id="banheiros"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    {...register("banheiros")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vagas">Vagas</Label>
                  <Input
                    id="vagas"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    {...register("vagas")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo_planta">Tipo de planta</Label>
                <Input
                  id="tipo_planta"
                  placeholder="Ex: Casa térrea 2 quartos"
                  {...register("tipo_planta")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  rows={3}
                  {...register("observacoes")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comercial & Cronograma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="valor_venda">Valor de venda (R$)</Label>
                  <Input
                    id="valor_venda"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register("valor_venda")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orcamento_total">Orçamento total (R$)</Label>
                  <Input
                    id="orcamento_total"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    {...register("orcamento_total")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="previsao_entrega">Previsão de entrega</Label>
                  <Input
                    id="previsao_entrega"
                    type="date"
                    {...register("previsao_entrega")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="data_entrega_real">Entrega real</Label>
                  <Input
                    id="data_entrega_real"
                    type="date"
                    {...register("data_entrega_real")}
                  />
                </div>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Foto da casa</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="lotes"
                value={fotoUrl}
                onChange={setFotoUrl}
                pathPrefix={`fotos/${lote?.id ?? "novo"}`}
                aspectRatio="square"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Planta</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="lotes"
                value={plantaUrl}
                onChange={setPlantaUrl}
                pathPrefix={`plantas/${lote?.id ?? "novo"}`}
                aspectRatio="square"
              />
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
          {lote ? "Salvar alterações" : "Criar lote"}
        </Button>
      </div>
    </form>
  );
}
