import Link from "next/link";
import { ShieldCheckIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { requireAdminSession } from "@/lib/auth/guard";
import { sairAdmin } from "@/lib/auth/actions";
import { Logo } from "@/components/ui/Logo";
import { AdminMobileNav, AdminSidebarNav } from "@/components/admin/AdminNav";

export default async function PainelAdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdminSession();

  return (
    <div className="min-h-[100dvh] lg:pl-[260px]">
      {/* Luz ambiente no topo — fixa, então não repinta no scroll. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgb(200_238_114/0.06),transparent_70%)]"
      />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-line bg-canvas/80 px-5 py-6 backdrop-blur-xl lg:flex">
        <Link href="/admin" className="px-1">
          <Logo />
        </Link>

        <div className="mt-9 mb-2 px-3 text-[10.5px] font-medium uppercase tracking-[0.18em] text-fg-subtle">
          Operação
        </div>
        <AdminSidebarNav />

        <div className="mt-auto rounded-2xl border border-line bg-white/[0.02] p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent">
              <ShieldCheckIcon size={17} weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-fg">Administrador</p>
              <p className="text-[11.5px] text-fg-subtle">Acesso por PIN</p>
            </div>
            <form action={sairAdmin}>
              <button
                type="submit"
                aria-label="Sair"
                title="Sair"
                className="flex size-8 items-center justify-center rounded-full text-fg-subtle transition-colors duration-300 ease-spring hover:bg-white/[0.06] hover:text-fg"
              >
                <SignOutIcon size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 px-4 pt-3 backdrop-blur-xl lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin">
            <Logo />
          </Link>
          <form action={sairAdmin}>
            <button
              type="submit"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-fg-muted hover:bg-white/[0.05] hover:text-fg"
            >
              <SignOutIcon size={16} />
              Sair
            </button>
          </form>
        </div>
        <AdminMobileNav />
      </header>

      <main className="relative mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 md:py-12 lg:px-10">
        {children}
      </main>
    </div>
  );
}
