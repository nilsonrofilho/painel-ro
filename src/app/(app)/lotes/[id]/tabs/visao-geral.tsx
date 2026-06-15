import Link from "next/link";
import { MapPin, User, Calendar, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatDateBR, formatPercent } from "@/lib/utils";
import type { Lote, Loteamento, Quadra, Venda, Investidor } from "@/lib/supabase/types";
import type { AporteDoLote } from "@/lib/queries";
import { InvestidoresCard } from "../investidores-card";

interface Props {
  lote: Lote;
  loteamento: Loteamento;
  quadra: Quadra;
  etapaPercent: number;
  gastoTotal: number;
  vendaAtiva: Venda | null;
  aportes: AporteDoLote[];
  investidores: Investidor[];
}

export function VisaoGeralTab({
  lote,
  loteamento,
  quadra,
  etapaPercent,
  gastoTotal,
  vendaAtiva,
  aportes,
  investidores,
}: Props) {
  const orcamento = Number(lote.orcamento_total ?? 0);
  const pctUsado = orcamento > 0 ? (gastoTotal / orcamento) * 100 : 0;
  const pctIndicator =
    pctUsado > 100
      ? "bg-destructive"
      : pctUsado > 80
        ? "bg-warning"
        : "bg-success";

  return (
    <div className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" /> Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Empreendimento</p>
            <p className="font-medium">
              <Link
                href={`/loteamentos/${loteamento.id}`}
                className="text-primary hover:underline"
              >
                {loteamento.nome}
              </Link>
            </p>
          </div>
          {loteamento.endereco && (
            <div>
              <p className="text-xs text-muted-foreground">Endereço</p>
              <p className="text-sm">{loteamento.endereco}</p>
            </div>
          )}
          {(loteamento.cidade || loteamento.estado) && (
            <div>
              <p className="text-xs text-muted-foreground">Cidade / UF</p>
              <p className="text-sm">
                {[loteamento.cidade, loteamento.estado]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            </div>
          )}
          {loteamento.lat && loteamento.lng && (
            <a
              href={`https://www.google.com/maps?q=${loteamento.lat},${loteamento.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Abrir no Google Maps →
            </a>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Quadra</p>
            <p className="font-medium">
              <Link
                href={`/loteamentos/${loteamento.id}/quadras/${quadra.id}`}
                className="text-primary hover:underline"
              >
                Quadra {quadra.identificador}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Etapa & orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" /> Obra & Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Etapa da obra</span>
              <span className="font-semibold">{etapaPercent}%</span>
            </div>
            <Progress value={etapaPercent} />
          </div>

          {orcamento > 0 ? (
            <div>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Orçamento usado</span>
                <span className="font-semibold">
                  {formatPercent(pctUsado, 1)}
                </span>
              </div>
              <Progress value={pctUsado} indicatorClassName={pctIndicator} />
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Gasto</p>
                  <p className="font-bold">{formatBRL(gastoTotal)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total previsto</p>
                  <p className="font-bold">{formatBRL(orcamento)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Saldo</p>
                  <p
                    className={
                      orcamento - gastoTotal >= 0
                        ? "font-bold text-success"
                        : "font-bold text-destructive"
                    }
                  >
                    {formatBRL(orcamento - gastoTotal)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Defina um orçamento total para acompanhar o consumo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comercial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Valor de venda</p>
            <p className="text-xl font-bold text-primary">
              {lote.valor_venda ? formatBRL(lote.valor_venda) : "—"}
            </p>
          </div>
          {vendaAtiva ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant={vendaAtiva.tipo === "venda" ? "default" : "warning"}>
                  {vendaAtiva.tipo === "venda" ? "Vendido" : "Reservado"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateBR(vendaAtiva.data)}
                </span>
              </div>
              <p className="font-medium">{vendaAtiva.cliente_nome ?? "—"}</p>
              {vendaAtiva.cliente_telefone && (
                <p className="text-xs text-muted-foreground">
                  {vendaAtiva.cliente_telefone}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Lote disponível para venda ou reserva.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cronograma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" /> Cronograma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Início (loteamento)</p>
              <p className="font-medium">{formatDateBR(loteamento.data_inicio)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Previsão</p>
              <p className="font-medium">{formatDateBR(lote.previsao_entrega)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrega real</p>
              <p className="font-medium">{formatDateBR(lote.data_entrega_real)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/gantt">Ver no Gantt geral</Link>
          </Button>
        </CardContent>
      </Card>
    </div>

      <InvestidoresCard
        loteId={lote.id}
        aportes={aportes}
        investidores={investidores}
      />
    </div>
  );
}
