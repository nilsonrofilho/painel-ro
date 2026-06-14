"use client";

import * as React from "react";
import { Loader2, Save, Ruler, AlertTriangle, Info } from "lucide-react";
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
import { KPICard } from "@/components/kpi-card";
import {
  calcPotencialConstrutivo,
  validarUrbanistica,
} from "@/lib/viabilidade";
import { updateViabilidade } from "@/lib/actions/viabilidade";
import { cn } from "@/lib/utils";
import type { EstudoViabilidade, ZonaUrbanistica } from "@/lib/supabase/types";

interface Props {
  estudo: EstudoViabilidade;
  zona: ZonaUrbanistica | null;
}

export function TecnicaTab({ estudo, zona }: Props) {
  const [submitting, setSubmitting] = React.useState(false);
  // Estado local para recálculo ao vivo
  const [caPretendido, setCaPretendido] = React.useState(
    estudo.ca_pretendido?.toString() ?? zona?.ca_basico?.toString() ?? "",
  );
  const [fatorEficiencia, setFatorEficiencia] = React.useState(
    estudo.fator_eficiencia?.toString() ?? "0.80",
  );
  const [peDireito, setPeDireito] = React.useState(
    estudo.pe_direito_m?.toString() ?? "3",
  );

  const potencial = React.useMemo(() => {
    if (!zona || !estudo.area_terreno_m2) return null;
    return calcPotencialConstrutivo({
      areaTerreno: Number(estudo.area_terreno_m2),
      toPct: zona.to_pct,
      caBasico: zona.ca_basico,
      caMaximo: zona.ca_maximo,
      caPretendido: caPretendido ? Number(caPretendido) : zona.ca_basico,
      taxaPermeabilidadePct: zona.taxa_permeabilidade_pct,
      fatorEficiencia: fatorEficiencia ? Number(fatorEficiencia) : 0.8,
    });
  }, [zona, estudo.area_terreno_m2, caPretendido, fatorEficiencia]);

  const alertas = React.useMemo(() => {
    if (!zona || !potencial) return [];
    return validarUrbanistica({
      caBasico: zona.ca_basico,
      caMaximo: zona.ca_maximo,
      caPretendido: caPretendido ? Number(caPretendido) : zona.ca_basico,
      permiteOutorga: zona.permite_outorga,
      pavimentosEstimados: potencial.pavimentosEstimados,
      peDireito: peDireito ? Number(peDireito) : 3,
      gabaritoMaxM: zona.gabarito_max_m,
      gabaritoMaxPavimentos: zona.gabarito_max_pavimentos,
    });
  }, [zona, potencial, caPretendido, peDireito]);

  async function handleSave() {
    setSubmitting(true);
    try {
      await updateViabilidade(estudo.id, {
        ca_pretendido: caPretendido ? Number(caPretendido) : null,
        fator_eficiencia: fatorEficiencia ? Number(fatorEficiencia) : null,
        pe_direito_m: peDireito ? Number(peDireito) : null,
      });
      toast.success("Parâmetros salvos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  if (!zona) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Ruler className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Selecione uma <strong>zona de uso</strong> na aba Terreno para
            calcular o potencial construtivo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Parâmetros da zona (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Parâmetros urbanísticos — {zona.zona}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <ParamRO label="Taxa de ocupação" value={`${zona.to_pct}%`} />
          <ParamRO label="CA básico" value={zona.ca_basico} />
          <ParamRO label="CA máximo" value={zona.ca_maximo ?? "—"} />
          <ParamRO label="Recuo frontal" value={`${zona.recuo_frontal_m ?? 0} m`} />
          <ParamRO label="Recuo lateral" value={`${zona.recuo_lateral_m ?? 0} m`} />
          <ParamRO
            label="Permeabilidade"
            value={`${zona.taxa_permeabilidade_pct ?? 0}%`}
          />
        </CardContent>
      </Card>

      {/* Parâmetros editáveis do projeto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parâmetros do projeto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ca_pretendido">CA pretendido</Label>
            <Input
              id="ca_pretendido"
              type="number"
              step="0.01"
              value={caPretendido}
              onChange={(e) => setCaPretendido(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fator_eficiencia">
              Fator de eficiência (privativa/construída)
            </Label>
            <Input
              id="fator_eficiencia"
              type="number"
              step="0.01"
              min="0.5"
              max="1"
              value={fatorEficiencia}
              onChange={(e) => setFatorEficiencia(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe_direito">Pé-direito (m)</Label>
            <Input
              id="pe_direito"
              type="number"
              step="0.1"
              value={peDireito}
              onChange={(e) => setPeDireito(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resultado do potencial */}
      {potencial && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KPICard
            label="Projeção máx. (footprint)"
            value={`${potencial.areaProjecaoMax.toFixed(0)} m²`}
            variant="primary"
          />
          <KPICard
            label="Construível básico"
            value={`${potencial.areaConstruivelBasico.toFixed(0)} m²`}
          />
          <KPICard
            label="Construível máximo"
            value={`${potencial.areaConstruivelMaximo.toFixed(0)} m²`}
          />
          <KPICard
            label="Construível pretendida"
            value={`${potencial.areaConstruivelPretendida.toFixed(0)} m²`}
            variant="accent"
          />
          <KPICard
            label="Pavimentos estimados"
            value={potencial.pavimentosEstimados}
          />
          <KPICard
            label="Privativa vendável"
            value={`${potencial.areaPrivativaVendavel.toFixed(0)} m²`}
            variant="success"
          />
        </div>
      )}

      {/* Alertas urbanísticos */}
      {alertas.length > 0 && (
        <div className="space-y-2">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                a.tipo === "erro"
                  ? "border-destructive/40 bg-destructive/5 text-destructive"
                  : a.tipo === "aviso"
                    ? "border-warning/40 bg-warning/5 text-warning"
                    : "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              {a.tipo === "info" ? (
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{a.mensagem}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Salvar parâmetros
        </Button>
      </div>
    </div>
  );
}

function ParamRO({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
