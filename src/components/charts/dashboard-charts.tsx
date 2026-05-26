"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { formatBRL } from "@/lib/utils";

interface PieData {
  nome: string;
  valor: number;
  cor: string;
}

export function StatusPieChart({ data }: { data: PieData[] }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sem dados ainda
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
            innerRadius={50}
            outerRadius={85}
            paddingAngle={3}
            dataKey="valor"
            nameKey="nome"
            label={(entry: { valor?: number; percent?: number }) => {
              const v = entry.valor ?? 0;
              const p = entry.percent ?? 0;
              return v > 0 ? `${v} (${(p * 100).toFixed(0)}%)` : "";
            }}
            labelLine={false}
            style={{ fontSize: 11 }}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => `${v} lote(s)`}
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

export function VendasMesChart({
  data,
}: {
  data: { mes: string; total: number; qtd: number }[];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="grad-vendas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v, name) =>
              name === "total" ? formatBRL(Number(v)) : `${v} venda(s)`
            }
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#grad-vendas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GastosLoteamentoChart({
  data,
}: {
  data: { nome: string; total: number }[];
}) {
  if (data.every((d) => d.total === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Sem gastos registrados ainda
      </div>
    );
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="nome"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            width={130}
          />
          <Tooltip
            formatter={(v) => formatBRL(Number(v))}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--accent))"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
