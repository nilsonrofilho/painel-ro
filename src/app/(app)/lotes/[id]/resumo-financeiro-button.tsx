"use client";

import * as React from "react";
import { PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResumoEtapasChart,
  type EtapaResumo,
} from "@/components/charts/resumo-etapas-chart";

interface Props {
  numero: string;
  etapas: EtapaResumo[];
}

export function ResumoFinanceiroButton({ numero, etapas }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PieChart className="h-4 w-4" />
        Resumo financeiro
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resumo Financeiro — Lote {numero}</DialogTitle>
            <DialogDescription>
              Distribuição do orçamento e gasto por etapa da obra.
            </DialogDescription>
          </DialogHeader>
          <ResumoEtapasChart
            etapas={etapas}
            emptyMessage="Cadastre fases na aba Fases da obra para ver o resumo."
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
