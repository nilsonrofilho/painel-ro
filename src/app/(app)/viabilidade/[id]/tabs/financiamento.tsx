"use client";

import * as React from "react";
import { Loader2, Save, Percent } from "lucide-react";
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
import { updateViabilidade } from "@/lib/actions/viabilidade";
import { REGIME_TRIBUTARIO } from "@/lib/constants";
import type { EstudoViabilidade } from "@/lib/supabase/types";

export function FinanciamentoTab({ estudo }: { estudo: EstudoViabilidade }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [regime, setRegime] = React.useState(estudo.regime_tributario ?? "RET");
  const [imposto, setImposto] = React.useState(
    estudo.imposto_venda_pct?.toString() ?? "4",
  );

  function onRegimeChange(value: string) {
    setRegime(value as keyof typeof REGIME_TRIBUTARIO);
    const cfg = REGIME_TRIBUTARIO[value as keyof typeof REGIME_TRIBUTARIO];
    if (cfg) setImposto(String(cfg.imposto_pct));
  }

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await updateViabilidade(estudo.id, {
        regime_tributario: regime as
          | "RET"
          | "RET_social"
          | "presumido"
          | "real",
        imposto_venda_pct: imposto ? Number(imposto) : null,
        comissao_venda_pct: fd.get("comissao_venda_pct")
          ? Number(fd.get("comissao_venda_pct"))
          : null,
        custos_indiretos_pct: fd.get("custos_indiretos_pct")
          ? Number(fd.get("custos_indiretos_pct"))
          : null,
        distratos_pct: fd.get("distratos_pct")
          ? Number(fd.get("distratos_pct"))
          : null,
        custo_financeiro: fd.get("custo_financeiro")
          ? Number(fd.get("custo_financeiro"))
          : null,
        tma_pct: fd.get("tma_pct") ? Number(fd.get("tma_pct")) : null,
      });
      toast.success("Premissas financeiras salvas");
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
            <Percent className="h-4 w-4 text-primary" />
            Premissas financeiras e tributárias
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="regime_tributario">Regime tributário</Label>
            <Select
              id="regime_tributario"
              value={regime}
              onChange={(e) => onRegimeChange(e.target.value)}
            >
              {Object.entries(REGIME_TRIBUTARIO).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} ({v.imposto_pct}%)
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imposto_venda_pct">Imposto sobre venda (%)</Label>
            <Input
              id="imposto_venda_pct"
              type="number"
              step="0.01"
              value={imposto}
              onChange={(e) => setImposto(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Pré-preenchido pelo regime; editável.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comissao_venda_pct">Comissão de venda (%)</Label>
            <Input
              id="comissao_venda_pct"
              name="comissao_venda_pct"
              type="number"
              step="0.01"
              defaultValue={estudo.comissao_venda_pct ?? 5}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="custos_indiretos_pct">
              Custos indiretos (% do custo direto)
            </Label>
            <Input
              id="custos_indiretos_pct"
              name="custos_indiretos_pct"
              type="number"
              step="0.01"
              defaultValue={estudo.custos_indiretos_pct ?? 8}
            />
            <p className="text-[10px] text-muted-foreground">
              Projetos, administração, marketing.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="distratos_pct">Distratos (% do VGV)</Label>
            <Input
              id="distratos_pct"
              name="distratos_pct"
              type="number"
              step="0.01"
              defaultValue={estudo.distratos_pct ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="custo_financeiro">Custo financeiro (R$)</Label>
            <Input
              id="custo_financeiro"
              name="custo_financeiro"
              type="number"
              step="0.01"
              defaultValue={estudo.custo_financeiro ?? 0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tma_pct">TMA — taxa mínima de atratividade (% a.a.)</Label>
            <Input
              id="tma_pct"
              name="tma_pct"
              type="number"
              step="0.01"
              defaultValue={estudo.tma_pct ?? 12}
            />
            <p className="text-[10px] text-muted-foreground">
              Usada no VPL e como referência para a TIR.
            </p>
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
          Salvar premissas
        </Button>
      </div>
    </form>
  );
}
