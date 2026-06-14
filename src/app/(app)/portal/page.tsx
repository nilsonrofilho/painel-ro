import Link from "next/link";
import {
  HardHat,
  Landmark,
  Wallet,
  Home as HomeIcon,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Camada {
  titulo: string;
  subtitulo: string;
  descricao: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  tags: string[];
  accent: string;
}

const CAMADAS: Camada[] = [
  {
    titulo: "Cockpit de Obras",
    subtitulo: "Módulo principal",
    descricao:
      "Gestão de obras com acompanhamento em tempo real: loteamentos, lotes, Gantt e diário de obra.",
    icon: HardHat,
    href: "/",
    tags: ["Obras", "Cronograma", "Financeiro do lote"],
    accent: "from-primary/20 to-primary/5",
  },
  {
    titulo: "Inteligência de Viabilidade",
    subtitulo: "Análise & cenários",
    descricao:
      "Análise completa de viabilidade e cenários para decisões estratégicas de aquisição de terreno.",
    icon: Landmark,
    href: "/viabilidade",
    tags: ["VGV", "TIR", "Cenários"],
    accent: "from-accent/20 to-accent/5",
  },
  {
    titulo: "Gestão Administrativa",
    subtitulo: "Financeiro & pessoas",
    descricao:
      "Contas a pagar e receber, fluxo de caixa, fornecedores, funcionários e corretores.",
    icon: Wallet,
    href: "/financeiro",
    tags: ["Contas", "Fluxo de caixa", "Cadastros"],
    accent: "from-success/20 to-success/5",
  },
  {
    titulo: "Relatórios & Resultados",
    subtitulo: "Visão consolidada",
    descricao:
      "Relatórios consolidados por etapa, dashboards e indicadores de toda a operação.",
    icon: HomeIcon,
    href: "/relatorios",
    tags: ["Dashboard", "Relatórios", "DRE"],
    accent: "from-primary/15 to-accent/10",
  },
];

export default function PortalPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Planejamento · Viabilidade · Gestão · Resultados
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Portal de Soluções
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha o ambiente que você quer acessar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CAMADAS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.titulo} href={c.href} className="group block">
              <Card
                className={cn(
                  "relative h-full overflow-hidden border-2 p-6 transition-all hover:-translate-y-1 hover:shadow-xl",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
                    c.accent,
                  )}
                />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.subtitulo}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-foreground">
                    {c.titulo}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {c.descricao}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border bg-card/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Acessar ambiente
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
