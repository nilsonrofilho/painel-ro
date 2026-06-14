"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveMunicipio,
  deleteMunicipio,
  saveCub,
  deleteCub,
  saveZona,
  deleteZona,
} from "@/lib/actions/parametros-viabilidade";
import {
  ESTADOS_BR,
  ITBI_BASE,
  PADRAO_CONSTRUCAO,
  TIPO_PROJETO_CUB,
} from "@/lib/constants";
import { formatBRL, formatDateBR } from "@/lib/utils";
import type {
  MunicipioParametros,
  CubIndice,
  ZonaUrbanistica,
} from "@/lib/supabase/types";

interface Props {
  municipios: MunicipioParametros[];
  cubs: CubIndice[];
  zonas: ZonaUrbanistica[];
}

export function ParametrosClient({ municipios, cubs, zonas }: Props) {
  return (
    <Tabs defaultValue="municipios">
      <TabsList>
        <TabsTrigger value="municipios">Municípios / ITBI</TabsTrigger>
        <TabsTrigger value="cub">CUB</TabsTrigger>
        <TabsTrigger value="zonas">Zonas de uso</TabsTrigger>
      </TabsList>

      <TabsContent value="municipios">
        <MunicipiosTab municipios={municipios} />
      </TabsContent>
      <TabsContent value="cub">
        <CubTab cubs={cubs} />
      </TabsContent>
      <TabsContent value="zonas">
        <ZonasTab zonas={zonas} />
      </TabsContent>
    </Tabs>
  );
}

// ============================================================
// Municípios
// ============================================================
function MunicipiosTab({ municipios }: { municipios: MunicipioParametros[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MunicipioParametros | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await saveMunicipio(
        {
          municipio: String(fd.get("municipio") ?? ""),
          estado: String(fd.get("estado") ?? ""),
          itbi_aliquota_pct: Number(fd.get("itbi_aliquota_pct") ?? 2),
          itbi_base: (fd.get("itbi_base") as
            | "valor_transacao"
            | "valor_venal"
            | "maior_entre") ?? "maior_entre",
          areas_publicas_min_pct: fd.get("areas_publicas_min_pct")
            ? Number(fd.get("areas_publicas_min_pct"))
            : null,
          observacao: (fd.get("observacao") as string) || null,
          ativo: true,
        },
        editing?.id,
      );
      toast.success(editing ? "Município atualizado" : "Município criado");
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este município?")) return;
    try {
      await deleteMunicipio(id);
      toast.success("Excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Municípios e ITBI</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo município
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Município</TableHead>
              <TableHead>UF</TableHead>
              <TableHead className="text-right">ITBI</TableHead>
              <TableHead>Base</TableHead>
              <TableHead className="w-20 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {municipios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nenhum município cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              municipios.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.municipio}</TableCell>
                  <TableCell>{m.estado}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {m.itbi_aliquota_pct}%
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ITBI_BASE[m.itbi_base]}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => {
                        setEditing(m);
                        setOpen(true);
                      }}
                      onDelete={() => handleDelete(m.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar município" : "Novo município"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handle} className="space-y-3" key={editing?.id ?? "novo"}>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="municipio">Município *</Label>
                <Input id="municipio" name="municipio" required defaultValue={editing?.municipio ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado">UF *</Label>
                <Select id="estado" name="estado" required defaultValue={editing?.estado ?? ""}>
                  <option value="">—</option>
                  {ESTADOS_BR.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="itbi_aliquota_pct">Alíquota ITBI (%)</Label>
                <Input id="itbi_aliquota_pct" name="itbi_aliquota_pct" type="number" step="0.01" defaultValue={editing?.itbi_aliquota_pct ?? 2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itbi_base">Base de cálculo</Label>
                <Select id="itbi_base" name="itbi_base" defaultValue={editing?.itbi_base ?? "maior_entre"}>
                  {Object.entries(ITBI_BASE).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="areas_publicas_min_pct">Áreas públicas mín. (% — loteamento)</Label>
              <Input id="areas_publicas_min_pct" name="areas_publicas_min_pct" type="number" step="0.01" defaultValue={editing?.areas_publicas_min_pct ?? 35} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observação</Label>
              <Input id="observacao" name="observacao" defaultValue={editing?.observacao ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================
// CUB
// ============================================================
function CubTab({ cubs }: { cubs: CubIndice[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CubIndice | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await saveCub(
        {
          estado: String(fd.get("estado") ?? ""),
          padrao: (fd.get("padrao") as "baixo" | "normal" | "alto") ?? "normal",
          tipo_projeto: String(fd.get("tipo_projeto") ?? "R1"),
          valor_m2: Number(fd.get("valor_m2") ?? 0),
          mes_referencia: String(fd.get("mes_referencia") ?? ""),
          fonte: (fd.get("fonte") as string) || null,
        },
        editing?.id,
      );
      toast.success(editing ? "CUB atualizado" : "CUB criado");
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este CUB?")) return;
    try {
      await deleteCub(id);
      toast.success("Excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">CUB (R$/m²)</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo CUB
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UF</TableHead>
              <TableHead>Padrão</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor/m²</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead className="w-20 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Nenhum CUB cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              cubs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.estado}</TableCell>
                  <TableCell className="capitalize">{c.padrao}</TableCell>
                  <TableCell>{c.tipo_projeto}</TableCell>
                  <TableCell className="text-right font-semibold">{formatBRL(c.valor_m2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateBR(c.mes_referencia)}</TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => { setEditing(c); setOpen(true); }}
                      onDelete={() => handleDelete(c.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar CUB" : "Novo CUB"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handle} className="space-y-3" key={editing?.id ?? "novo"}>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="estado">UF *</Label>
                <Select id="estado" name="estado" required defaultValue={editing?.estado ?? ""}>
                  <option value="">—</option>
                  {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="padrao">Padrão</Label>
                <Select id="padrao" name="padrao" defaultValue={editing?.padrao ?? "normal"}>
                  {Object.entries(PADRAO_CONSTRUCAO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo_projeto">Tipo</Label>
                <Select id="tipo_projeto" name="tipo_projeto" defaultValue={editing?.tipo_projeto ?? "R1"}>
                  {TIPO_PROJETO_CUB.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="valor_m2">Valor/m² (R$) *</Label>
                <Input id="valor_m2" name="valor_m2" type="number" step="0.01" required defaultValue={editing?.valor_m2 ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mes_referencia">Mês de referência *</Label>
                <Input id="mes_referencia" name="mes_referencia" type="date" required defaultValue={editing?.mes_referencia ?? new Date().toISOString().slice(0, 10)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fonte">Fonte</Label>
              <Input id="fonte" name="fonte" placeholder="Ex: Sinduscon-RN" defaultValue={editing?.fonte ?? ""} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ============================================================
// Zonas
// ============================================================
function ZonasTab({ zonas }: { zonas: ZonaUrbanistica[] }) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ZonaUrbanistica | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await saveZona(
        {
          municipio: String(fd.get("municipio") ?? ""),
          estado: String(fd.get("estado") ?? ""),
          zona: String(fd.get("zona") ?? ""),
          descricao: (fd.get("descricao") as string) || null,
          densidade: (fd.get("densidade") as string) || null,
          to_pct: Number(fd.get("to_pct") ?? 50),
          ca_basico: Number(fd.get("ca_basico") ?? 1),
          ca_maximo: fd.get("ca_maximo") ? Number(fd.get("ca_maximo")) : null,
          recuo_frontal_m: fd.get("recuo_frontal_m") ? Number(fd.get("recuo_frontal_m")) : null,
          recuo_lateral_m: fd.get("recuo_lateral_m") ? Number(fd.get("recuo_lateral_m")) : null,
          recuo_fundos_m: fd.get("recuo_fundos_m") ? Number(fd.get("recuo_fundos_m")) : null,
          gabarito_max_m: fd.get("gabarito_max_m") ? Number(fd.get("gabarito_max_m")) : null,
          gabarito_max_pavimentos: fd.get("gabarito_max_pavimentos") ? Number(fd.get("gabarito_max_pavimentos")) : null,
          taxa_permeabilidade_pct: fd.get("taxa_permeabilidade_pct") ? Number(fd.get("taxa_permeabilidade_pct")) : null,
          permite_outorga: fd.get("permite_outorga") === "on",
          valor_m2_terreno_pgv: fd.get("valor_m2_terreno_pgv") ? Number(fd.get("valor_m2_terreno_pgv")) : null,
        },
        editing?.id,
      );
      toast.success(editing ? "Zona atualizada" : "Zona criada");
      setOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta zona?")) return;
    try {
      await deleteZona(id);
      toast.success("Excluída");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Zonas de uso</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nova zona
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Município</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead className="text-right">TO</TableHead>
              <TableHead className="text-right">CA básico</TableHead>
              <TableHead className="text-right">CA máx</TableHead>
              <TableHead className="w-20 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zonas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Nenhuma zona cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              zonas.map((z) => (
                <TableRow key={z.id}>
                  <TableCell className="text-sm">{z.municipio}/{z.estado}</TableCell>
                  <TableCell className="font-medium">{z.zona}</TableCell>
                  <TableCell className="text-right">{z.to_pct}%</TableCell>
                  <TableCell className="text-right">{z.ca_basico}</TableCell>
                  <TableCell className="text-right">{z.ca_maximo ?? "—"}</TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => { setEditing(z); setOpen(true); }}
                      onDelete={() => handleDelete(z.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar zona" : "Nova zona"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handle} className="space-y-3" key={editing?.id ?? "novo"}>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="municipio">Município *</Label>
                <Input id="municipio" name="municipio" required defaultValue={editing?.municipio ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estado">UF *</Label>
                <Select id="estado" name="estado" required defaultValue={editing?.estado ?? ""}>
                  <option value="">—</option>
                  {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zona">Zona *</Label>
                <Input id="zona" name="zona" required placeholder="ZR-1" defaultValue={editing?.zona ?? ""} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" name="descricao" defaultValue={editing?.descricao ?? ""} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="to_pct">TO (%)</Label>
                <Input id="to_pct" name="to_pct" type="number" step="0.01" defaultValue={editing?.to_pct ?? 50} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ca_basico">CA básico</Label>
                <Input id="ca_basico" name="ca_basico" type="number" step="0.01" defaultValue={editing?.ca_basico ?? 1} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ca_maximo">CA máximo</Label>
                <Input id="ca_maximo" name="ca_maximo" type="number" step="0.01" defaultValue={editing?.ca_maximo ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recuo_frontal_m">Recuo frontal (m)</Label>
                <Input id="recuo_frontal_m" name="recuo_frontal_m" type="number" step="0.01" defaultValue={editing?.recuo_frontal_m ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recuo_lateral_m">Recuo lateral (m)</Label>
                <Input id="recuo_lateral_m" name="recuo_lateral_m" type="number" step="0.01" defaultValue={editing?.recuo_lateral_m ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recuo_fundos_m">Recuo fundos (m)</Label>
                <Input id="recuo_fundos_m" name="recuo_fundos_m" type="number" step="0.01" defaultValue={editing?.recuo_fundos_m ?? ""} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gabarito_max_m">Gabarito (m)</Label>
                <Input id="gabarito_max_m" name="gabarito_max_m" type="number" step="0.01" defaultValue={editing?.gabarito_max_m ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxa_permeabilidade_pct">Permeabilidade (%)</Label>
                <Input id="taxa_permeabilidade_pct" name="taxa_permeabilidade_pct" type="number" step="0.01" defaultValue={editing?.taxa_permeabilidade_pct ?? ""} />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  id="permite_outorga"
                  name="permite_outorga"
                  type="checkbox"
                  defaultChecked={editing?.permite_outorga ?? false}
                  className="h-4 w-4 accent-primary"
                />
                <Label htmlFor="permite_outorga">Permite outorga</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} aria-label="Editar">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={onDelete} aria-label="Excluir">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
