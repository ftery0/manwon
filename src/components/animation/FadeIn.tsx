import { JSX } from "solid-js";
import { useInView } from "~/hooks/useInView";

export function FadeIn(props: {
  children: JSX.Element;
  delay?: number;
  class?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      class={`transition-all duration-700 ease-out ${
        inView() ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${props.class ?? ""}`}
      style={{ "transition-delay": `${props.delay ?? 0}ms` }}
    >
      {props.children}
    </div>
  );
}
