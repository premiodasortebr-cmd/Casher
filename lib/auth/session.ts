import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "casher_session";
const SESSION_DURATION_SEG = 60 * 60 * 24 * 7; // 7 dias

export type SessionPayload =
  | { role: "admin" }
  | { role: "ligador"; ligadorId: string; username: string; nome: string };

function segredo(): Uint8Array {
  const valor = process.env.SESSION_SECRET;
  if (!valor) {
    throw new Error(
      "SESSION_SECRET não configurada. Gere uma com: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    );
  }
  return new TextEncoder().encode(valor);
}

export async function assinarSessao(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SEG}s`)
    .sign(segredo());
}

export async function verificarSessao(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, segredo());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Só pode ser chamada em Server Actions/Route Handlers (onde cookies são graváveis). */
export async function criarSessaoCookie(payload: SessionPayload): Promise<void> {
  const token = await assinarSessao(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SEG,
  });
}

export async function encerrarSessaoCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Lê a sessão a partir dos cookies da requisição atual (Server Components inclusos). */
export async function getSessao(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verificarSessao(token);
}

export async function getSessaoAdmin() {
  const sessao = await getSessao();
  return sessao?.role === "admin" ? sessao : null;
}

export async function getSessaoLigador() {
  const sessao = await getSessao();
  return sessao?.role === "ligador" ? sessao : null;
}
