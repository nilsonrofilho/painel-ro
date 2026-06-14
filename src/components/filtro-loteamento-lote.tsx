"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { OpcaoLoteamento, OpcaoLote } from "@/lib/filters";

interface Props {
  loteamentos: OpcaoLoteamento[];
  lotes: OpcaoLote[];
}

export function FiltroLoteamentoLote({ loteamentos, lotes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const loteamentoSel = searchParams.get("loteamento") ?? "";
  const loteSel = searchParams.get("lote") ?? "";

  // Lotes visíveis no segundo seletor: filtrados pelo loteamento escolhido
  const lotesDoLoteamento = React.useMemo(() => {
    if (!loteamentoSel) return lotes;
    return lotes.filter((l) => l.loteamentoId === loteamentoSel);
  }, [lotes, loteamentoSel]);

  function navigate(next: { loteamento?: string; lote?: string }) {
    const params = new URLSearchParams();
    if (next.loteamento) params.set("loteamento", next.loteamento);
    if (next.lote) params.set("lote", next.lote);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onLoteamentoChange(value: string) {
    // Trocar loteamento reseta o lote selecionado
    navigate({ loteamento: value || undefined });
  }

  function onLoteChange(value: string) {
    if (!value) {
      navigate({ loteamento: loteamentoSel || undefined });
      return;
    }
    // Selecionar lote preenche o loteamento automaticamente
    const lote = lotes.find((l) => l.id === value);
    navigate({
      loteamento: lote?.loteamentoId ?? (loteamentoSel || undefined),
      lote: value,
    });
  }

  const temFiltro = !!loteamentoSel || !!loteSel;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Filter className="h-3.5 w-3.5" />
        Filtrar
      </span>
      <Select
        value={loteamentoSel}
        onChange={(e) => onLoteamentoChange(e.target.value)}
        className="h-9 w-auto min-w-[160px] text-sm"
        aria-label="Filtrar por loteamento"
      >
        <option value="">Todos os loteamentos</option>
        {loteamentos.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome}
          </option>
        ))}
      </Select>
      <Select
        value={loteSel}
        onChange={(e) => onLoteChange(e.target.value)}
        className="h-9 w-auto min-w-[140px] text-sm"
        aria-label="Filtrar por lote"
      >
        <option value="">Todos os lotes</option>
        {lotesDoLoteamento.map((l) => (
          <option key={l.id} value={l.id}>
            Lote {l.numero} · Q. {l.quadraIdentificador}
          </option>
        ))}
      </Select>
      {temFiltro && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({})}
          className="h-9"
        >
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
