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
import { duplicarQuadra } from "@/lib/actions/quadras";

export function DuplicarQuadraButton({
  quadraId,
  identificador,
}: {
  quadraId: string;
  identificador: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [novoIdent, setNovoIdent] = React.useState("");
  const [incluirLotes, setIncluirLotes] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setNovoIdent(`${identificador}-cópia`);
      setIncluirLotes(true);
    }
  }, [open, identificador]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await duplicarQuadra(quadraId, {
        incluirLotes,
        novoIdentificador: novoIdent || undefined,
      });
      toast.success("Quadra duplicada");
    } catch (err) {
      // redirect() lança NEXT_REDIRECT — ignora silenciosamente
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
            <DialogTitle>Duplicar Quadra {identificador}</DialogTitle>
            <DialogDescription>
              Cria uma nova quadra com os mesmos dados. Os lotes podem ser
              copiados também — sem vínculo com vendas, materiais ou alocações
              do original.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handle} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="novoIdent">Novo identificador *</Label>
              <Input
                id="novoIdent"
                value={novoIdent}
                onChange={(e) => setNovoIdent(e.target.value)}
                required
              />
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={incluirLotes}
                onChange={(e) => setIncluirLotes(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <div>
                <p className="font-medium text-foreground">Copiar lotes também</p>
                <p className="text-xs text-muted-foreground">
                  Reseta status para Disponível, sem valor de venda nem entrega real.
                </p>
              </div>
            </label>
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
