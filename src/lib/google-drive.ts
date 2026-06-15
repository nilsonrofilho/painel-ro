import { JWT } from "google-auth-library";

/**
 * Cliente leve do Google Drive para o Painel RO.
 *
 * Autentica com uma CONTA DE SERVIÇO (não login humano) usando as variáveis:
 *   GOOGLE_DRIVE_CLIENT_EMAIL  — email do robô (...@....iam.gserviceaccount.com)
 *   GOOGLE_DRIVE_PRIVATE_KEY   — private_key do JSON da conta de serviço
 *
 * As pastas do Drive devem estar COMPARTILHADAS com o email do robô.
 * Escopo somente leitura: o app apenas lê/lista arquivos, nunca altera o Drive.
 */

const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime: string;
}

export class DriveNotConfiguredError extends Error {
  constructor() {
    super(
      "Google Drive não configurado: defina GOOGLE_DRIVE_CLIENT_EMAIL e GOOGLE_DRIVE_PRIVATE_KEY.",
    );
    this.name = "DriveNotConfiguredError";
  }
}

export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL &&
      process.env.GOOGLE_DRIVE_PRIVATE_KEY,
  );
}

let cachedClient: JWT | null = null;

function getJwtClient(): JWT {
  if (!isDriveConfigured()) throw new DriveNotConfiguredError();
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL!;
  // A private_key vem com "\n" literais quando colada no .env — normaliza.
  const key = process.env.GOOGLE_DRIVE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  cachedClient = new JWT({
    email,
    key,
    scopes: [SCOPE],
  });
  return cachedClient;
}

async function authHeaders(): Promise<Record<string, string>> {
  const client = getJwtClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Falha ao obter token de acesso do Google Drive.");
  }
  return { Authorization: `Bearer ${token.token}` };
}

/**
 * Extrai o ID de uma pasta a partir do que o usuário colar: aceita o ID puro
 * ou uma URL do tipo https://drive.google.com/drive/folders/<ID>?...
 */
export function parseFolderId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  // Se já parece um ID puro (sem barras nem espaços), aceita.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Lista os arquivos (não-pastas, não-lixeira) diretamente dentro de uma pasta.
 * Pagina automaticamente. Lança em erro de rede/permissão.
 */
export async function listFilesInFolder(
  folderId: string,
): Promise<DriveFile[]> {
  const headers = await authHeaders();
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime)",
      pageSize: "100",
      orderBy: "modifiedTime desc",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${FILES_ENDPOINT}?${params.toString()}`, {
      headers,
      // O Drive muda fora do nosso controle — nunca cachear.
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Erro ao listar arquivos do Drive (${res.status}): ${body.slice(0, 200)}`,
      );
    }
    const data = (await res.json()) as {
      files?: DriveFile[];
      nextPageToken?: string;
    };
    for (const f of data.files ?? []) files.push(f);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}
