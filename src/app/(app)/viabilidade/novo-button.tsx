"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createViabilidade } from "@/lib/actions/viabilidade";
import { ESTADOS_BR, TIPO_EMPREENDIMENTO } from "@/lib/constants";

export function NovoEstudoButton({
  variant = "default",
}: {
  variant?: "default" | "empty";
}) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await createViabilidade({
        nome: String(fd.get("nome") ?? ""),
        municipio: (fd.get("municipio") as string) || null,
        estado: (fd.get("estado") as string) || null,
        tipo_empreendimento: (fd.get("tipo_empreendimento") as
          | "loteamento"
          | "casas"
          | "vertical"
          | "misto") ?? "loteamento",
        area_terreno_m2: fd.get("area_terreno_m2")
          ? Number(fd.get("area_terreno_m2"))
          : null,
        custo_terreno: fd.get("custo_terreno")
          ? Number(fd.get("custo_terreno"))
          : null,
      });
      toast.success("Estudo criado");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("NEXT_REDIRECT")) toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {variant === "empty" ? "Criar primeiro estudo" : "Novo estudo"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo estudo de viabilidade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handle} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do estudo *</Label>
              <Input
                id="nome"
                name="nome"
                required
                placeholder="Ex: Terreno Av. Eng. Roberto Freire — Natal"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px]">
              <div className="space-y-1.5">
                <Label htmlFor="municipio">Município</Label>
                <Input id="municipio" name="municipio" placeholder="Natal" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado">Estado</Label>
                <Select id="estado" name="estado" defaultValue="">
                  <option value="">—</option>
                  {ESTADOS_BR.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo_empreendimento">Tipo de empreendimento</Label>
              <Select
                id="tipo_empreendimento"
                name="tipo_empreendimento"
                defaultValue="loteamento"
              >
                {Object.entries(TIPO_EMPREENDIMENTO).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="area_terreno_m2">Área do terreno (m²)</Label>
                <Input
                  id="area_terreno_m2"
                  name="area_terreno_m2"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custo_terreno">Custo do terreno (R$)</Label>
                <Input
                  id="custo_terreno"
                  name="custo_terreno"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
