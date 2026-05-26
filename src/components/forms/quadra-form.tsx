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
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createQuadra,
  updateQuadra,
  type QuadraInput,
} from "@/lib/actions/quadras";
import type { Quadra } from "@/lib/supabase/types";

const schema = z.object({
  identificador: z.string().min(1, "Identificador obrigatório"),
  descricao: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface QuadraFormProps {
  loteamentoId: string;
  quadra?: Quadra;
}

export function QuadraForm({ loteamentoId, quadra }: QuadraFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [imagemUrl, setImagemUrl] = React.useState<string | null>(
    quadra?.imagem_url ?? null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      identificador: quadra?.identificador ?? "",
      descricao: quadra?.descricao ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload: QuadraInput = {
        loteamento_id: loteamentoId,
        identificador: values.identificador,
        descricao: values.descricao || null,
        imagem_url: imagemUrl,
      };
      if (quadra) {
        await updateQuadra(quadra.id, payload);
        toast.success("Quadra atualizada");
      } else {
        await createQuadra(payload);
        toast.success("Quadra criada");
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
            <CardTitle>Dados da quadra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identificador">Identificador *</Label>
              <Input
                id="identificador"
                placeholder="Ex: A, B, C ou 1, 2, 3"
                {...register("identificador")}
              />
              {errors.identificador && (
                <p className="text-xs text-destructive">
                  {errors.identificador.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                rows={3}
                placeholder="Ex: Quadra frontal com vista para a rua principal"
                {...register("descricao")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload
              bucket="loteamentos"
              value={imagemUrl}
              onChange={setImagemUrl}
              pathPrefix={`quadras/${quadra?.id ?? "nova"}`}
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
          {quadra ? "Salvar alterações" : "Criar quadra"}
        </Button>
      </div>
    </form>
  );
}
