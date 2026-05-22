import { For } from "solid-js";
import { FadeIn } from "~/components/animation/FadeIn";
import { LANDING } from "~/content/landing";

export function DataSourceNote() {
  const { datasource } = LANDING;

  const sourceCards = [
    { num: "01", title: "1~8호선 혼잡도", desc: "30분 단위 · 평일/토/일 · 상하행", source: "서울교통공사" },
    { num: "02", title: "9호선 혼잡도", desc: "서울 열린데이터광장 제공", source: "서울시" },
    { num: "03", title: "역간 소요시간", desc: "실제 열차 운행 기준", source: "공공데이터포털" },
    { num: "04", title: "환승 소요시간", desc: "환승역별 도보 시간 포함", source: "공공데이터포털" },
  ];

  return (
    <section class="bg-(--color-bg-subtle) px-5 py-24">
      <div class="mx-auto max-w-6xl text-center">
        <FadeIn>
          <p class="text-xs font-semibold uppercase tracking-widest text-(--color-primary)">
            데이터 출처
          </p>
          <h2 class="mt-3 text-3xl font-extrabold text-(--color-text)">
            {datasource.headline}
          </h2>
          <p class="mt-3 text-base text-(--color-text-muted)">
            {datasource.description}
          </p>
        </FadeIn>

        <FadeIn delay={100} class="mt-10">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <For each={sourceCards}>
              {(s) => (
                <div class="rounded-2xl bg-white p-6 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg">
                  <span class="text-2xl font-extrabold text-(--color-primary) opacity-30">
                    {s.num}
                  </span>
                  <p class="mt-2 text-sm font-bold text-(--color-text)">{s.title}</p>
                  <p class="mt-1 text-xs leading-relaxed text-(--color-text-muted)">{s.desc}</p>
                  <p class="mt-2 text-[10px] font-semibold text-(--color-primary)">{s.source}</p>
                </div>
              )}
            </For>
          </div>
        </FadeIn>

        <FadeIn delay={200} class="mt-8">
          <p class="flex items-center justify-center gap-1.5 text-xs text-(--color-text-muted)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="shrink-0 text-(--color-primary)">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2" />
              <path d="M7 6v4M7 4.5v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            {datasource.note}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
