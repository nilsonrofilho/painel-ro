"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteQuadra } from "@/lib/actions/quadras";

export function DeleteQuadraButton({
  id,
  identificador,
}: {
  id: string;
  identificador: string;
}) {
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
        title={`Excluir Quadra ${identificador}?`}
        description="Todos os lotes desta quadra e seus dados serão removidos permanentemente."
        confirmLabel="Sim, excluir"
        destructive
        onConfirm={async () => {
          try {
            await deleteQuadra(id);
            toast.success("Quadra excluída");
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro ao excluir";
            toast.error(msg);
          }
        }}
      />
    </>
  );
}
