import { notFound } from "next/navigation";
import { User, Phone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/breadcrumb";
import { BackButton } from "@/components/back-button";
import { getInvestidor, getAportesDoInvestidor } from "@/lib/queries";
import { getOpcoesFiltro } from "@/lib/filters";
import { InvestidorActions } from "../actions";
import { InvestidorPainel } from "./painel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvestidorDetalhePage({ params }: Props) {
  const { id } = await params;
  const investidor = await getInvestidor(id);
  if (!investidor) notFound();

  const [aportes, opcoes] = await Promise.all([
    getAportesDoInvestidor(id),
    getOpcoesFiltro(),
  ]);
  const lotes = opcoes.lotes;

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <BackButton href="/investidores" />
        <Breadcrumb
          items={[
            { label: "Investidores", href: "/investidores" },
            { label: investidor.nome },
          ]}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{investidor.nome}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {investidor.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {investidor.telefone}
                  </span>
                )}
                {investidor.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {investidor.email}
                  </span>
                )}
              </div>
              {!investidor.ativo && (
                <Badge variant="muted" className="mt-2">
                  Inativo
                </Badge>
              )}
            </div>
          </div>
          <InvestidorActions investidor={investidor} trigger="row" />
        </CardContent>
      </Card>

      <InvestidorPainel
        investidor={investidor}
        aportes={aportes}
        lotes={lotes}
      />
    </>
  );
}
