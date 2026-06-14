"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/utils";

export interface EtapaResumo {
  nome: string;
  orcamento: number;
  gasto: number;
}

/**
 * Paleta estável por índice, derivada das cores da marca RO.
 * Repete em ciclo se houver mais etapas que cores.
 */
const CHART_COLORS = [
  "hsl(220, 79%, 45%)", // azul-marinho
  "hsl(160, 64%, 42%)", // verde
  "hsl(190, 70%, 48%)", // ciano
  "hsl(35, 90%, 52%)", // amarelo
  "hsl(5, 64%, 48%)", // vermelho-terra
  "hsl(217, 16%, 55%)", // cinza-azulado médio
  "hsl(217, 23%, 35%)", // cinza-azulado escuro
  "hsl(217, 24%, 82%)", // cinza-azulado claro
  "hsl(265, 55%, 55%)", // roxo
  "hsl(140, 45%, 35%)", // verde escuro
];

function corPorIndice(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length];
}

interface Props {
  etapas: EtapaResumo[];
  /** O que medir nas fatias do donut: orçado (padrão) ou gasto */
  base?: "orcamento" | "gasto";
  emptyMessage?: string;
}

export function ResumoEtapasChart({
  etapas,
  base = "orcamento",
  emptyMessage = "Nenhuma etapa cadastrada ainda.",
}: Props) {
  const dados = etapas.map((e, i) => ({
    ...e,
    cor: corPorIndice(i),
    valorBase: base === "gasto" ? e.gasto : e.orcamento,
  }));

  const totalOrcado = etapas.reduce((s, e) => s + e.orcamento, 0);
  const totalGasto = etapas.reduce((s, e) => s + e.gasto, 0);
  const totalBase = dados.reduce((s, d) => s + d.valorBase, 0);

  if (etapas.length === 0 || totalBase === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={92}
              paddingAngle={2}
              dataKey="valorBase"
              nameKey="nome"
              labelLine={false}
            >
              {dados.map((d, i) => (
                <Cell key={i} fill={d.cor} stroke="hsl(var(--card))" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: unknown, _n, item) => [
                formatBRL(Number(v)),
                (item as { payload?: { nome?: string } })?.payload?.nome ?? "",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <p className="-mt-2 text-center text-xs font-medium text-muted-foreground">
          Resumo por Etapa
          {base === "gasto" ? " (por gasto)" : " (por orçamento)"}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Etapa</TableHead>
            <TableHead className="text-right">Valor Orçado</TableHead>
            <TableHead className="text-right">Valor Real (Gasto)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dados.map((d, i) => (
            <TableRow key={i}>
              <TableCell>
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: d.cor }}
                  />
                  {d.nome}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {formatBRL(d.orcamento)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatBRL(d.gasto)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 bg-muted/30 font-bold">
            <TableCell>TOTAL</TableCell>
            <TableCell className="text-right">{formatBRL(totalOrcado)}</TableCell>
            <TableCell className="text-right">{formatBRL(totalGasto)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
