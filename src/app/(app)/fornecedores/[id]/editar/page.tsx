import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import { FornecedorForm } from "@/components/forms/fornecedor-form";
import { createClient } from "@/lib/supabase/server";
import type { Fornecedor } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarFornecedorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("fornecedores")
    .select("*")
    .eq("id", id)
    .single();
  const fornecedor = data as Fornecedor | null;
  if (!fornecedor) notFound();
  return (
    <>
      <div className="mb-4">
        <BackButton href={`/fornecedores/${id}`} />
      </div>
      <PageHeader title={`Editar: ${fornecedor.razao_social}`} />
      <FornecedorForm fornecedor={fornecedor} />
    </>
  );
}
