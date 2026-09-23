import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verificarSessao } from "@/lib/auth/session";
import { envConfigurado } from "@/lib/env/status";

/**
 * Next.js 16 renomeou Middleware para Proxy (mesma função, roda antes de cada
 * requisição). Aqui protege /admin/** (exige sessão "admin", via PIN) e
 * /ligador/** (exige sessão "ligador", via usuário+senha) — cada um redireciona
 * pra sua própria tela de login quando não autenticado. Antes de tudo, manda pro
 * /setup se as env vars (Supabase/PIN) ainda não foram configuradas.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ehAdmin = pathname.startsWith("/admin");
  const ehLigador = pathname.startsWith("/ligador");
  if (!ehAdmin && !ehLigador) {
    return NextResponse.next();
  }

  if (!envConfigurado()) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const protegeAdmin = ehAdmin && pathname !== "/admin/login";
  const protegeLigador = ehLigador && pathname !== "/ligador/login";
  if (!protegeAdmin && !protegeLigador) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;

  if (protegeAdmin && sessao?.role !== "admin") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (protegeLigador && sessao?.role !== "ligador") {
    return NextResponse.redirect(new URL("/ligador/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/ligador/:path*"],
};
