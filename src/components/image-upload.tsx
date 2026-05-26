"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  bucket: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  pathPrefix?: string;
  accept?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
  maxSizeMB?: number;
}

const aspectClass: Record<NonNullable<ImageUploadProps["aspectRatio"]>, string> = {
  square: "aspect-square",
  video: "aspect-video",
  auto: "min-h-[200px]",
};

export function ImageUpload({
  bucket,
  value,
  onChange,
  pathPrefix = "",
  accept = "image/*",
  className,
  aspectRatio = "video",
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
      toast.success("Imagem enviada");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Falha no upload";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  if (value) {
    return (
      <div className={cn("group relative overflow-hidden rounded-xl border", aspectClass[aspectRatio], className)}>
        <Image
          src={value}
          alt="Imagem"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onChange(null)}
          aria-label="Remover imagem"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5",
        aspectClass[aspectRatio],
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        disabled={uploading}
        className="sr-only"
      />
      {uploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Enviando…</p>
        </>
      ) : (
        <>
          <div className="rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-110">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Clique ou arraste uma imagem
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG ou WEBP até {maxSizeMB}MB
            </p>
          </div>
        </>
      )}
    </label>
  );
}
