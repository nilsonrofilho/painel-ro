import { NextResponse, type NextRequest } from "next/server";
import { syncDrive } from "@/lib/drive-sync";
import { DriveNotConfiguredError } from "@/lib/google-drive";

// Roda em Node (a auth da conta de serviço usa APIs de Node), nunca em edge.
export const runtime = "nodejs";
// Nunca cachear: é um job que muda o banco a cada execução.
export const dynamic = "force-dynamic";

/**
 * Cron de sincronização do Google Drive → documentos dos lotes.
 *
 * Disparado pelo Vercel Cron (vercel.json). Protegido por CRON_SECRET:
 * o Vercel envia o header `Authorization: Bearer <CRON_SECRET>` automaticamente
 * quando a env var CRON_SECRET está definida.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  try {
    const resultado = await syncDrive();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (err) {
    if (err instanceof DriveNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
