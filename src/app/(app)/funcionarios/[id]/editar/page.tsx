import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import { FuncionarioForm } from "@/components/forms/funcionario-form";
import { createClient } from "@/lib/supabase/server";
import type { Funcionario } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarFuncionarioPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("funcionarios")
    .select("*")
    .eq("id", id)
    .single();
  const funcionario = data as Funcionario | null;
  if (!funcionario) notFound();
  return (
    <>
      <div className="mb-4">
        <BackButton href={`/funcionarios/${id}`} />
      </div>
      <PageHeader title={`Editar: ${funcionario.nome}`} />
      <FuncionarioForm funcionario={funcionario} />
    </>
  );
}
