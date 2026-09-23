import type { ComponentProps, ReactNode } from "react";

const campo =
  "w-full rounded-xl border border-line-strong bg-surface-2 text-[15px] text-fg shadow-[inset_0_1px_2px_0_rgb(0_0_0/0.35)] " +
  "placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow,background-color] duration-300 ease-spring " +
  "hover:border-white/20 focus:border-accent/60 focus:bg-surface-3 focus:shadow-[0_0_0_4px_rgb(200_238_114/0.1)] " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger/60";

export function Input({
  className,
  icon,
  ...rest
}: ComponentProps<"input"> & { icon?: ReactNode }) {
  if (!icon) {
    return <input className={`${campo} h-11 px-3.5 ${className ?? ""}`} {...rest} />;
  }
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-[17px] text-fg-subtle">
        {icon}
      </span>
      <input className={`${campo} h-11 pl-10 pr-3.5 ${className ?? ""}`} {...rest} />
    </div>
  );
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={`${campo} min-h-20 px-3.5 py-2.5 ${className ?? ""}`} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select
      className={`${campo} h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20256%20256'%20fill='%236c737d'%3E%3Cpath%20d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'/%3E%3C/svg%3E")] bg-[length:14px] bg-[right_0.9rem_center] bg-no-repeat pl-3.5 pr-9 ${className ?? ""}`}
      {...rest}
    >
      {children}
    </select>
  );
}

/** Label + controle + dica/erro, com espaçamento padrão. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] leading-relaxed text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
