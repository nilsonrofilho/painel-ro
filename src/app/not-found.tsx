import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-4 overflow-hidden rounded-2xl shadow-xl ring-2 ring-border">
          <Image
            src="/logo_com_fundo.jpg"
            alt="RO Construções"
            width={88}
            height={88}
            priority
            className="block"
          />
        </div>
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          404
        </p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Este endereço não existe ou o registro foi removido. Se você chegou
          aqui por um link, pode ser que o lote, loteamento ou ficha tenha sido
          excluído.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            Voltar ao dashboard
          </Link>
          <Link
            href="/loteamentos"
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver loteamentos
          </Link>
        </div>
      </div>
    </div>
  );
}
