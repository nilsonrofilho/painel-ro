"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  Loader2,
  FileText,
  ExternalLink,
  Download,
  FolderSync,
  RefreshCw,
  Check,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import { addDocumento, deleteDocumento } from "@/lib/actions/documentos";
import {
  vincularPastaDrive,
  sincronizarLoteAgora,
} from "@/lib/actions/drive";
import { formatDateTimeBR } from "@/lib/utils";
import type { Documento, Lote } from "@/lib/supabase/types";

const ETAPAS_DOC = [
  "Alvará",
  "ART",
  "Projeto arquitetônico",
  "Projeto estrutural",
  "Habite-se",
  "Contrato de venda",
  "Escritura",
  "Matrícula",
  "IPTU",
  "Outro",
];

interface Props {
  lote: Lote;
  documentos: Documento[];
}

export function DocumentosTab({ lote, documentos }: Props) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [nome, setNome] = React.useState("");
  const [etapa, setEtapa] = React.useState("");

  // Google Drive
  const [pastaInput, setPastaInput] = React.useState(lote.drive_folder_id ?? "");
  const [salvandoPasta, setSalvandoPasta] = React.useState(false);
  const [sincronizando, setSincronizando] = React.useState(false);
  const vinculado = Boolean(lote.drive_folder_id);

  async function handleSalvarPasta() {
    setSalvandoPasta(true);
    try {
      await vincularPastaDrive(lote.id, pastaInput);
      toast.success(
        pastaInput.trim()
          ? "Pasta vinculada. A sincronização começa na próxima verificação."
          : "Pasta desvinculada.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvandoPasta(false);
    }
  }

  async function handleSincronizarAgora() {
    setSincronizando(true);
    try {
      const { importados } = await sincronizarLoteAgora(lote.id);
      toast.success(
        importados > 0
          ? `${importados} arquivo(s) importado(s) do Drive.`
          : "Tudo já sincronizado — nenhum arquivo novo.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSincronizando(false);
    }
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileUrl) {
      toast.error("Selecione um arquivo");
      return;
    }
    setSubmitting(true);
    try {
      await addDocumento({
        entidade_tipo: "lote",
        entidade_id: lote.id,
        nome,
        etapa: etapa || null,
        arquivo_url: fileUrl,
      });
      toast.success("Documento adicionado");
      setOpen(false);
      setFileUrl(null);
      setNome("");
      setEtapa("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este documento?")) return;
    try {
      await deleteDocumento(id, "lote", lote.id);
      toast.success("Documento excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      {/* Sincronização com Google Drive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderSync className="h-4 w-4 text-primary" />
            Pasta do Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cole o link da pasta deste lote no Drive. Tudo que você jogar nela é
            importado automaticamente para os documentos abaixo.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={pastaInput}
              onChange={(e) => setPastaInput(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/…"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSalvarPasta}
              disabled={salvandoPasta}
            >
              {salvandoPasta ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Salvar pasta
            </Button>
          </div>
          {vinculado && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/5 p-2.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <Check className="h-3.5 w-3.5" />
                Pasta vinculada — sincroniza sozinho a cada poucos minutos.
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleSincronizarAgora}
                disabled={sincronizando}
              >
                {sincronizando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sincronizar agora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Documentos do lote ({documentos.length})
          </CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="Nenhum documento ainda"
              description="Anexe alvarás, ART, projetos, habite-se, contratos…"
              action={
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Adicionar primeiro
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {documentos.map((d) => (
                <Card key={d.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(d.id)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <h4 className="line-clamp-2 text-sm font-semibold">
                      {d.nome}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {d.origem === "drive" && (
                        <Badge variant="success" className="gap-1">
                          <FolderSync className="h-2.5 w-2.5" />
                          Drive
                        </Badge>
                      )}
                      {d.etapa && (
                        <span className="text-xs text-muted-foreground">
                          {d.etapa}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Enviado em {formatDateTimeBR(d.uploaded_at)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <a
                        href={d.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Abrir
                      </a>
                      <a
                        href={d.arquivo_url}
                        download={d.nome}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        Baixar
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do documento *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex: Alvará de construção"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="etapa">Categoria / etapa</Label>
              <Select
                id="etapa"
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
              >
                <option value="">—</option>
                {ETAPAS_DOC.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Arquivo *</Label>
              <FileUpload
                bucket="documentos"
                value={fileUrl}
                onChange={setFileUrl}
                pathPrefix={`lote/${lote.id}`}
                accept=".pdf,image/*"
                maxSizeMB={20}
              />
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
              <Button type="submit" disabled={submitting || !fileUrl || !nome}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
