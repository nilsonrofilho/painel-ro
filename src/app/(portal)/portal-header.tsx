"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function PortalHeader({ email }: { email?: string | null }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/60 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-border">
          <Image
            src="/logo_com_fundo.jpg"
            alt="RO Construções"
            width={36}
            height={36}
            priority
          />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">Painel RO</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Construções
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {email && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {email}
          </span>
        )}
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
