"use client";

import * as React from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { duplicarLote } from "@/lib/actions/lotes";

export function DuplicarLoteButton({
  loteId,
  numero,
}: {
  loteId: string;
  numero: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [novoNumero, setNovoNumero] = React.useState("");

  React.useEffect(() => {
    if (open) setNovoNumero(`${numero}-cópia`);
  }, [open, numero]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await duplicarLote(loteId, { novoNumero: novoNumero || undefined });
      toast.success("Lote duplicado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("NEXT_REDIRECT")) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Copy className="h-4 w-4" />
        Duplicar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Lote {numero}</DialogTitle>
            <DialogDescription>
              Copia todos os dados técnicos e comerciais. Status volta para
              Disponível, sem valor de venda nem data de entrega real.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="novoNumero">Novo número *</Label>
              <Input
                id="novoNumero"
                value={novoNumero}
                onChange={(e) => setNovoNumero(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Duplicar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
