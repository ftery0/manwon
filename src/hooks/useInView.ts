import { onMount, createSignal } from "solid-js";

export function useInView(threshold = 0.15) {
  const [inView, setInView] = createSignal(false);
  let ref!: HTMLElement;

  onMount(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(ref);
  });

  return { ref: (el: HTMLElement) => (ref = el), inView };
}
