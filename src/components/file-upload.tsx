"use client";

import * as React from "react";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  bucket: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  pathPrefix?: string;
  accept?: string;
  className?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  bucket,
  value,
  onChange,
  pathPrefix = "",
  accept = ".pdf,image/*",
  className,
  maxSizeMB = 10,
}: FileUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máx: ${maxSizeMB}MB`);
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${pathPrefix ? pathPrefix + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      setFileName(file.name);
      toast.success("Arquivo enviado");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Falha no upload";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3",
          className,
        )}
      >
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">{fileName ?? "Arquivo enviado"}</span>
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange(null);
            setFileName(null);
          }}
          aria-label="Remover arquivo"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5",
        className,
      )}
    >
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        disabled={uploading}
        className="sr-only"
      />
      {uploading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Upload className="h-4 w-4 text-primary" />
      )}
      <span>
        {uploading ? "Enviando…" : "Selecionar arquivo"}
      </span>
    </label>
  );
}
