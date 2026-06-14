"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatBRL } from "@/lib/utils";

const CORES = [
  "hsl(220, 79%, 45%)",
  "hsl(5, 64%, 48%)",
  "hsl(160, 64%, 42%)",
  "hsl(35, 90%, 52%)",
  "hsl(265, 55%, 55%)",
  "hsl(190, 70%, 48%)",
  "hsl(217, 16%, 55%)",
];

export function AcompanhamentoPizza({
  data,
}: {
  data: { nome: string; valor: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Sem dados
      </div>
    );
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="valor"
            nameKey="nome"
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={CORES[i % CORES.length]}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatBRL(Number(v))}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
