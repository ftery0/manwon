import { JSX, splitProps } from "solid-js";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  as?: "a";
  href?: string;
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "as", "href", "class", "children"]);
  const variant = () => local.variant ?? "primary";

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer select-none";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-(--color-primary) text-white hover:opacity-90 active:scale-95",
    ghost:
      "bg-transparent text-(--color-text-muted) border border-(--color-border) hover:border-(--color-primary) hover:text-(--color-primary) active:scale-95",
  };

  const cls = () => `${base} ${variants[variant()]} ${local.class ?? ""}`;

  if (local.as === "a") {
    return (
      <a href={local.href} class={cls()}>
        {local.children}
      </a>
    );
  }

  return (
    <button class={cls()} {...(rest as JSX.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {local.children}
    </button>
  );
}
