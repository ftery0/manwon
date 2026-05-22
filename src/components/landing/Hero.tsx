import { For } from "solid-js";
import { LANDING } from "~/content/landing";

export function Hero() {
  const { hero } = LANDING;

  return (
    <section class="relative overflow-hidden bg-gradient-to-b from-[#f4f9ff] via-white to-white px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
      {/* 배경 blur blob */}
      <div
        aria-hidden
        class="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, #cfe3ff 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        class="pointer-events-none absolute top-40 -left-32 h-[360px] w-[360px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, #e8f3ff 0%, transparent 70%)" }}
      />

      <div class="relative mx-auto max-w-6xl">
        <div class="flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-16">

          {/* 왼쪽: 텍스트 */}
          <div class="flex-1">
            {/* 배지 */}
            <span class="inline-flex items-center gap-1.5 rounded-full bg-(--color-primary-soft) px-3 py-1.5 text-xs font-semibold text-(--color-primary)">
              <span class="h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
              {hero.badge}
            </span>

            {/* 헤드라인 */}
            <h1 class="mt-5 text-[2.5rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-(--color-text) sm:text-[3.4rem] lg:text-[4rem]">
              지하철 타기 전,<br />
              <span class="bg-gradient-to-r from-[#3182f6] to-[#6366f1] bg-clip-text text-transparent">
                미리
              </span>{" "}
              알고 가세요
            </h1>

            <p class="mt-6 text-[1.05rem] leading-[1.6] text-(--color-text-muted) sm:text-lg">
              만원인지 한산한지, 역별 시간대 혼잡도를<br class="hidden sm:block" />
              그래프로 한눈에 확인하세요.
            </p>

            {/* CTA */}
            <div class="mt-9 flex flex-wrap gap-2.5">
              <a
                href={hero.cta.primary.href}
                class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-(--color-primary) px-7 py-4 text-[15px] font-bold text-white shadow-toss-btn transition hover:bg-(--color-primary-dark) active:scale-[0.97] sm:w-auto"
              >
                {hero.cta.primary.label}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <a
                href={hero.cta.secondary.href}
                class="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-(--color-bg-soft) px-7 py-4 text-[15px] font-bold text-(--color-text) transition hover:bg-(--color-border) active:scale-[0.97] sm:w-auto"
              >
                {hero.cta.secondary.label}
              </a>
            </div>

            {/* 신뢰 지표 */}
            <div class="mt-10 grid max-w-md grid-cols-3 gap-4 sm:gap-6">
              <div>
                <p class="text-2xl font-extrabold tracking-tight text-(--color-text)">
                  281<span class="ml-0.5 text-xs font-medium text-(--color-text-muted)">개역</span>
                </p>
                <p class="mt-1 text-xs text-(--color-text-muted)">1~8호선 전체</p>
              </div>
              <div>
                <p class="text-2xl font-extrabold tracking-tight text-(--color-text)">
                  30<span class="ml-0.5 text-xs font-medium text-(--color-text-muted)">분 단위</span>
                </p>
                <p class="mt-1 text-xs text-(--color-text-muted)">시간대별 혼잡도</p>
              </div>
              <div>
                <p class="text-2xl font-extrabold tracking-tight text-(--color-text)">
                  2026<span class="ml-0.5 text-xs font-medium text-(--color-text-muted)">Q1</span>
                </p>
                <p class="mt-1 text-xs text-(--color-text-muted)">최신 데이터</p>
              </div>
            </div>
          </div>

          {/* 오른쪽: 차트 카드 */}
          <div class="w-full lg:w-[480px] lg:flex-shrink-0">
            <HeroChartCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroChartCard() {
  const bars = [
    { hour: "06", pct: 22 }, { hour: "07", pct: 58 }, { hour: "08", pct: 95 },
    { hour: "09", pct: 80 }, { hour: "10", pct: 48 }, { hour: "11", pct: 42 },
    { hour: "12", pct: 55 }, { hour: "13", pct: 50 }, { hour: "14", pct: 44 },
    { hour: "15", pct: 46 }, { hour: "16", pct: 62 }, { hour: "17", pct: 78 },
    { hour: "18", pct: 100 }, { hour: "19", pct: 86 }, { hour: "20", pct: 58 },
    { hour: "21", pct: 40 }, { hour: "22", pct: 30 }, { hour: "23", pct: 18 },
  ];
  const MAX_H = 120;

  const color = (p: number) => {
    if (p >= 80) return "#ef4444";
    if (p >= 55) return "#f59e0b";
    return "#22c55e";
  };

  const summaryItems = [
    { label: "출근 혼잡", value: "95%", time: "08시", color: "#ef4444", bg: "#fef2f2" },
    { label: "가장 한산", value: "18%", time: "23시", color: "#22c55e", bg: "#ecfdf5" },
    { label: "퇴근 혼잡", value: "100%", time: "18시", color: "#ef4444", bg: "#fef2f2" },
  ];

  const highlightHours = ["08", "12", "18", "22"];

  return (
    <div class="rounded-3xl bg-white p-7 shadow-card-lg">
      {/* 카드 헤더 */}
      <div class="flex items-start justify-between">
        <div>
          <p class="text-lg font-extrabold tracking-tight text-(--color-text)">강남역</p>
          <p class="mt-1 text-xs text-(--color-text-muted)">2호선 · 시간대별 혼잡도</p>
        </div>
        <div class="flex gap-1.5">
          <span class="rounded-lg bg-(--color-primary) px-3 py-1.5 text-xs font-bold text-white">
            평일
          </span>
          <span class="rounded-lg bg-(--color-bg-soft) px-3 py-1.5 text-xs font-semibold text-(--color-text-muted)">
            주말
          </span>
        </div>
      </div>

      {/* 바 차트 */}
      <div class="mt-6 flex items-end gap-1" style={{ height: `${MAX_H + 16}px` }}>
        <For each={bars}>
          {(b) => (
            <div
              class="flex flex-1 flex-col items-center justify-end gap-1"
              style={{ height: `${MAX_H + 16}px` }}
            >
              <div
                class="w-full rounded-md"
                style={{
                  height: `${Math.max(3, Math.round((b.pct / 100) * MAX_H))}px`,
                  "background-color": color(b.pct),
                }}
              />
              {highlightHours.includes(b.hour) && (
                <span class="text-[10px] font-medium text-(--color-text-muted)">{b.hour}</span>
              )}
            </div>
          )}
        </For>
      </div>

      {/* 요약 카드 3개 */}
      <div class="mt-5 grid grid-cols-3 gap-2">
        <For each={summaryItems}>
          {(s) => (
            <div class="rounded-2xl p-3.5" style={{ "background-color": s.bg }}>
              <p class="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</p>
              <p class="mt-1 text-xl font-extrabold tracking-tight" style={{ color: s.color }}>{s.value}</p>
              <p class="mt-0.5 text-[10px] text-(--color-text-muted)">{s.time}</p>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
