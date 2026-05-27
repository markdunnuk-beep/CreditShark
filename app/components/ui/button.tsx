import type { Route } from "next";
import Link from "next/link";
import { cx } from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "caution" | "danger";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-creditshark-teal border-creditshark-teal text-creditshark-navy shadow-[0_10px_24px_rgba(28,163,166,0.24)] hover:bg-creditshark-aqua focus-visible:outline-creditshark-aqua/50",
  secondary: "bg-white border-creditshark-border text-creditshark-navy hover:bg-creditshark-mist focus-visible:outline-creditshark-aqua/40",
  ghost: "bg-transparent border-transparent text-creditshark-navy hover:bg-creditshark-mist focus-visible:outline-creditshark-aqua/40",
  caution: "bg-risk-moderate/15 border-risk-moderate/40 text-[#7a4b0b] hover:bg-risk-moderate/20 focus-visible:outline-risk-moderate/40",
  danger: "bg-risk-high/12 border-risk-high/40 text-[#9d2f2f] hover:bg-risk-high/20 focus-visible:outline-risk-high/40"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-sm",
  md: "min-h-[46px] px-[18px] py-3"
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cx(
    "inline-flex items-center justify-center rounded-full border font-extrabold transition focus-visible:outline focus-visible:outline-3",
    sizeClasses[size],
    variantClasses[variant],
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClassName({ variant, size, className })} type={type} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children
}: {
  href: Route | string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link className={buttonClassName({ variant, size, className })} href={href as Route}>
      {children}
    </Link>
  );
}
