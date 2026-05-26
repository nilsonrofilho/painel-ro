import { BackButton } from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import { FornecedorForm } from "@/components/forms/fornecedor-form";

export default function NovoFornecedorPage() {
  return (
    <>
      <div className="mb-4">
        <BackButton href="/fornecedores" />
      </div>
      <PageHeader title="Novo fornecedor" />
      <FornecedorForm />
    </>
  );
}
