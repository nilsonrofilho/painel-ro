"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(values);
        if (error) throw error;
        toast.success("Bem-vindo!");
      } else {
        const { error } = await supabase.auth.signUp(values);
        if (error) throw error;
        toast.success("Conta criada. Verifique seu e-mail se necessário.");
      }
      router.push("/portal");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
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
          <h1 className="text-2xl font-bold text-foreground">Painel RO</h1>
          <p className="text-sm text-muted-foreground">
            Construções e Incorporações
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Acesse seu painel de gestão"
                : "Configure seu primeiro acesso"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" size="lg" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Entrar" : "Criar conta"}
              </Button>
              <button
                type="button"
                className="text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setMode((m) => (m === "signin" ? "signup" : "signin"))
                }
              >
                {mode === "signin"
                  ? "Primeiro acesso? Criar conta"
                  : "Já tenho conta — entrar"}
              </button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} RO Construções e Incorporações
        </p>
      </div>
    </div>
  );
}
