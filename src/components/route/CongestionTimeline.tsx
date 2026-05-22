import { For, Show } from "solid-js";
import type { RouteResult, RouteStop } from "~/lib/route-planner";

interface Props {
  result: RouteResult;
}

function congestionColor(pct: number | null): string {
  if (pct === null) return "var(--color-text-muted)";
  if (pct < 60) return "var(--color-congestion-low)";
  if (pct < 90) return "var(--color-congestion-mid)";
  return "var(--color-congestion-high)";
}

function congestionBg(pct: number | null): string {
  if (pct === null) return "bg-(--color-border)";
  if (pct < 60) return "bg-(--color-congestion-low)";
  if (pct < 90) return "bg-(--color-congestion-mid)";
  return "bg-(--color-congestion-high)";
}

function labelBadgeClass(label: RouteStop["label"]): string {
  switch (label) {
    case "여유":
      return "bg-green-50 text-green-700";
    case "보통":
      return "bg-yellow-50 text-yellow-700";
    case "혼잡":
      return "bg-red-50 text-red-600";
    case "환승":
      return "bg-gray-100 text-(--color-text-muted)";
  }
}

export function CongestionTimeline(props: Props) {
  return (
    <div class="mt-6">
      {/* 타임라인 */}
      <div class="rounded-2xl border border-(--color-border) bg-white p-6">
        <h2 class="mb-5 text-base font-semibold text-(--color-text)">
          경로 혼잡도 타임라인
        </h2>

        <ol class="relative">
          <For each={props.result.stops}>
            {(stop, idx) => {
              const isLast = () => idx() === props.result.stops.length - 1;
              const dotColor = () => congestionColor(stop.congestionPct);

              return (
                <li class="relative flex gap-4">
                  {/* 왼쪽: 시간 */}
                  <div class="w-12 shrink-0 pt-0.5 text-right text-xs font-mono text-(--color-text-muted)">
                    {stop.time}
                  </div>

                  {/* 중앙: 수직 라인 + 점 */}
                  <div class="relative flex flex-col items-center">
                    <div
                      class={`relative z-10 mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${
                        stop.isTransfer ? "border-2 border-(--color-text-muted) bg-white" : ""
                      }`}
                      style={
                        stop.isTransfer
                          ? {}
                          : { "background-color": dotColor() }
                      }
                    >
                      <Show when={stop.isStart || stop.isEnd}>
                        <div class="absolute -inset-1 rounded-full opacity-30"
                          style={{ "background-color": dotColor() }}
                        />
                      </Show>
                    </div>
                    <Show when={!isLast()}>
                      <div class="mt-1 w-px flex-1 bg-(--color-border)" style={{ "min-height": "2rem" }} />
                    </Show>
                  </div>

                  {/* 오른쪽: 역명 + 정보 */}
                  <div class="flex-1 pb-6">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        class={`text-sm font-semibold ${
                          stop.isStart || stop.isEnd
                            ? "text-(--color-primary)"
                            : "text-(--color-text)"
                        }`}
                      >
                        {stop.station}
                      </span>

                      <span class="text-xs text-(--color-text-muted)">
                        {stop.line}
                      </span>

                      <Show when={stop.congestionPct !== null}>
                        <span
                          class="text-xs font-medium"
                          style={{ color: congestionColor(stop.congestionPct) }}
                        >
                          {stop.congestionPct}%
                        </span>
                      </Show>

                      <span
                        class={`rounded-full px-2 py-0.5 text-xs font-medium ${labelBadgeClass(stop.label)}`}
                      >
                        {stop.label}
                      </span>
                    </div>

                    {/* 혼잡도 바 */}
                    <Show when={stop.congestionPct !== null}>
                      <div class="mt-1.5 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-(--color-bg-subtle)">
                        <div
                          class={`h-full rounded-full transition-all ${congestionBg(stop.congestionPct)}`}
                          style={{
                            width: `${Math.min(stop.congestionPct ?? 0, 100)}%`,
                          }}
                        />
                      </div>
                    </Show>
                  </div>
                </li>
              );
            }}
          </For>
        </ol>
      </div>

      {/* 요약 카드 */}
      <div class="mt-4 grid grid-cols-3 gap-3">
        <div class="rounded-xl border border-(--color-border) bg-(--color-bg-subtle) p-4 text-center">
          <p class="text-xs text-(--color-text-muted)">총 소요시간</p>
          <p class="mt-1 text-xl font-bold text-(--color-text)">
            {props.result.totalMinutes}분
          </p>
        </div>

        <div class="rounded-xl border border-(--color-border) bg-(--color-bg-subtle) p-4 text-center">
          <p class="text-xs text-(--color-text-muted)">평균 혼잡도</p>
          <p
            class="mt-1 text-xl font-bold"
            style={{ color: congestionColor(props.result.avgCongestion) }}
          >
            {props.result.avgCongestion}%
          </p>
        </div>

        <div class="rounded-xl border border-(--color-border) bg-(--color-bg-subtle) p-4 text-center">
          <p class="text-xs text-(--color-text-muted)">가장 붐비는 구간</p>
          <p class="mt-1 text-sm font-bold text-(--color-text)">
            {props.result.busiestStop.station}
          </p>
          <p
            class="text-xs font-medium"
            style={{
              color: congestionColor(props.result.busiestStop.congestionPct),
            }}
          >
            {props.result.busiestStop.congestionPct}%
          </p>
        </div>
      </div>
    </div>
  );
}
