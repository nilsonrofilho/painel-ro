"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Select } from "@/components/ui/select";

const OPCOES: { value: string; label: string }[] = [
  { value: "mes", label: "Mês atual" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "ano", label: "Ano atual" },
  { value: "tudo", label: "Todo o período" },
];

export function FiltroPeriodo() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const atual = searchParams.get("periodo") ?? "mes";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "mes") params.delete("periodo");
    else params.set("periodo", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex items-center gap-1.5">
      <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
      <Select
        value={atual}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-auto min-w-[150px] text-sm"
        aria-label="Filtrar por período"
      >
        {OPCOES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
