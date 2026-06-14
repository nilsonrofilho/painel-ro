import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ValoresProvider } from "@/components/valores-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <ValoresProvider>
      <AppShell user={{ email: user.email }}>{children}</AppShell>
    </ValoresProvider>
  );
}
