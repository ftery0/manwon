import { For, Show, createMemo } from "solid-js";
import {
  approximateCarCongestion,
  congestionLabel,
  type Train,
} from "~/lib/trains";
import { getLineColor } from "~/lib/stations";

interface Props {
  train: Train;
  overallPercent: number | null; // 현재 역 시간대 평균 (없으면 null)
  onClose: () => void;
}

const STATUS_TEXT: Record<Train["status"], string> = {
  approaching: "진입 중",
  arrived: "정차 중",
  departed: "출발",
};

export function TrainPanel(props: Props) {
  const cars = createMemo<number[]>(() =>
    props.overallPercent != null
      ? approximateCarCongestion(props.overallPercent)
      : new Array(10).fill(0)
  );

  const recommended = createMemo<number | null>(() => {
    const arr = cars();
    if (arr.every((v) => v === 0)) return null;
    let minIdx = 0;
    for (let i = 1; i < arr.length; i++) if (arr[i] < arr[minIdx]) minIdx = i;
    return minIdx + 1; // 1~10
  });

  return (
    <div class="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-card">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <span
            class="inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-sm font-extrabold text-white"
            style={{ "background-color": getLineColor(props.train.line) }}
          >
            {props.train.line}
          </span>
          <div>
            <h2 class="text-xl font-extrabold tracking-tight text-(--color-text)">
              {props.train.terminalName || "—"}행
            </h2>
            <p class="mt-0.5 text-xs text-(--color-text-muted)">
              열차 #{props.train.trainNo} · {props.train.stationName} {STATUS_TEXT[props.train.status]}
              <Show when={props.train.express}>
                <span class="ml-1.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                  급행
                </span>
              </Show>
              <Show when={props.train.lastCar}>
                <span class="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  막차
                </span>
              </Show>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-(--color-text-muted) transition hover:bg-(--color-bg-soft) hover:text-(--color-text)"
        >
          닫기
        </button>
      </div>

      {/* 전체 혼잡도 요약 */}
      <Show
        when={props.overallPercent != null}
        fallback={
          <div class="rounded-xl bg-(--color-bg-soft) px-4 py-3 text-xs text-(--color-text-muted)">
            현재 역 혼잡도 통계가 없습니다.
          </div>
        }
      >
        {(_) => {
          const v = props.overallPercent!;
          const cl = congestionLabel(v);
          return (
            <div class="flex items-center justify-between rounded-xl bg-(--color-bg-soft) px-4 py-3">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">
                  {props.train.stationName} 현재 시간대 평균
                </p>
                <p class="mt-0.5 text-lg font-extrabold text-(--color-text)">{v}%</p>
              </div>
              <span
                class="rounded-lg px-3 py-1.5 text-sm font-bold text-white"
                style={{ "background-color": cl.color }}
              >
                {cl.label}
              </span>
            </div>
          );
        }}
      </Show>

      {/* 칸별 추정 분포 */}
      <div>
        <div class="mb-2 flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">
            칸별 추정 혼잡도 (1~10호차)
          </p>
          <Show when={recommended()}>
            <span class="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
              추천 {recommended()}호차
            </span>
          </Show>
        </div>

        <div class="flex items-end gap-1">
          <For each={cars()}>
            {(v, i) => {
              const cl = congestionLabel(v);
              const isRec = recommended() === i() + 1;
              return (
                <div class="flex flex-1 flex-col items-center gap-1">
                  <div
                    class="w-full rounded-md transition-all"
                    style={{
                      height: `${Math.min(80, v * 0.55)}px`,
                      "min-height": "6px",
                      "background-color": cl.color,
                      outline: isRec ? `2px solid ${cl.color}` : "none",
                      "outline-offset": "2px",
                    }}
                    title={`${i() + 1}호차 · ${v}%`}
                  />
                  <span class="text-[9px] font-bold text-(--color-text-muted)">
                    {i() + 1}
                  </span>
                </div>
              );
            }}
          </For>
        </div>
      </div>

      <p class="text-center text-[10px] leading-relaxed text-(--color-text-subtle)">
        * 실시간 칸별 혼잡도(센서 기반)는 또타지하철·TMAP 등 일부 앱에서만<br />
        제공되며 2호선 외에는 예측값입니다. 본 화면은 시간대 평균 분포 추정값.
      </p>
    </div>
  );
}
