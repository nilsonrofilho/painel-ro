"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoteCard } from "@/components/lote-card";
import { EmptyState } from "@/components/ui/empty-state";
import { STATUS_LOTE, type StatusLote } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Lote } from "@/lib/supabase/types";

const STATUS_KEYS = Object.keys(STATUS_LOTE) as StatusLote[];

const chipStyles: Record<StatusLote, { on: string; dot: string }> = {
  disponivel: {
    on: "bg-success/15 text-success border-success/40",
    dot: "bg-success",
  },
  reservado: {
    on: "bg-warning/15 text-warning border-warning/40",
    dot: "bg-warning",
  },
  vendido: {
    on: "bg-primary/15 text-primary border-primary/40",
    dot: "bg-primary",
  },
};

export function LotesFilter({ lotes }: { lotes: Lote[] }) {
  const [busca, setBusca] = React.useState("");
  const [statusSel, setStatusSel] = React.useState<StatusLote[]>([]);

  const filtrados = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lotes.filter((l) => {
      const matchBusca = !termo || l.numero.toLowerCase().includes(termo);
      const matchStatus =
        statusSel.length === 0 || statusSel.includes(l.status);
      return matchBusca && matchStatus;
    });
  }, [lotes, busca, statusSel]);

  function toggleStatus(s: StatusLote) {
    setStatusSel((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  const temFiltro = !!busca.trim() || statusSel.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar lote por número…"
            className="pl-9"
            aria-label="Buscar lote por número"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_KEYS.map((s) => {
            const active = statusSel.includes(s);
            const cfg = STATUS_LOTE[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? chipStyles[s].on
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", chipStyles[s].dot)} />
                {cfg.label}
              </button>
            );
          })}
          {temFiltro && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBusca("");
                setStatusSel([]);
              }}
              className="h-8"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {temFiltro && (
        <p className="text-xs text-muted-foreground">
          {filtrados.length} de {lotes.length} lote(s)
        </p>
      )}

      {filtrados.length === 0 ? (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="Nenhum lote encontrado"
          description="Ajuste a busca ou os filtros de status."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtrados.map((l) => (
            <LoteCard key={l.id} lote={l} />
          ))}
        </div>
      )}
    </div>
  );
}
