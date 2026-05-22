import { createSignal, For, Show } from "solid-js";
import { bucketToTime } from "~/lib/congestion";

interface TooltipState {
  x: number;
  y: number;
  index: number;
  value: number;
}

interface Props {
  values: number[];
  highlight?: number;
}

function barColor(value: number): string {
  if (value < 55) return "#4ADE80";
  if (value < 80) return "#FBBF24";
  return "#F87171";
}

function statusLabel(value: number): string {
  if (value < 55) return "여유";
  if (value < 80) return "보통";
  return "혼잡";
}

const CHART_W = 580;
const CHART_H = 220;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 40 };
const PLOT_W = CHART_W - MARGIN.left - MARGIN.right;
const PLOT_H = CHART_H - MARGIN.top - MARGIN.bottom;
const MAX_VAL = 130;
const NUM_BUCKETS = 48;

export function CongestionChart(props: Props) {
  const [tooltip, setTooltip] = createSignal<TooltipState | null>(null);

  const barW = PLOT_W / NUM_BUCKETS;

  const yTicks = [0, 20, 40, 60, 80, 100, 120];
  const xTickHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

  function yPos(value: number): number {
    return PLOT_H - (value / MAX_VAL) * PLOT_H;
  }

  function handleMouseEnter(e: MouseEvent, i: number) {
    const svg = (e.currentTarget as SVGElement).closest("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = CHART_W / rect.width;
    const scaleY = CHART_H / rect.height;
    const tx = (e.clientX - rect.left) * scaleX;
    const ty = (e.clientY - rect.top) * scaleY;
    setTooltip({ x: tx, y: ty, index: i, value: props.values[i] ?? 0 });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      class="w-full"
      style={{ "max-height": "280px" }}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Y 그리드 + 축 */}
        <For each={yTicks}>
          {(tick) => (
            <>
              <line
                x1={0}
                y1={yPos(tick)}
                x2={PLOT_W}
                y2={yPos(tick)}
                stroke="#E5E7EB"
                stroke-width="1"
              />
              <text
                x={-6}
                y={yPos(tick) + 4}
                text-anchor="end"
                font-size="10"
                fill="#6B7280"
              >
                {tick}
              </text>
            </>
          )}
        </For>

        {/* X 축 레이블 */}
        <For each={xTickHours}>
          {(h) => {
            const bucketIdx = h * 2;
            const xCenter = bucketIdx * barW + barW / 2;
            return (
              <text
                x={xCenter}
                y={PLOT_H + 20}
                text-anchor="middle"
                font-size="10"
                fill="#6B7280"
              >
                {h}
              </text>
            );
          }}
        </For>

        {/* 바 */}
        <For each={props.values}>
          {(val, i) => {
            const x = i() * barW;
            const h = (val / MAX_VAL) * PLOT_H;
            const y = PLOT_H - h;
            const isHighlighted = tooltip()?.index === i();
            return (
              <rect
                x={x + 1}
                y={y}
                width={Math.max(barW - 2, 1)}
                height={h}
                fill={barColor(val)}
                opacity={isHighlighted ? 1 : 0.82}
                rx="1"
                onMouseEnter={(e) => handleMouseEnter(e, i())}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: "crosshair" }}
              />
            );
          }}
        </For>

        {/* 툴팁 */}
        <Show when={tooltip()}>
          {(tip) => {
            const val = tip().value;
            const tipW = 90;
            const tipH = 56;
            let tipX = tip().x - MARGIN.left - tipW / 2;
            let tipY = tip().y - MARGIN.top - tipH - 8;
            // 경계 클램프
            tipX = Math.max(0, Math.min(tipX, PLOT_W - tipW));
            tipY = Math.max(0, tipY);

            return (
              <g transform={`translate(${tipX},${tipY})`} style={{ "pointer-events": "none" }}>
                <rect
                  x={0}
                  y={0}
                  width={tipW}
                  height={tipH}
                  rx="6"
                  fill="white"
                  stroke="#E5E7EB"
                  stroke-width="1"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                />
                <text x={8} y={18} font-size="10" fill="#6B7280">
                  {bucketToTime(tip().index)}
                </text>
                <text x={8} y={34} font-size="13" font-weight="600" fill="#0F172A">
                  {val}%
                </text>
                <text x={8} y={48} font-size="10" fill={barColor(val)}>
                  {statusLabel(val)}
                </text>
              </g>
            );
          }}
        </Show>
      </g>
    </svg>
  );
}
