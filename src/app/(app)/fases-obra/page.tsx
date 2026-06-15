import Link from "next/link";
import { ListChecks, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";
import { KPICard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FiltroLoteamentoLote } from "@/components/filtro-loteamento-lote";
import { getLotesComProgressoFases } from "@/lib/queries";
import { getOpcoesFiltro, parseFiltro } from "@/lib/filters";
import { formatBRL, formatPercent } from "@/lib/utils";
import { AplicarFasesEmMassa } from "./aplicar-massa";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ loteamento?: string; lote?: string }>;
}

export default async function FasesObraPage({ searchParams }: Props) {
  const filtro = parseFiltro(await searchParams);
  const [lotes, opcoes] = await Promise.all([
    getLotesComProgressoFases(filtro),
    getOpcoesFiltro(),
  ]);

  const comFases = lotes.filter((l) => l.totalFases > 0);
  const semFases = lotes
    .filter((l) => l.totalFases === 0)
    .map((l) => ({
      loteId: l.loteId,
      numero: l.numero,
      loteamentoNome: l.loteamentoNome,
      quadraIdentificador: l.quadraIdentificador,
    }));
  const totalOrcado = lotes.reduce((s, l) => s + l.orcado, 0);
  const totalGasto = lotes.reduce((s, l) => s + l.gasto, 0);
  const pctMedio =
    comFases.length > 0
      ? Math.round(
          comFases.reduce((s, l) => s + l.pctConcluido, 0) / comFases.length,
        )
      : 0;

  return (
    <>
      <PageHeader
        title="Fases da obra"
        description="Andamento das fases de obra de todos os lotes"
      />

      <div className="mb-6">
        <FiltroLoteamentoLote
          loteamentos={opcoes.loteamentos}
          lotes={opcoes.lotes}
        />
      </div>

      {semFases.length > 0 && <AplicarFasesEmMassa lotes={semFases} />}

      {lotes.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-7 w-7" />}
          title="Nenhum lote para mostrar"
          description="Ajuste o filtro ou cadastre lotes e suas fases de obra."
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KPICard label="Lotes" value={lotes.length} variant="primary" />
            <KPICard label="Com fases" value={comFases.length} />
            <KPICard
              label="Avanço médio"
              value={formatPercent(pctMedio, 0)}
              variant="accent"
            />
            <KPICard
              label="Orçado x gasto"
              value={formatBRL(totalGasto)}
              hint={`de ${formatBRL(totalOrcado)} orçado`}
              variant={totalGasto > totalOrcado ? "destructive" : "default"}
              currency
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lotes e suas fases</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Fases</TableHead>
                    <TableHead className="w-40">Avanço</TableHead>
                    <TableHead>Próxima fase</TableHead>
                    <TableHead className="text-right">Orçado</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lotes.map((l) => {
                    const indicator =
                      l.pctConcluido >= 100
                        ? "bg-success"
                        : l.pctConcluido > 0
                          ? "bg-accent"
                          : "bg-muted-foreground/40";
                    return (
                      <TableRow key={l.loteId} className="group">
                        <TableCell>
                          <Link
                            href={`/lotes/${l.loteId}`}
                            className="block hover:underline"
                          >
                            <p className="font-medium">Lote {l.numero}</p>
                            <p className="text-[11px] text-muted-foreground">
                              Q. {l.quadraIdentificador} · {l.loteamentoNome}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {l.totalFases === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              sem fases
                            </span>
                          ) : (
                            <span className="text-sm">
                              <span className="font-semibold">
                                {l.concluidas}
                              </span>
                              /{l.totalFases} concluídas
                              {l.emAndamento > 0 && (
                                <span className="ml-1 text-[10px] text-warning">
                                  ({l.emAndamento} em andamento)
                                </span>
                              )}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {l.totalFases > 0 ? (
                            <>
                              <Progress
                                value={l.pctConcluido}
                                indicatorClassName={indicator}
                              />
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {formatPercent(l.pctConcluido, 0)}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {l.pctConcluido >= 100 ? (
                            <Badge variant="success">Concluído</Badge>
                          ) : l.proximaFase ? (
                            <span className="text-sm">{l.proximaFase}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatBRL(l.orcado)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatBRL(l.gasto)}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/lotes/${l.loteId}`}
                            aria-label={`Abrir lote ${l.numero}`}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
