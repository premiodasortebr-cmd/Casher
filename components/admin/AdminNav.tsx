"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeadsetIcon,
  SquaresFourIcon,
  TicketIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";

export const ITENS_NAV = [
  { href: "/admin", label: "Visão geral", Icone: SquaresFourIcon },
  { href: "/admin/rifas", label: "Rifas", Icone: TicketIcon },
  { href: "/admin/rifas/importar", label: "Importar fichas", Icone: UploadSimpleIcon },
  { href: "/admin/ligadores", label: "Ligadores", Icone: HeadsetIcon },
] as const;

/** O item ativo é o de href mais longo que casa com a rota (importar vence rifas). */
function hrefAtivo(pathname: string): string | null {
  let melhor: string | null = null;
  for (const { href } of ITENS_NAV) {
    const casa = href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
    if (casa && (!melhor || href.length > melhor.length)) melhor = href;
  }
  return melhor;
}

export function AdminSidebarNav() {
  const ativo = hrefAtivo(usePathname());
  return (
    <nav className="flex flex-col gap-0.5">
      {ITENS_NAV.map(({ href, label, Icone }) => {
        const on = href === ativo;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-[background-color,color] duration-300 ease-spring ${
              on ? "bg-white/[0.06] text-fg" : "text-fg-muted hover:bg-white/[0.03] hover:text-fg"
            }`}
          >
            {on && (
              <span className="absolute inset-y-2.5 -left-3 w-[3px] rounded-r-full bg-accent shadow-[0_0_12px_rgb(200_238_114/0.6)]" />
            )}
            <Icone
              size={18}
              weight={on ? "fill" : "regular"}
              className={on ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted"}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const ativo = hrefAtivo(usePathname());
  return (
    <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
      {ITENS_NAV.map(({ href, label, Icone }) => {
        const on = href === ativo;
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors duration-300 ease-spring ${
              on
                ? "border-accent-line bg-accent-soft text-accent"
                : "border-line bg-white/[0.02] text-fg-muted"
            }`}
          >
            <Icone size={15} weight={on ? "fill" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
