import type { ComponentProps } from "react";

export function Table({ className, ...rest }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-[13.5px] ${className ?? ""}`} {...rest} />
    </div>
  );
}

export function Th({ className, ...rest }: ComponentProps<"th">) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-2.5 text-left text-[10.5px] font-medium uppercase tracking-[0.14em] text-fg-subtle first:pl-5 last:pr-5 ${className ?? ""}`}
      {...rest}
    />
  );
}

export function Tr({ className, ...rest }: ComponentProps<"tr">) {
  return (
    <tr
      className={`border-t border-line transition-colors duration-200 hover:bg-white/[0.02] ${className ?? ""}`}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: ComponentProps<"td">) {
  return <td className={`px-4 py-3 align-middle first:pl-5 last:pr-5 ${className ?? ""}`} {...rest} />;
}
