"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Building2,
  Truck,
  UserCog,
  GanttChartSquare,
  LogOut,
  Menu,
  X,
  HardHat,
  Package,
  BarChart3,
  Landmark,
  SlidersHorizontal,
  LayoutGrid,
  Wallet,
  Users,
  PieChart,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToggleValores } from "@/components/valores-provider";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  titulo?: string;
  itens: NavItem[];
}

const NAV: NavSection[] = [
  {
    itens: [{ href: "/portal", label: "Painel", icon: LayoutGrid }],
  },
  {
    titulo: "Gestão de Obras",
    itens: [
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/loteamentos", label: "Loteamentos", icon: Building2 },
      { href: "/gantt", label: "Gantt de Obras", icon: GanttChartSquare },
    ],
  },
  {
    titulo: "Inteligência e Viabilidade",
    itens: [
      { href: "/viabilidade", label: "Viabilidade", icon: Landmark },
      { href: "/parametros", label: "Parâmetros", icon: SlidersHorizontal },
    ],
  },
  {
    titulo: "Gestão Administrativa",
    itens: [
      { href: "/financeiro", label: "Financeiro", icon: Wallet },
      { href: "/funcionarios", label: "Funcionários", icon: HardHat },
      { href: "/fornecedores", label: "Fornecedores", icon: Truck },
      { href: "/materiais", label: "Materiais", icon: Package },
      { href: "/corretores", label: "Corretores", icon: UserCog },
    ],
  },
  {
    titulo: "Relatórios e Resultados",
    itens: [{ href: "/relatorios", label: "Relatórios", icon: BarChart3 }],
  },
  {
    titulo: "Investidor",
    itens: [
      { href: "/investidores", label: "Investidores", icon: Users },
      {
        href: "/dashboard-investidor",
        label: "Dashboard Investidor",
        icon: PieChart,
      },
    ],
  },
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
          <BrandLogo size={32} />
          <span className="font-bold text-foreground">Painel RO</span>
        </Link>
        <div className="flex items-center gap-1">
          <ToggleValores className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-card transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="hidden h-16 items-center justify-between gap-3 border-b px-5 lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size={40} />
            <div className="leading-tight">
              <p className="text-base font-bold text-foreground">Painel RO</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Construções
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <ToggleValores className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3 pt-[4.5rem] lg:pt-3 scrollbar-thin">
          {NAV.map((secao, si) => (
            <div key={secao.titulo ?? `sec-${si}`} className="space-y-1">
              {secao.titulo && (
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {secao.titulo}
                </p>
              )}
              {secao.itens.map((item) => {
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
            </div>
          ))}
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

/**
 * Logo da RO Construções — usa o asset com fundo (já tem o azul-marinho da marca),
 * funciona bem em ambos os temas.
 */
function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-border"
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo_com_fundo.jpg"
        alt="RO Construções"
        width={size}
        height={size}
        priority
        className="h-full w-full object-cover"
      />
    </div>
  );
}
