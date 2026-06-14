"use client";

import * as React from "react";
import { Copy, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  updateViabilidade,
  deleteViabilidade,
  duplicarViabilidade,
} from "@/lib/actions/viabilidade";
import type { EstudoViabilidade } from "@/lib/supabase/types";

export function EstudoActions({ estudo }: { estudo: EstudoViabilidade }) {
  const [confirmDel, setConfirmDel] = React.useState(false);
  const [loading, setLoading] = React.useState<string | null>(null);

  async function setStatus(status: "aprovado" | "reprovado" | "rascunho") {
    setLoading(status);
    try {
      await updateViabilidade(estudo.id, { status });
      toast.success(
        status === "aprovado"
          ? "Estudo aprovado"
          : status === "reprovado"
            ? "Estudo reprovado"
            : "Status atualizado",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(null);
    }
  }

  async function handleDuplicar() {
    setLoading("dup");
    try {
      await duplicarViabilidade(estudo.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("NEXT_REDIRECT")) toast.error(msg);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {estudo.status !== "aprovado" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStatus("aprovado")}
          disabled={!!loading}
          className="text-success hover:bg-success/10 hover:text-success"
        >
          {loading === "aprovado" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Aprovar
        </Button>
      )}
      {estudo.status !== "reprovado" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStatus("reprovado")}
          disabled={!!loading}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {loading === "reprovado" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Reprovar
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDuplicar}
        disabled={!!loading}
      >
        {loading === "dup" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Duplicar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmDel(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={`Excluir "${estudo.nome}"?`}
        description="Todo o estudo (programa, custos, fluxo) será removido permanentemente."
        destructive
        confirmLabel="Sim, excluir"
        onConfirm={async () => {
          try {
            await deleteViabilidade(estudo.id);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (!msg.includes("NEXT_REDIRECT")) toast.error(msg);
          }
        }}
      />
    </div>
  );
}
