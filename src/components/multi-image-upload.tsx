"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface MultiImageUploadProps {
  bucket: string;
  value: string[];
  onChange: (urls: string[]) => void;
  pathPrefix?: string;
  maxSizeMB?: number;
  className?: string;
}

export function MultiImageUpload({
  bucket,
  value,
  onChange,
  pathPrefix = "",
  maxSizeMB = 5,
  className,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const supabase = createClient();
    const novas: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name}: maior que ${maxSizeMB}MB`);
          continue;
        }
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${pathPrefix ? pathPrefix + "/" : ""}${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) {
          toast.error(`${file.name}: ${error.message}`);
          continue;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        novas.push(data.publicUrl);
      }
      if (novas.length > 0) {
        onChange([...value, ...novas]);
        toast.success(`${novas.length} foto(s) enviada(s)`);
      }
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border"
          >
            <Image
              src={url}
              alt="Foto da obra"
              fill
              className="object-cover"
              sizes="120px"
              unoptimized
            />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute right-1 top-1 rounded-md bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover foto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label
          className={cn(
            "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/20 text-center text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5",
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
            disabled={uploading}
            className="sr-only"
          />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-[10px]">Adicionar</span>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
