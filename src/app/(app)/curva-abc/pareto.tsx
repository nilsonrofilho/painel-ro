"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { formatBRL } from "@/lib/utils";
import type { ItemCurvaABC } from "@/lib/queries";

const COR_CLASSE: Record<string, string> = {
  A: "hsl(220, 79%, 45%)",
  B: "hsl(35, 90%, 52%)",
  C: "hsl(217, 16%, 60%)",
};

export function ParetoChart({ itens }: { itens: ItemCurvaABC[] }) {
  if (itens.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Sem gastos de material para classificar.
      </div>
    );
  }
  const data = itens.map((i) => ({
    material: i.material.length > 14 ? i.material.slice(0, 13) + "…" : i.material,
    valor: i.valor,
    acumulado: i.pct_acumulado,
    classe: i.classe,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="material"
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(v, name) =>
              name === "acumulado"
                ? [`${Number(v).toFixed(1)}%`, "Acumulado"]
                : [formatBRL(Number(v)), "Gasto"]
            }
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="valor" name="Gasto" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={COR_CLASSE[d.classe]} />
            ))}
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="acumulado"
            name="% acumulado"
            stroke="hsl(var(--accent))"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
