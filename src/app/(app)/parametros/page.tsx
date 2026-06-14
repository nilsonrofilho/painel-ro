import { PageHeader } from "@/components/page-header";
import {
  getMunicipiosParametros,
  getCubIndices,
  getZonas,
} from "@/lib/queries";
import { ParametrosClient } from "./parametros-client";

export const dynamic = "force-dynamic";

export default async function ParametrosPage() {
  const [municipios, cubs, zonas] = await Promise.all([
    getMunicipiosParametros(),
    getCubIndices(),
    getZonas(),
  ]);

  return (
    <>
      <PageHeader
        title="Parâmetros"
        description="Catálogos editáveis usados nos estudos de viabilidade: ITBI por cidade, CUB e zonas de uso."
      />
      <ParametrosClient municipios={municipios} cubs={cubs} zonas={zonas} />
    </>
  );
}
