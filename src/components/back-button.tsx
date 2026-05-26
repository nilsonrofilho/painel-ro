"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ href, label = "Voltar" }: { href?: string; label?: string }) {
  const router = useRouter();
  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    );
  }
  return (
    <Button variant="ghost" size="sm" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
