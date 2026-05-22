import { JSX } from "solid-js";

export function Badge(props: { children: JSX.Element; class?: string }) {
  return (
    <span
      class={`inline-flex items-center rounded-full bg-(--color-primary-soft) px-3 py-1 text-xs font-medium text-(--color-primary) ${props.class ?? ""}`}
    >
      {props.children}
    </span>
  );
}
