import { JSX } from "solid-js";

export function Card(props: { children: JSX.Element; class?: string }) {
  return (
    <div
      class={`rounded-2xl border border-(--color-border) bg-(--color-bg-subtle) ${props.class ?? ""}`}
    >
      {props.children}
    </div>
  );
}
