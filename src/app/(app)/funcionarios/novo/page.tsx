import { BackButton } from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import { FuncionarioForm } from "@/components/forms/funcionario-form";

export default function NovoFuncionarioPage() {
  return (
    <>
      <div className="mb-4">
        <BackButton href="/funcionarios" />
      </div>
      <PageHeader title="Novo funcionário" />
      <FuncionarioForm />
    </>
  );
}
