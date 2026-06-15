import { PageHeader } from "@/components/page-header";
import {
  getMunicipiosParametros,
  getCubIndices,
  getZonas,
  getFasesPadraoConfig,
} from "@/lib/queries";
import { ParametrosClient } from "./parametros-client";

export const dynamic = "force-dynamic";

export default async function ParametrosPage() {
  const [municipios, cubs, zonas, fasesPadrao] = await Promise.all([
    getMunicipiosParametros(),
    getCubIndices(),
    getZonas(),
    getFasesPadraoConfig(),
  ]);

  return (
    <>
      <PageHeader
        title="Parâmetros"
        description="Catálogos editáveis: fases padrão da obra, ITBI por cidade, CUB e zonas de uso."
      />
      <ParametrosClient
        municipios={municipios}
        cubs={cubs}
        zonas={zonas}
        fasesPadrao={fasesPadrao}
      />
    </>
  );
}
