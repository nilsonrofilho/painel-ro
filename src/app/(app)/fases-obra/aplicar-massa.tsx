"use client";

import * as React from "react";
import { Sparkles, Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { seedFasesPadraoEmMassa } from "@/lib/actions/fases";

interface LoteSemFases {
  loteId: string;
  numero: string;
  loteamentoNome: string;
  quadraIdentificador: string;
}

export function AplicarFasesEmMassa({ lotes }: { lotes: LoteSemFases[] }) {
  const [selecionados, setSelecionados] = React.useState<Set<string>>(
    new Set(),
  );
  const [aplicando, setAplicando] = React.useState(false);

  if (lotes.length === 0) return null;

  const todosSelecionados = selecionados.size === lotes.length;

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setSelecionados(
      todosSelecionados ? new Set() : new Set(lotes.map((l) => l.loteId)),
    );
  }

  async function aplicar() {
    if (selecionados.size === 0) {
      toast.error("Selecione ao menos um lote.");
      return;
    }
    setAplicando(true);
    try {
      const { aplicados } = await seedFasesPadraoEmMassa([...selecionados]);
      toast.success(
        `Fases padrão aplicadas a ${aplicados} lote(s).`,
      );
      setSelecionados(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setAplicando(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ListChecks className="h-4 w-4 text-accent" />
          {lotes.length} lote(s) sem fases — aplique as fases padrão em massa
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTodos}>
            {todosSelecionados ? "Limpar" : "Selecionar todos"}
          </Button>
          <Button size="sm" onClick={aplicar} disabled={aplicando}>
            {aplicando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Aplicar aos selecionados ({selecionados.size})
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {lotes.map((l) => {
          const sel = selecionados.has(l.loteId);
          return (
            <button
              key={l.loteId}
              type="button"
              onClick={() => toggle(l.loteId)}
              className={
                "rounded-lg border px-3 py-1.5 text-xs transition-colors " +
                (sel
                  ? "border-accent bg-accent/15 font-medium text-accent"
                  : "border-border bg-background text-muted-foreground hover:border-accent/50")
              }
              aria-pressed={sel}
            >
              Lote {l.numero}
              <span className="ml-1 opacity-60">
                · Q.{l.quadraIdentificador} {l.loteamentoNome}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
