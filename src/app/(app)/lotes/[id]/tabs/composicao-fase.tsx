"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addItemComposicao,
  updateItemComposicao,
  deleteItemComposicao,
} from "@/lib/actions/composicao-custo";
import { formatBRL } from "@/lib/utils";
import type { ComposicaoCusto, Material } from "@/lib/supabase/types";

interface Props {
  faseId: string;
  loteId: string;
  itens: ComposicaoCusto[];
  catalogo: Material[];
}

interface Rascunho {
  material_id: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
}

const VAZIO: Rascunho = {
  material_id: "",
  descricao: "",
  unidade: "",
  quantidade: "1",
  valor_unitario: "0",
};

export function ComposicaoFase({ faseId, loteId, itens, catalogo }: Props) {
  const [adicionando, setAdicionando] = React.useState(false);
  const [editando, setEditando] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [rascunho, setRascunho] = React.useState<Rascunho>(VAZIO);

  const total = itens.reduce((s, i) => s + Number(i.valor_total ?? 0), 0);
  const prevTotal =
    Number(rascunho.quantidade || 0) * Number(rascunho.valor_unitario || 0);

  function aplicarMaterial(materialId: string) {
    const mat = catalogo.find((m) => m.id === materialId);
    setRascunho((r) => ({
      ...r,
      material_id: materialId,
      descricao: mat ? mat.nome : r.descricao,
      unidade: mat?.unidade ?? r.unidade,
      valor_unitario: mat?.preco_referencia
        ? String(mat.preco_referencia)
        : r.valor_unitario,
    }));
  }

  function iniciarAdicao() {
    setRascunho(VAZIO);
    setEditando(null);
    setAdicionando(true);
  }

  function iniciarEdicao(item: ComposicaoCusto) {
    setRascunho({
      material_id: item.material_id ?? "",
      descricao: item.descricao,
      unidade: item.unidade ?? "",
      quantidade: String(item.quantidade ?? 0),
      valor_unitario: String(item.valor_unitario ?? 0),
    });
    setEditando(item.id);
    setAdicionando(false);
  }

  function cancelar() {
    setAdicionando(false);
    setEditando(null);
    setRascunho(VAZIO);
  }

  async function salvar() {
    if (!rascunho.descricao.trim()) {
      toast.error("Informe a descrição do item");
      return;
    }
    setSalvando(true);
    try {
      const base = {
        material_id: rascunho.material_id || null,
        descricao: rascunho.descricao.trim(),
        unidade: rascunho.unidade || null,
        quantidade: Number(rascunho.quantidade || 0),
        valor_unitario: Number(rascunho.valor_unitario || 0),
      };
      if (editando) {
        await updateItemComposicao(editando, loteId, base);
        toast.success("Item atualizado");
      } else {
        await addItemComposicao(
          { ...base, fase_id: faseId, ordem: itens.length + 1 },
          loteId,
        );
        toast.success("Item adicionado");
      }
      cancelar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este item da composição?")) return;
    try {
      await deleteItemComposicao(id, loteId);
      toast.success("Item removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  const editorForm = (
    <div className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-12">
      <div className="space-y-1 sm:col-span-3">
        <Label className="text-[10px]">Material (catálogo)</Label>
        <Select
          value={rascunho.material_id}
          onChange={(e) => aplicarMaterial(e.target.value)}
        >
          <option value="">— avulso —</option>
          {catalogo.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1 sm:col-span-3">
        <Label className="text-[10px]">Descrição *</Label>
        <Input
          value={rascunho.descricao}
          placeholder="Ex: Cimento CPII"
          onChange={(e) =>
            setRascunho((r) => ({ ...r, descricao: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[10px]">Unidade</Label>
        <Input
          value={rascunho.unidade}
          placeholder="un, m³, saco"
          onChange={(e) =>
            setRascunho((r) => ({ ...r, unidade: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1 sm:col-span-1">
        <Label className="text-[10px]">Qtd</Label>
        <Input
          type="number"
          step="0.01"
          value={rascunho.quantidade}
          onChange={(e) =>
            setRascunho((r) => ({ ...r, quantidade: e.target.value }))
          }
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-[10px]">Valor unit.</Label>
        <Input
          type="number"
          step="0.01"
          value={rascunho.valor_unitario}
          onChange={(e) =>
            setRascunho((r) => ({ ...r, valor_unitario: e.target.value }))
          }
        />
      </div>
      <div className="flex items-end justify-between gap-2 sm:col-span-12">
        <p className="text-xs text-muted-foreground">
          Total do item:{" "}
          <span className="font-semibold text-foreground">
            {formatBRL(prevTotal)}
          </span>
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={cancelar}
            disabled={salvando}
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={salvar} disabled={salvando}>
            {salvando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {itens.length === 0 && !adicionando ? (
        <p className="text-xs text-muted-foreground">
          Nenhum item de composição. Adicione itens para detalhar e calcular o
          orçamento desta fase automaticamente.
        </p>
      ) : (
        itens.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Unid.</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item) =>
                editando === item.id ? (
                  <TableRow key={item.id}>
                    <TableCell colSpan={6} className="p-2">
                      {editorForm}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.unidade ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantidade}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatBRL(Number(item.valor_unitario ?? 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatBRL(Number(item.valor_total ?? 0))}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => iniciarEdicao(item)}
                          aria-label="Editar item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => excluir(item.id)}
                          aria-label="Excluir item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        )
      )}

      {adicionando && editorForm}

      <div className="flex items-center justify-between">
        {!adicionando && !editando && (
          <Button size="sm" variant="outline" onClick={iniciarAdicao}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar item
          </Button>
        )}
        {itens.length > 0 && (
          <p className="ml-auto text-sm font-semibold">
            Total da composição: {formatBRL(total)}
          </p>
        )}
      </div>
    </div>
  );
}
