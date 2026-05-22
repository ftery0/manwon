import { For } from "solid-js";
import { FadeIn } from "~/components/animation/FadeIn";
import { LANDING } from "~/content/landing";

export function F1Section() {
  const { f1 } = LANDING;

  return (
    <section class="bg-(--color-bg-subtle) px-5 py-28">
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-20">

          {/* 텍스트 (왼쪽) */}
          <FadeIn class="flex-1">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-(--color-primary-soft) px-3 py-1.5 text-xs font-semibold text-(--color-primary)">
              <span class="h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
              노선도 탐색
            </span>
            <h2 class="mt-5 text-[2rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-(--color-text) sm:text-4xl lg:text-[2.75rem]">
              역 하나 클릭하면<br />24시간 그래프로
            </h2>
            <p class="mt-5 text-[1rem] leading-[1.65] text-(--color-text-muted)">
              {f1.description}
            </p>

            {/* use cases */}
            <ul class="mt-7 space-y-3">
              <For each={f1.usecases}>
                {(u) => (
                  <li class="flex items-start gap-3">
                    <span class="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-card">
                      {u.icon}
                    </span>
                    <span class="pt-1 text-[0.95rem] leading-relaxed text-(--color-text)">{u.text}</span>
                  </li>
                )}
              </For>
            </ul>

            <a
              href={f1.ctaHref}
              class="mt-9 inline-flex items-center gap-2 rounded-2xl bg-(--color-primary) px-7 py-3.5 text-sm font-bold text-white shadow-toss-btn transition hover:bg-(--color-primary-dark) active:scale-[0.97]"
            >
              {f1.cta}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </FadeIn>

          {/* 시각화 (오른쪽) */}
          <FadeIn delay={150} class="w-full lg:w-[420px] lg:flex-shrink-0">
            <MapMockup />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

export function F2Section() {
  const { f2 } = LANDING;

  return (
    <section class="bg-white px-5 py-28">
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-col gap-14 lg:flex-row-reverse lg:items-center lg:gap-20">

          {/* 텍스트 (오른쪽) */}
          <FadeIn class="flex-1">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600">
              <span class="h-1.5 w-1.5 rounded-full bg-amber-500" />
              경로 혼잡도
            </span>
            <h2 class="mt-5 text-[2rem] font-extrabold leading-[1.15] tracking-[-0.025em] text-(--color-text) sm:text-4xl lg:text-[2.75rem]">
              출발-도착 입력하면<br />구간별 혼잡도 타임라인
            </h2>
            <p class="mt-5 text-[1rem] leading-[1.65] text-(--color-text-muted)">
              {f2.description}
            </p>
            <a
              href={f2.ctaHref}
              class="mt-9 inline-flex items-center gap-2 rounded-2xl bg-(--color-bg-soft) px-7 py-3.5 text-sm font-bold text-(--color-text) transition hover:bg-(--color-border) active:scale-[0.97]"
            >
              {f2.cta}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </a>
          </FadeIn>

          {/* 타임라인 시각화 (왼쪽) */}
          <FadeIn delay={150} class="w-full lg:w-[400px] lg:flex-shrink-0">
            <RouteTimelineMockup />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function MapMockup() {
  const stations = [
    { x: 80, y: 120, name: "홍대입구", pct: 55, line: "2" },
    { x: 160, y: 120, name: "신촌", pct: 48, line: "2" },
    { x: 240, y: 120, name: "이대", pct: 42, line: "2" },
    { x: 320, y: 120, name: "아현", pct: 38, line: "2" },
    { x: 400, y: 120, name: "충정로", pct: 50, line: "2" },
    { x: 280, y: 60, name: "공덕", pct: 65, line: "5" },
    { x: 360, y: 60, name: "애오개", pct: 44, line: "5" },
    { x: 440, y: 60, name: "충정로", pct: 50, line: "5" },
  ];

  const color = (pct: number) => {
    if (pct >= 80) return "#ef4444";
    if (pct >= 55) return "#f59e0b";
    return "#22c55e";
  };

  const legendItems = [
    { color: "#22c55e", label: "여유 (< 55%)" },
    { color: "#f59e0b", label: "보통 (55~80%)" },
    { color: "#ef4444", label: "혼잡 (80%+)" },
  ];

  return (
    <div class="rounded-3xl bg-white p-6 shadow-card-lg">
      {/* 헤더 */}
      <div class="mb-4 flex items-center justify-between">
        <p class="text-base font-extrabold text-(--color-text)">노선도 미리보기</p>
        <span class="rounded-lg bg-(--color-primary-soft) px-2.5 py-1 text-[11px] font-bold text-(--color-primary)">
          출근 08:00
        </span>
      </div>
      <div class="relative overflow-x-auto">
        <svg viewBox="0 0 540 180" class="w-full" style={{ "min-width": "320px" }}>
          {/* 노선 선 */}
          <line x1="60" y1="120" x2="420" y2="120" stroke="#3182f6" stroke-width="3.5" opacity="0.35" />
          <line x1="260" y1="40" x2="460" y2="40" stroke="#a78bfa" stroke-width="3.5" opacity="0.25" />
          <line x1="280" y1="40" x2="280" y2="120" stroke="#3182f6" stroke-width="2" opacity="0.2" stroke-dasharray="4 3" />
          <line x1="440" y1="40" x2="400" y2="120" stroke="#3182f6" stroke-width="2" opacity="0.2" stroke-dasharray="4 3" />

          <For each={stations}>
            {(s) => (
              <>
                <circle cx={s.x} cy={s.y} r="12" fill={color(s.pct)} opacity="0.15" />
                <circle cx={s.x} cy={s.y} r="8" fill={color(s.pct)} opacity="0.95" />
                <text
                  x={s.x}
                  y={s.y + 26}
                  text-anchor="middle"
                  font-size="9"
                  fill="#6b7684"
                  font-family="inherit"
                >
                  {s.name}
                </text>
              </>
            )}
          </For>

          {/* 선택 링 */}
          <circle cx={320} cy={120} r="16" fill="none" stroke="#3182f6" stroke-width="2.5" />
          <text x={320} y={157} text-anchor="middle" font-size="9" fill="#3182f6" font-weight="700" font-family="inherit">
            선택됨
          </text>
        </svg>
      </div>

      <div class="mt-4 flex flex-wrap gap-4 text-xs text-(--color-text-muted)">
        <For each={legendItems}>
          {(item) => (
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" style={{ "background-color": item.color }} />
              {item.label}
            </span>
          )}
        </For>
      </div>
    </div>
  );
}

function RouteTimelineMockup() {
  const { f2 } = LANDING;

  const congestionColor = (label: string) => {
    if (label === "혼잡") return "var(--color-congestion-high)";
    if (label === "보통") return "var(--color-congestion-mid)";
    if (label === "여유") return "var(--color-congestion-low)";
    return "var(--color-border)";
  };

  const congestionBg = (label: string) => {
    if (label === "혼잡") return "var(--color-congestion-high-soft)";
    if (label === "보통") return "var(--color-congestion-mid-soft)";
    if (label === "여유") return "var(--color-congestion-low-soft)";
    return "transparent";
  };

  return (
    <div class="rounded-3xl bg-white p-6 shadow-card-lg">
      <div class="mb-5 flex items-center justify-between">
        <p class="text-base font-extrabold text-(--color-text)">
          서울대입구 → 신사
        </p>
        <span class="rounded-lg bg-(--color-primary-soft) px-2.5 py-1 text-[11px] font-bold text-(--color-primary)">
          약 20분 소요
        </span>
      </div>
      <div class="flex flex-col">
        <For each={f2.preview}>
          {(stop, i) => (
            <div class="flex gap-3">
              <div class="flex flex-col items-center">
                <div
                  class="h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm"
                  style={{ "background-color": congestionColor(stop.label) }}
                />
                {i() < f2.preview.length - 1 && (
                  <div class="w-0.5 flex-1 bg-(--color-border-soft)" style={{ "min-height": "20px" }} />
                )}
              </div>
              <div class="flex-1 pb-3">
                <div
                  class="flex items-baseline justify-between rounded-xl px-3 py-2 transition-colors"
                  style={{ "background-color": congestionBg(stop.label) }}
                >
                  <div>
                    <span class="text-sm font-bold text-(--color-text)">{stop.station}</span>
                    {stop.line && (
                      <span class="ml-1.5 text-xs text-(--color-text-muted)">{stop.line}</span>
                    )}
                  </div>
                  <div class="flex items-center gap-2">
                    {stop.percent !== null && (
                      <span
                        class="text-sm font-extrabold"
                        style={{ color: congestionColor(stop.label) }}
                      >
                        {stop.percent}%
                      </span>
                    )}
                    <span class="text-xs text-(--color-text-muted)">{stop.time}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
