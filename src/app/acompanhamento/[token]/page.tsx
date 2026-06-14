import Image from "next/image";
import { notFound } from "next/navigation";
import { TrendingUp, Wallet, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ETAPAS_OBRA } from "@/lib/constants";
import { getInvestidorPorToken, getAportesDoInvestidor } from "@/lib/queries";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { AcompanhamentoPizza } from "./pizza";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

function retornoDoAporte(a: {
  valor_investido: number;
  retorno_pct: number | null;
  retorno_valor: number | null;
}): number {
  if (a.retorno_valor != null) return Number(a.retorno_valor);
  if (a.retorno_pct != null)
    return (Number(a.valor_investido) * Number(a.retorno_pct)) / 100;
  return 0;
}

export default async function AcompanhamentoPage({ params }: Props) {
  const { token } = await params;
  const investidor = await getInvestidorPorToken(token);
  if (!investidor) notFound();

  const aportes = await getAportesDoInvestidor(investidor.id);
  const totalInvestido = aportes.reduce((s, a) => s + a.valor_investido, 0);
  const totalRetorno = aportes.reduce((s, a) => s + retornoDoAporte(a), 0);

  const porLoteamento = Object.values(
    aportes.reduce<Record<string, { nome: string; valor: number }>>(
      (acc, a) => {
        acc[a.loteamento_nome] = acc[a.loteamento_nome] ?? {
          nome: a.loteamento_nome,
          valor: 0,
        };
        acc[a.loteamento_nome].valor += a.valor_investido;
        return acc;
      },
      {},
    ),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-border">
            <Image
              src="/logo_com_fundo.jpg"
              alt="RO Construções"
              width={40}
              height={40}
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">
              RO Construções e Incorporações
            </p>
            <p className="text-[11px] text-muted-foreground">
              Acompanhamento de investimento
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Olá,
          </p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {investidor.nome}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Veja o resumo dos seus investimentos com a RO Construções.
          </p>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> Total investido
              </p>
              <p className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
                {formatBRL(totalInvestido)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" /> Retorno projetado
              </p>
              <p className="mt-2 text-2xl font-bold text-success sm:text-3xl">
                {formatBRL(totalRetorno)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total + retorno
              </p>
              <p className="mt-2 text-2xl font-bold text-accent sm:text-3xl">
                {formatBRL(totalInvestido + totalRetorno)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico + lotes */}
        {aportes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum investimento registrado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Distribuição por loteamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AcompanhamentoPizza data={porLoteamento} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seus lotes</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lote</TableHead>
                      <TableHead>Loteamento</TableHead>
                      <TableHead>Etapa da obra</TableHead>
                      <TableHead className="text-right">Investido</TableHead>
                      <TableHead className="text-right">Retorno proj.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aportes.map((a) => {
                      const etapa = a.lote_etapa
                        ? ETAPAS_OBRA[a.lote_etapa as keyof typeof ETAPAS_OBRA]
                        : null;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            Lote {a.lote_numero}
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              Q.{a.quadra_identificador}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {a.loteamento_nome}
                            </span>
                          </TableCell>
                          <TableCell>
                            {etapa ? (
                              <Badge variant="muted">
                                {etapa.label} ({etapa.percent}%)
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBRL(a.valor_investido)}
                          </TableCell>
                          <TableCell className="text-right text-success">
                            {formatBRL(retornoDoAporte(a))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t-2 bg-muted/30 font-bold">
                      <TableCell colSpan={3}>TOTAL</TableCell>
                      <TableCell className="text-right">
                        {formatBRL(totalInvestido)}
                      </TableCell>
                      <TableCell className="text-right text-success">
                        {formatBRL(totalRetorno)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Atualizado em {formatDateBR(new Date())} · RO Construções e
          Incorporações
        </p>
      </main>
    </div>
  );
}
