"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteLoteamento } from "@/lib/actions/loteamentos";

export function DeleteLoteamentoButton({ id, nome }: { id: string; nome: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Excluir "${nome}"?`}
        description="Todas as quadras, lotes, vendas e dados vinculados serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Sim, excluir"
        destructive
        onConfirm={async () => {
          try {
            await deleteLoteamento(id);
            toast.success("Loteamento excluído");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro ao excluir";
            toast.error(msg);
          }
        }}
      />
    </>
  );
}
