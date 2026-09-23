import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { formatNumero } from "@/lib/format";

const botao =
  "inline-flex size-8 items-center justify-center rounded-full border border-line-strong bg-surface-2 text-fg-muted transition-[background-color,color] duration-300 ease-spring hover:bg-surface-3 hover:text-fg";

function Seta({ href, disabled, children, label }: { href: string; disabled: boolean; children: React.ReactNode; label: string }) {
  if (disabled) {
    return (
      <span aria-disabled className={`${botao} pointer-events-none opacity-35`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={botao} scroll={false}>
      {children}
    </Link>
  );
}

/** Rodapé de lista: "1–50 de 1.234" + anterior/próxima. `href(p)` devolve a URL da página p. */
export function Pagination({
  pagina,
  porPagina,
  total,
  href,
}: {
  pagina: number;
  porPagina: number;
  total: number;
  href: (p: number) => string;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[12.5px] text-fg-subtle">
      <span className="tabular-nums">
        {formatNumero(inicio)}–{formatNumero(fim)} de {formatNumero(total)}
      </span>
      <div className="flex items-center gap-1.5">
        <Seta href={href(pagina - 1)} disabled={pagina <= 1} label="Página anterior">
          <CaretLeftIcon size={14} weight="bold" />
        </Seta>
        <span className="px-1.5 font-mono tabular-nums text-fg-muted">
          {pagina} / {paginas}
        </span>
        <Seta href={href(pagina + 1)} disabled={pagina >= paginas} label="Próxima página">
          <CaretRightIcon size={14} weight="bold" />
        </Seta>
      </div>
    </div>
  );
}
