"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Building2,
  Users,
  Truck,
  UserCog,
  GanttChartSquare,
  LogOut,
  Menu,
  X,
  HardHat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/loteamentos", label: "Loteamentos", icon: Building2 },
  { href: "/gantt", label: "Gantt de Obras", icon: GanttChartSquare },
  { href: "/funcionarios", label: "Funcionários", icon: HardHat },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/corretores", label: "Corretores", icon: UserCog },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: { email?: string | null } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size={28} />
          <span className="font-bold text-primary">Painel RO</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-card transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="hidden h-16 items-center gap-3 border-b px-5 lg:flex">
          <BrandLogo size={36} />
          <div className="leading-tight">
            <p className="text-base font-bold text-primary">Painel RO</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Construções
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-[4.5rem] lg:pt-3 scrollbar-thin">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          {user?.email && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.email[0]?.toUpperCase() ?? "U"}
              </div>
              <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 lg:pl-64">
        <div className="min-h-screen pt-14 lg:pt-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="40" height="40" rx="8" fill="hsl(var(--brand-primary))" />
      <path
        d="M10 28V14h8.5c2.5 0 4.2 1.5 4.2 3.8 0 1.9-1.1 3.3-3 3.7L23.5 28H20l-3.4-6h-3v6H10zm3.6-9h4.4c1.4 0 2.3-.7 2.3-1.9 0-1.2-.9-1.9-2.3-1.9h-4.4V19z"
        fill="white"
      />
      <circle cx="28" cy="14" r="3" fill="hsl(var(--brand-accent))" />
    </svg>
  );
}
