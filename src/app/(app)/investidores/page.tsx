import Link from "next/link";
import { Users, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import { getInvestidores } from "@/lib/queries";
import { formatBRL } from "@/lib/utils";
import { InvestidorActions } from "./actions";

export const dynamic = "force-dynamic";

export default async function InvestidoresPage() {
  const investidores = await getInvestidores();
  const totalGeral = investidores.reduce((s, i) => s + i.total_investido, 0);
  const retornoGeral = investidores.reduce((s, i) => s + i.retorno_projetado, 0);

  return (
    <>
      <PageHeader
        title="Investidores"
        description={`${investidores.length} investidor(es) cadastrado(s)`}
        actions={<InvestidorActions />}
      />

      {investidores.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KPICard
            label="Total captado"
            value={formatBRL(totalGeral)}
            variant="primary"
            currency
          />
          <KPICard
            label="Retorno projetado"
            value={formatBRL(retornoGeral)}
            variant="success"
            currency
          />
          <KPICard label="Investidores" value={investidores.length} />
        </div>
      )}

      {investidores.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Nenhum investidor ainda"
          description="Cadastre investidores e vincule aportes aos lotes para acompanhar o investimento de cada um."
          action={<InvestidorActions trigger="empty" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {investidores.map((inv) => (
            <Link key={inv.id} href={`/investidores/${inv.id}`} className="group">
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    {!inv.ativo && <Badge variant="muted">Inativo</Badge>}
                  </div>
                  <h3 className="mt-3 line-clamp-1 font-semibold">{inv.nome}</h3>
                  {inv.email && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {inv.email}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Investido
                      </p>
                      <p className="font-bold text-primary">
                        {formatBRL(inv.total_investido)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Lotes
                      </p>
                      <p className="font-bold">{inv.qtd_lotes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
