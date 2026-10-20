import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "warning";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-300 ease-spring " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary:
    "rounded-2xl bg-accent/30 border border-accent/60 text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1)] hover:bg-accent/40 hover:shadow-accent",
  secondary:
    "rounded-xl border border-white/[0.12] bg-white/[0.04] text-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)] hover:border-white/20 hover:bg-white/[0.07]",
  ghost: "rounded-xl text-fg-muted hover:bg-white/[0.05] hover:text-fg",
  danger:
    "rounded-xl border border-danger-line bg-danger-soft text-danger hover:bg-danger/15 hover:border-danger/50",
  warning:
    "rounded-xl border border-warning-line bg-warning-soft text-warning hover:bg-warning/15 hover:border-warning/50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-4.5 text-sm",
  lg: "h-12 px-7 text-[15px] font-bold",
};

const sizesComTrailing: Record<Size, string> = {
  sm: "h-8 pl-3.5 pr-1 text-[13px]",
  md: "h-10 pl-4.5 pr-1 text-sm",
  lg: "h-12 pl-7 pr-1.5 text-[15px] font-bold",
};

const ilha: Record<Size, string> = {
  sm: "size-6",
  md: "size-8",
  lg: "size-9",
};

const ilhaVariant: Record<Variant, string> = {
  primary: "bg-white/[0.12]",
  secondary: "bg-white/[0.07]",
  ghost: "bg-white/[0.06]",
  danger: "bg-danger/15",
  warning: "bg-warning/15",
};

export interface ButtonStyleProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  block?: boolean;
  className?: string;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  trailingIcon,
  block,
  className,
}: ButtonStyleProps): string {
  return [
    base,
    variants[variant],
    trailingIcon ? sizesComTrailing[size] : sizes[size],
    block ? "w-full" : "",
    className ?? "",
  ].join(" ");
}

function Conteudo({
  children,
  icon,
  trailingIcon,
  variant = "primary",
  size = "md",
}: ButtonStyleProps & { children?: ReactNode }) {
  return (
    <>
      {icon && <span className="-ml-0.5 flex text-[1.1em]">{icon}</span>}
      {children}
      {trailingIcon && (
        <span
          className={`${ilha[size]} ${ilhaVariant[variant]} ml-1 flex items-center justify-center rounded-full transition-transform duration-500 ease-spring group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-px group-hover/btn:scale-105`}
        >
          {trailingIcon}
        </span>
      )}
    </>
  );
}

export function Button({
  variant,
  size,
  icon,
  trailingIcon,
  block,
  className,
  children,
  type = "button",
  ...rest
}: ButtonStyleProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, trailingIcon, block, className })}
      {...rest}
    >
      <Conteudo icon={icon} trailingIcon={trailingIcon} variant={variant} size={size}>
        {children}
      </Conteudo>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  trailingIcon,
  block,
  className,
  children,
  ...rest
}: ButtonStyleProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, trailingIcon, block, className })} {...rest}>
      <Conteudo icon={icon} trailingIcon={trailingIcon} variant={variant} size={size}>
        {children}
      </Conteudo>
    </Link>
  );
}

export function IconButton({
  className,
  children,
  type = "button",
  ...rest
}: ComponentProps<"button"> & { "aria-label": string }) {
  return (
    <button
      type={type}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-[background-color,color,transform] duration-300 ease-spring hover:bg-white/[0.06] hover:text-fg active:scale-90 disabled:pointer-events-none disabled:opacity-40 ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
