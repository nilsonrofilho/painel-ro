"use client";

import * as React from "react";
import { Loader2, Save, MapPin } from "lucide-react";
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
import { updateViabilidade } from "@/lib/actions/viabilidade";
import { ESTADOS_BR, TIPO_EMPREENDIMENTO } from "@/lib/constants";
import type {
  EstudoViabilidade,
  ZonaUrbanistica,
  MunicipioParametros,
} from "@/lib/supabase/types";

interface Props {
  estudo: EstudoViabilidade;
  zonas: ZonaUrbanistica[];
  municipios: MunicipioParametros[];
}

export function TerrenoTab({ estudo, zonas, municipios }: Props) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const municipioId = (fd.get("municipio_id") as string) || null;
      const mun = municipios.find((m) => m.id === municipioId);
      await updateViabilidade(estudo.id, {
        nome: String(fd.get("nome") ?? estudo.nome),
        municipio_id: municipioId,
        municipio: mun?.municipio ?? ((fd.get("municipio") as string) || null),
        estado: mun?.estado ?? ((fd.get("estado") as string) || null),
        zona_id: (fd.get("zona_id") as string) || null,
        endereco: (fd.get("endereco") as string) || null,
        tipo_empreendimento: (fd.get("tipo_empreendimento") as
          | "loteamento"
          | "casas"
          | "vertical"
          | "misto") ?? "loteamento",
        area_terreno_m2: fd.get("area_terreno_m2")
          ? Number(fd.get("area_terreno_m2"))
          : null,
        custo_terreno: fd.get("custo_terreno")
          ? Number(fd.get("custo_terreno"))
          : null,
        valor_venal_referencia: fd.get("valor_venal_referencia")
          ? Number(fd.get("valor_venal_referencia"))
          : null,
        observacao: (fd.get("observacao") as string) || null,
      });
      toast.success("Terreno atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handle} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Localização e terreno
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nome">Nome do estudo *</Label>
            <Input id="nome" name="nome" required defaultValue={estudo.nome} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="municipio_id">Município (catálogo)</Label>
            <Select
              id="municipio_id"
              name="municipio_id"
              defaultValue={estudo.municipio_id ?? ""}
            >
              <option value="">— usar texto livre —</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.municipio} / {m.estado} (ITBI {m.itbi_aliquota_pct}%)
                </option>
              ))}
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Vincular ao catálogo traz a alíquota de ITBI automaticamente.
            </p>
          </div>
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="municipio">Município (livre)</Label>
              <Input
                id="municipio"
                name="municipio"
                defaultValue={estudo.municipio ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estado">UF</Label>
              <Select id="estado" name="estado" defaultValue={estudo.estado ?? ""}>
                <option value="">—</option>
                {ESTADOS_BR.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              name="endereco"
              defaultValue={estudo.endereco ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zona_id">Zona de uso (plano diretor)</Label>
            <Select
              id="zona_id"
              name="zona_id"
              defaultValue={estudo.zona_id ?? ""}
            >
              <option value="">—</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zona} — {z.descricao ?? z.densidade ?? ""} (TO {z.to_pct}%, CA {z.ca_basico})
                </option>
              ))}
            </Select>
            {zonas.length === 0 && (
              <p className="text-[10px] text-muted-foreground">
                Nenhuma zona cadastrada para o município. Cadastre em Parâmetros.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipo_empreendimento">Tipo de empreendimento</Label>
            <Select
              id="tipo_empreendimento"
              name="tipo_empreendimento"
              defaultValue={estudo.tipo_empreendimento}
            >
              {Object.entries(TIPO_EMPREENDIMENTO).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area_terreno_m2">Área do terreno (m²)</Label>
            <Input
              id="area_terreno_m2"
              name="area_terreno_m2"
              type="number"
              step="0.01"
              defaultValue={estudo.area_terreno_m2 ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="custo_terreno">Custo do terreno (R$)</Label>
            <Input
              id="custo_terreno"
              name="custo_terreno"
              type="number"
              step="0.01"
              defaultValue={estudo.custo_terreno ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor_venal_referencia">
              Valor venal de referência (R$)
            </Label>
            <Input
              id="valor_venal_referencia"
              name="valor_venal_referencia"
              type="number"
              step="0.01"
              defaultValue={estudo.valor_venal_referencia ?? ""}
            />
            <p className="text-[10px] text-muted-foreground">
              Usado na base do ITBI quando a regra é &quot;maior entre&quot;.
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="observacao">Observações</Label>
            <Textarea
              id="observacao"
              name="observacao"
              rows={2}
              defaultValue={estudo.observacao ?? ""}
            />
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
          Salvar terreno
        </Button>
      </div>
    </form>
  );
}
