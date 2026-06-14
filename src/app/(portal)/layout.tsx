import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "./portal-header";

export default async function PortalLayout({
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <PortalHeader email={user.email} />
      <main className="flex-1 px-4 py-10 sm:px-6 lg:py-16">{children}</main>
    </div>
  );
}
