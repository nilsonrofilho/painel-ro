import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Pencil,
  Home,
  Eye,
  ShoppingCart,
  Wallet,
  Package,
  HardHat,
  FileText,
  Ruler,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb } from "@/components/breadcrumb";
import { BackButton } from "@/components/back-button";
import { StatusLoteBadge } from "@/components/status-badge";
import { EtapaProgress } from "@/components/etapa-progress";
import {
  getLoteContexto,
  getVendasDoLote,
  getFasesDoLote,
  getMateriaisDoLote,
  getAlocacoesDoLote,
  getDocumentosDoLote,
  getCorretores,
  getFornecedores,
  getFuncionarios,
  getMateriaisCatalogo,
  getGastosTotaisLote,
} from "@/lib/queries";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { ETAPAS_OBRA } from "@/lib/constants";
import { DeleteLoteButton } from "./delete-button";
import { DuplicarLoteButton } from "./duplicar-button";
import { VisaoGeralTab } from "./tabs/visao-geral";
import { VendaTab } from "./tabs/venda";
import { ObraCustosTab } from "./tabs/obra-custos";
import { MateriaisTab } from "./tabs/materiais";
import { MaoDeObraTab } from "./tabs/mao-de-obra";
import { DocumentosTab } from "./tabs/documentos";
import { DetalhesTecnicosTab } from "./tabs/detalhes-tecnicos";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LoteDetalhePage({ params }: Props) {
  const { id } = await params;
  const contexto = await getLoteContexto(id);
  if (!contexto) notFound();
  const { lote, quadra, loteamento } = contexto;

  const [
    vendas,
    fases,
    materiais,
    alocacoes,
    documentos,
    corretores,
    fornecedores,
    funcionarios,
    catalogoMateriais,
    gastoTotal,
  ] = await Promise.all([
    getVendasDoLote(id),
    getFasesDoLote(id),
    getMateriaisDoLote(id),
    getAlocacoesDoLote(id),
    getDocumentosDoLote(id),
    getCorretores(),
    getFornecedores(),
    getFuncionarios(),
    getMateriaisCatalogo(),
    getGastosTotaisLote(id),
  ]);

  const etapaCfg = ETAPAS_OBRA[lote.etapa ?? "planejamento"];

  return (
    <>
      <div className="mb-4 flex flex-col gap-2">
        <BackButton />
        <Breadcrumb
          items={[
            { label: "Loteamentos", href: "/loteamentos" },
            { label: loteamento.nome, href: `/loteamentos/${loteamento.id}` },
            {
              label: `Quadra ${quadra.identificador}`,
              href: `/loteamentos/${loteamento.id}/quadras/${quadra.id}`,
            },
            { label: `Lote ${lote.numero}` },
          ]}
        />
      </div>

      {/* Header card */}
      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="relative aspect-square bg-gradient-to-br from-primary/15 to-accent/15 md:aspect-auto">
            {lote.foto_url ? (
              <Image
                src={lote.foto_url}
                alt={`Lote ${lote.numero}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Home className="h-20 w-20 text-primary/40" />
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <StatusLoteBadge status={lote.status} />
                <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                  Lote {lote.numero}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quadra {quadra.identificador} · {loteamento.nome}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/loteamentos/${loteamento.id}/quadras/${quadra.id}/lotes/${id}/editar`}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <DuplicarLoteButton loteId={id} numero={lote.numero} />
                <DeleteLoteButton id={id} numero={lote.numero} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Valor de venda
                </p>
                <p className="text-base font-bold text-primary">
                  {lote.valor_venda ? formatBRL(lote.valor_venda) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Orçamento
                </p>
                <p className="font-medium">
                  {lote.orcamento_total
                    ? formatBRL(lote.orcamento_total)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Gasto até agora
                </p>
                <p className="font-medium">{formatBRL(gastoTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Previsão
                </p>
                <p className="font-medium">
                  {formatDateBR(lote.previsao_entrega)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/30 p-3">
              <EtapaProgress etapa={lote.etapa} showSteps />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="visao-geral" icon={<Eye className="h-4 w-4" />}>
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="venda" icon={<ShoppingCart className="h-4 w-4" />}>
            Venda
          </TabsTrigger>
          <TabsTrigger value="obra-custos" icon={<Wallet className="h-4 w-4" />}>
            Obra & Custos
          </TabsTrigger>
          <TabsTrigger value="materiais" icon={<Package className="h-4 w-4" />}>
            Materiais
          </TabsTrigger>
          <TabsTrigger value="mao-de-obra" icon={<HardHat className="h-4 w-4" />}>
            Mão de Obra
          </TabsTrigger>
          <TabsTrigger value="documentos" icon={<FileText className="h-4 w-4" />}>
            Documentos
          </TabsTrigger>
          <TabsTrigger value="detalhes" icon={<Ruler className="h-4 w-4" />}>
            Detalhes Técnicos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <VisaoGeralTab
            lote={lote}
            loteamento={loteamento}
            quadra={quadra}
            etapaPercent={etapaCfg.percent}
            gastoTotal={gastoTotal}
            vendaAtiva={vendas.find((v) => v.status === "ativa") ?? null}
          />
        </TabsContent>
        <TabsContent value="venda">
          <VendaTab lote={lote} vendas={vendas} corretores={corretores} />
        </TabsContent>
        <TabsContent value="obra-custos">
          <ObraCustosTab lote={lote} fases={fases} gastoTotal={gastoTotal} />
        </TabsContent>
        <TabsContent value="materiais">
          <MateriaisTab
            lote={lote}
            materiais={materiais}
            fases={fases}
            fornecedores={fornecedores}
            catalogo={catalogoMateriais}
          />
        </TabsContent>
        <TabsContent value="mao-de-obra">
          <MaoDeObraTab
            lote={lote}
            alocacoes={alocacoes}
            funcionarios={funcionarios}
          />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentosTab lote={lote} documentos={documentos} />
        </TabsContent>
        <TabsContent value="detalhes">
          <DetalhesTecnicosTab lote={lote} />
        </TabsContent>
      </Tabs>
    </>
  );
}
