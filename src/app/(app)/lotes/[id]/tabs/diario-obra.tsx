"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  UserCheck,
  UserX,
  ClipboardCheck,
  CloudSun,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultiImageUpload } from "@/components/multi-image-upload";
import {
  addDiarioObra,
  updateDiarioObra,
  deleteDiarioObra,
} from "@/lib/actions/diario-obra";
import { formatDateBR } from "@/lib/utils";
import type { DiarioObra, Funcionario, Lote } from "@/lib/supabase/types";

const CLIMA_LABEL: Record<string, string> = {
  ensolarado: "☀️ Ensolarado",
  parcialmente_nublado: "⛅ Parc. nublado",
  nublado: "☁️ Nublado",
  garoa: "🌦️ Garoa",
  chuvoso: "🌧️ Chuvoso",
};

interface Props {
  lote: Lote;
  diarios: DiarioObra[];
  funcionarios: Funcionario[];
}

export function DiarioObraTab({ lote, diarios, funcionarios }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editing, setEditing] = React.useState<DiarioObra | null>(null);
  const [fotos, setFotos] = React.useState<string[]>([]);

  function openNew() {
    setEditing(null);
    setFotos([]);
    setOpen(true);
  }

  function openEdit(d: DiarioObra) {
    setEditing(d);
    setFotos(d.fotos ?? []);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setFotos([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const payload = {
        lote_id: lote.id,
        data: String(fd.get("data") ?? ""),
        responsavel_id: (fd.get("responsavel_id") as string) || null,
        total_efetivo: Number(fd.get("total_efetivo") ?? 0),
        presentes: Number(fd.get("presentes") ?? 0),
        ausentes: Number(fd.get("ausentes") ?? 0),
        atividades_executadas: Number(fd.get("atividades_executadas") ?? 0),
        clima: (fd.get("clima") as string) || null,
        resumo_atividades: (fd.get("resumo_atividades") as string) || null,
        observacao: (fd.get("observacao") as string) || null,
        fotos,
      } as Parameters<typeof addDiarioObra>[0];

      if (editing) {
        await updateDiarioObra(editing.id, payload);
        toast.success("Diário atualizado");
      } else {
        await addDiarioObra(payload);
        toast.success("Diário registrado");
      }
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este registro de diário?")) return;
    try {
      await deleteDiarioObra(id, lote.id);
      toast.success("Diário excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Diário de Obra ({diarios.length})
          </CardTitle>
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo registro
          </Button>
        </CardHeader>
        <CardContent>
          {diarios.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-7 w-7" />}
              title="Nenhum registro ainda"
              description="Registre o dia a dia da obra: efetivo, atividades, clima e fotos."
              action={
                <Button size="sm" onClick={openNew}>
                  <Plus className="h-4 w-4" />
                  Primeiro registro
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {diarios.map((d) => {
                const resp = funcionarios.find((f) => f.id === d.responsavel_id);
                return (
                  <Card key={d.id} className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="flex items-center gap-2 font-semibold capitalize">
                            <Calendar className="h-4 w-4 text-primary" />
                            {new Date(d.data + "T00:00:00").toLocaleDateString(
                              "pt-BR",
                              { weekday: "long", day: "2-digit", month: "long" },
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDateBR(d.data)}
                            {resp ? ` · Resp.: ${resp.nome}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {d.clima && (
                            <Badge variant="muted">
                              {CLIMA_LABEL[d.clima] ?? d.clima}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(d)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(d.id)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Stat
                          icon={<Users className="h-4 w-4" />}
                          label="Efetivo"
                          value={d.total_efetivo}
                        />
                        <Stat
                          icon={<UserCheck className="h-4 w-4 text-success" />}
                          label="Presentes"
                          value={d.presentes}
                        />
                        <Stat
                          icon={<UserX className="h-4 w-4 text-destructive" />}
                          label="Ausentes"
                          value={d.ausentes}
                        />
                        <Stat
                          icon={<ClipboardCheck className="h-4 w-4 text-accent" />}
                          label="Atividades"
                          value={d.atividades_executadas}
                        />
                      </div>

                      {d.resumo_atividades && (
                        <p className="mt-3 whitespace-pre-line rounded-lg bg-background p-3 text-sm">
                          {d.resumo_atividades}
                        </p>
                      )}

                      {d.fotos && d.fotos.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {d.fotos.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square overflow-hidden rounded-lg border"
                            >
                              <Image
                                src={url}
                                alt="Foto da obra"
                                fill
                                className="object-cover transition-transform hover:scale-105"
                                sizes="120px"
                                unoptimized
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal novo/editar */}
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar registro do diário" : "Novo registro do diário"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            key={editing?.id ?? "novo"}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  name="data"
                  type="date"
                  required
                  defaultValue={
                    editing?.data ?? new Date().toISOString().slice(0, 10)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clima">
                  <CloudSun className="mr-1 inline h-3.5 w-3.5" />
                  Clima
                </Label>
                <Select
                  id="clima"
                  name="clima"
                  defaultValue={editing?.clima ?? ""}
                >
                  <option value="">—</option>
                  <option value="ensolarado">☀️ Ensolarado</option>
                  <option value="parcialmente_nublado">⛅ Parc. nublado</option>
                  <option value="nublado">☁️ Nublado</option>
                  <option value="garoa">🌦️ Garoa</option>
                  <option value="chuvoso">🌧️ Chuvoso</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="total_efetivo">Efetivo</Label>
                <Input
                  id="total_efetivo"
                  name="total_efetivo"
                  type="number"
                  min="0"
                  defaultValue={editing?.total_efetivo ?? 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="presentes">Presentes</Label>
                <Input
                  id="presentes"
                  name="presentes"
                  type="number"
                  min="0"
                  defaultValue={editing?.presentes ?? 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ausentes">Ausentes</Label>
                <Input
                  id="ausentes"
                  name="ausentes"
                  type="number"
                  min="0"
                  defaultValue={editing?.ausentes ?? 0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="atividades_executadas">Atividades</Label>
                <Input
                  id="atividades_executadas"
                  name="atividades_executadas"
                  type="number"
                  min="0"
                  defaultValue={editing?.atividades_executadas ?? 0}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="responsavel_id">Responsável técnico</Label>
              <Select
                id="responsavel_id"
                name="responsavel_id"
                defaultValue={editing?.responsavel_id ?? ""}
              >
                <option value="">—</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                    {f.funcao ? ` — ${f.funcao}` : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resumo_atividades">Resumo das atividades</Label>
              <Textarea
                id="resumo_atividades"
                name="resumo_atividades"
                rows={3}
                placeholder="Ex: Concretagem das vigas baldrame, montagem de formas…"
                defaultValue={editing?.resumo_atividades ?? ""}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observações</Label>
              <Textarea
                id="observacao"
                name="observacao"
                rows={2}
                defaultValue={editing?.observacao ?? ""}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Registro fotográfico</Label>
              <MultiImageUpload
                bucket="diario-obra"
                value={fotos}
                onChange={setFotos}
                pathPrefix={lote.id}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={close}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background p-2.5">
      {icon}
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
