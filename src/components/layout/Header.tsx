import { A } from "@solidjs/router";
import { ROUTES } from "~/config/routes";

export function Header() {
  return (
    <header class="sticky top-0 z-50 bg-white/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <A
          href={ROUTES.HOME}
          class="text-[1.05rem] font-extrabold tracking-tight text-(--color-text) transition-colors hover:text-(--color-primary)"
        >
          만원
        </A>
        <nav class="flex items-center gap-1">
          <A
            href={ROUTES.MAP}
            class="rounded-xl px-4 py-2 text-sm font-semibold text-(--color-text-muted) transition hover:bg-(--color-bg-soft) hover:text-(--color-text)"
            activeClass="!text-(--color-primary) !bg-(--color-primary-soft)"
          >
            노선도
          </A>
          <A
            href={ROUTES.ROUTE}
            class="rounded-xl px-4 py-2 text-sm font-semibold text-(--color-text-muted) transition hover:bg-(--color-bg-soft) hover:text-(--color-text)"
            activeClass="!text-(--color-primary) !bg-(--color-primary-soft)"
          >
            경로
          </A>
          <A
            href={ROUTES.MAP}
            class="ml-2 hidden items-center rounded-xl bg-(--color-primary) px-4 py-2 text-sm font-bold text-white shadow-toss-btn transition hover:bg-(--color-primary-dark) active:scale-[0.97] sm:inline-flex"
          >
            무료로 시작하기
          </A>
        </nav>
      </div>
    </header>
  );
}
