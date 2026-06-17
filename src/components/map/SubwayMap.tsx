import { createMemo, createSignal, For, Show, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import {
  STATIONS,
  getLineColor,
  getStation,
  type Station,
} from "~/lib/stations";
import {
  SVG_STATION_COORDS,
  SVG_VIEW_W,
  SVG_VIEW_H,
} from "~/lib/data/svg-coords.generated";
import {
  getNextStationId,
  resolveStation,
  statusToProgress,
  type Train,
} from "~/lib/trains";

interface Props {
  selectedStation?: string | null;
  onSelect?: (stationId: string) => void;
  trains?: Train[];
  selectedTrainKey?: string | null;
  onSelectTrain?: (train: Train) => void;
  isLive?: boolean;
  pollIntervalMs?: number; // 폴링 간격(ms) — CSS transition duration로 사용
}

interface PositionedStation extends Station {
  x: number;
  y: number;
}

const POSITIONED: PositionedStation[] = STATIONS
  .map((s) => {
    const c = SVG_STATION_COORDS[s.name];
    if (!c) return null;
    return { ...s, x: c.x, y: c.y };
  })
  .filter((s): s is PositionedStation => s !== null);

const POS_INDEX: Record<string, PositionedStation> = (() => {
  const m: Record<string, PositionedStation> = {};
  for (const s of POSITIONED) m[s.id] = s;
  return m;
})();

// 위치 + 진행 각도(deg) 동시 계산 — 트랙 방향으로 열차 회전
function computeTrainPlacement(
  train: Train
): { x: number; y: number; angle: number } | null {
  const cur = resolveStation(train.line, train.stationName);
  if (!cur) return null;
  const curPos = POS_INDEX[cur.id];
  if (!curPos) return null;

  const nextId = getNextStationId(train.line, cur.id, train.terminalName);
  const nextPos = nextId ? POS_INDEX[nextId] : null;
  const t = statusToProgress(train.status);

  const x = nextPos ? curPos.x + (nextPos.x - curPos.x) * t : curPos.x;
  const y = nextPos ? curPos.y + (nextPos.y - curPos.y) * t : curPos.y;

  // 진행 방향 각도 — 다음 역이 없으면 0(우향) 유지
  let angle = 0;
  if (nextPos) {
    angle =
      (Math.atan2(nextPos.y - curPos.y, nextPos.x - curPos.x) * 180) / Math.PI;
  }

  return { x, y, angle };
}

export function SubwayMap(props: Props) {
  let containerRef: HTMLDivElement | undefined;

  const [scale, setScale] = createSignal(1);
  const [tx, setTx] = createSignal(0);
  const [ty, setTy] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 8;

  // ─── 마우스 드래그 ───
  let dragStart:
    | { x: number; y: number; tx: number; ty: number; moved: boolean }
    | null = null;

  const onMouseDown = (e: MouseEvent) => {
    dragStart = { x: e.clientX, y: e.clientY, tx: tx(), ty: ty(), moved: false };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragStart) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStart.moved = true;
      setIsDragging(true);
    }
    setTx(dragStart.tx + dx);
    setTy(dragStart.ty + dy);
  };

  const onMouseUp = () => {
    dragStart = null;
    setIsDragging(false);
  };

  // ─── zoom-to-point 수학 ───
  // 화면의 (mx, my) 픽셀이 줌 전후 동일한 SVG 좌표를 가리키도록 tx, ty 보정
  // 전제: 컨테이너는 left:50% top:50% + translate(-50%,-50%) 로 SVG가 centered
  function zoomAtPoint(newScaleRaw: number, mx: number, my: number) {
    if (!containerRef) {
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScaleRaw)));
      return;
    }
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScaleRaw));
    const rect = containerRef.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // 컨테이너 중심 기준 마우스 상대 좌표
    const rx = mx - cx;
    const ry = my - cy;
    const oldScale = scale();
    const factor = newScale / oldScale;
    // tx' = rx * (1 - factor) + tx * factor
    setTx((prev) => rx * (1 - factor) + prev * factor);
    setTy((prev) => ry * (1 - factor) + prev * factor);
    setScale(newScale);
  }

  // ─── 휠 줌 (커서 위치 기준) ───
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const target = scale() * (1 + delta);
    zoomAtPoint(target, e.clientX, e.clientY);
  };

  // ─── 터치 드래그 + 핀치 줌 ───
  let touchStart:
    | {
        x: number;
        y: number;
        tx: number;
        ty: number;
        moved: boolean;
      }
    | null = null;
  let pinchStart:
    | { dist: number; cx: number; cy: number; scale: number }
    | null = null;

  function dist2(a: Touch, b: Touch): number {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY, tx: tx(), ty: ty(), moved: false };
      pinchStart = null;
    } else if (e.touches.length === 2) {
      const a = e.touches[0];
      const b = e.touches[1];
      pinchStart = {
        dist: dist2(a, b),
        cx: (a.clientX + b.clientX) / 2,
        cy: (a.clientY + b.clientY) / 2,
        scale: scale(),
      };
      touchStart = null;
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && pinchStart) {
      e.preventDefault();
      const a = e.touches[0];
      const b = e.touches[1];
      const d = dist2(a, b);
      const ratio = d / pinchStart.dist;
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      zoomAtPoint(pinchStart.scale * ratio, cx, cy);
      // 핀치 중심도 따라 움직이면 자연스러움 → 간단히 cx, cy 갱신 가능하지만 일단 시작점 기준 유지
    } else if (e.touches.length === 1 && touchStart) {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        touchStart.moved = true;
        setIsDragging(true);
      }
      setTx(touchStart.tx + dx);
      setTy(touchStart.ty + dy);
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) {
      touchStart = null;
      pinchStart = null;
      setIsDragging(false);
    } else if (e.touches.length === 1 && pinchStart) {
      // 핀치 → 한 손가락 전환 → 드래그 시작점 재초기화
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY, tx: tx(), ty: ty(), moved: false };
      pinchStart = null;
    }
  };

  // ─── 이벤트 라이프사이클 ───
  onMount(() => {
    if (isServer) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    containerRef?.addEventListener("wheel", onWheel, { passive: false });
    containerRef?.addEventListener("touchstart", onTouchStart, { passive: true });
    containerRef?.addEventListener("touchmove", onTouchMove, { passive: false });
    containerRef?.addEventListener("touchend", onTouchEnd, { passive: true });
    containerRef?.addEventListener("touchcancel", onTouchEnd, { passive: true });
  });

  onCleanup(() => {
    if (isServer) return;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    containerRef?.removeEventListener("wheel", onWheel);
    containerRef?.removeEventListener("touchstart", onTouchStart);
    containerRef?.removeEventListener("touchmove", onTouchMove);
    containerRef?.removeEventListener("touchend", onTouchEnd);
    containerRef?.removeEventListener("touchcancel", onTouchEnd);
  });

  // ─── 줌 버튼 (커서 없이도 작동: 컨테이너 중심에서 줌) ───
  const zoomBy = (factor: number) => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    zoomAtPoint(scale() * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  const zoomIn = () => zoomBy(1.25);
  const zoomOut = () => zoomBy(1 / 1.25);
  const reset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };

  // ─── 선택 강조 ───
  const selectedName = createMemo(() => {
    const id = props.selectedStation;
    if (!id) return null;
    return getStation(id)?.name ?? null;
  });

  function handleStationClick(s: PositionedStation, e: MouseEvent) {
    if (dragStart?.moved || touchStart?.moved) return;
    e.stopPropagation();
    props.onSelect?.(s.id);
  }

  function handleTrainClick(t: Train, e: MouseEvent) {
    if (dragStart?.moved || touchStart?.moved) return;
    e.stopPropagation();
    props.onSelectTrain?.(t);
  }

  // 폴링 간격에 맞춘 transition duration (ms). 기본 8000.
  const transitionMs = () => props.pollIntervalMs ?? 8000;

  return (
    <div class="relative h-[70vh] min-h-[520px] w-full overflow-hidden rounded-2xl bg-white sm:h-[78vh] sm:min-h-[640px] lg:h-[82vh] lg:min-h-[760px]">
      <div
        ref={containerRef}
        class={`absolute inset-0 ${isDragging() ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={onMouseDown}
        style={{ "touch-action": "none" }}
      >
        <svg
          viewBox={`0 0 ${SVG_VIEW_W} ${SVG_VIEW_H}`}
          class="pointer-events-auto absolute left-1/2 top-1/2 h-full w-auto max-w-none select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${tx()}px, ${ty()}px) scale(${scale()})`,
            "transform-origin": "center center",
            transition: isDragging() ? "none" : "transform 0.05s linear",
          }}
        >
          {/* 레이어 1: 공식 노선도 (배경) */}
          <image
            href="/seoul-subway-map.svg"
            x={0}
            y={0}
            width={SVG_VIEW_W}
            height={SVG_VIEW_H}
            style={{ "pointer-events": "none" }}
          />

          {/* 레이어 2: 역 클릭 영역 */}
          <For each={POSITIONED}>
            {(s) => (
              <circle
                cx={s.x}
                cy={s.y}
                r={4.5}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={(e) => handleStationClick(s, e)}
              >
                <title>{s.name} ({s.line}호선)</title>
              </circle>
            )}
          </For>

          {/* 레이어 3: 선택된 역 강조 */}
          <Show when={props.selectedStation && POS_INDEX[props.selectedStation!]}>
            {(pos) => {
              const p = pos();
              return (
                <g style={{ "pointer-events": "none" }}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill="none"
                    stroke={getLineColor(p.line)}
                    stroke-width="0.8"
                  >
                    <animate attributeName="r" from="3" to="8" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <rect
                    x={p.x + 3.5}
                    y={p.y - 4}
                    width={Math.max(p.name.length * 3.5 + 4, 16)}
                    height={6.5}
                    rx={2}
                    fill="#0F172A"
                  />
                  <text
                    x={p.x + 5}
                    y={p.y + 0.5}
                    font-size="4"
                    font-weight="700"
                    fill="white"
                  >
                    {p.name}
                  </text>
                </g>
              );
            }}
          </Show>

          {/* 레이어 4: 실시간 열차 — 방향 따라가는 열차 아이콘
              - 외부 translate: CSS transition으로 부드러운 이동
              - 중간 scale(1/zoom): 줌과 무관하게 마커가 항상 일정 픽셀 크기 (카카오맵 방식)
              - 내부 rotate: 트랙 방향으로 본체만 회전 (펄스·번호는 회전 안 함) */}
          <For each={props.trains ?? []}>
            {(t) => {
              const placement = () => computeTrainPlacement(t);
              const isSelected = () => props.selectedTrainKey === t.id;
              const color = getLineColor(t.line);
              const tMs = transitionMs();
              // 마커 크기 보정 — 줌 1배일 때 본체 폭이 화면상 ~30px 정도가 되도록
              // viewBox 1150단위 → 화면 ~1112px 라 1 unit ≈ 0.97px.
              // MARKER_BASE * 본체 폭(2.4) = 14 * 2.4 = 33.6 viewBox ≈ 32 화면 px
              const MARKER_BASE = 14;
              const invZoom = () => MARKER_BASE / scale();
              return (
                <Show when={placement()}>
                  {(p) => (
                    <g
                      onClick={(e) => handleTrainClick(t, e)}
                      style={{
                        cursor: "pointer",
                        transition: `transform ${tMs}ms linear`,
                      }}
                      transform={`translate(${p().x.toFixed(2)}, ${p().y.toFixed(2)})`}
                    >
                      {/* 줌 인버스 스케일 그룹 — 마커 절대 픽셀 크기 유지 */}
                      <g transform={`scale(${invZoom().toFixed(3)})`}>
                        {/* 외곽 halo */}
                        <circle cx={0} cy={0} r={1.7} fill={color} opacity={isSelected() ? 0.4 : 0.22}>
                          <animate
                            attributeName="r"
                            values={isSelected() ? "1.7;2.6;1.7" : "1.6;2.2;1.6"}
                            dur="2.2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values={isSelected() ? "0.5;0.15;0.5" : "0.32;0.08;0.32"}
                            dur="2.2s"
                            repeatCount="indefinite"
                          />
                        </circle>

                        {/* 열차 본체 (트랙 방향으로 회전) */}
                        <g
                          transform={`rotate(${p().angle.toFixed(1)})`}
                          style={{ transition: `transform ${tMs}ms linear` }}
                        >
                          {/* 그림자 */}
                          <rect
                            x={-1.18}
                            y={-0.32}
                            width={2.36}
                            height={0.78}
                            rx={0.36}
                            fill="rgba(0,0,0,0.22)"
                          />
                          {/* 본체 */}
                          <rect
                            x={-1.2}
                            y={-0.38}
                            width={2.4}
                            height={0.78}
                            rx={0.4}
                            fill={color}
                            stroke="white"
                            stroke-width={isSelected() ? 0.13 : 0.08}
                          />
                          {/* 차량 구분선 — 2량 분리 */}
                          <line x1={-0.4} y1={-0.32} x2={-0.4} y2={0.32} stroke="white" stroke-width={0.05} opacity={0.9} />
                          <line x1={0.4} y1={-0.32} x2={0.4} y2={0.32} stroke="white" stroke-width={0.05} opacity={0.9} />
                          {/* 창문 (작은 흰 점들로 디테일) */}
                          <rect x={-1.0} y={-0.16} width={0.4} height={0.18} rx={0.04} fill="rgba(255,255,255,0.55)" />
                          <rect x={0.0} y={-0.16} width={0.4} height={0.18} rx={0.04} fill="rgba(255,255,255,0.55)" />
                          {/* 진행 방향 헤드라이트 (앞 끝) */}
                          <circle cx={1.0} cy={0} r={0.11} fill="#FFF59D" opacity={0.95} />
                        </g>

                        {/* 호선 번호 배지 (항상 똑바로) */}
                        <circle cx={0} cy={0} r={0.45} fill="white" stroke={color} stroke-width={0.13} />
                        <text
                          x={0}
                          y={0.18}
                          text-anchor="middle"
                          font-size={0.6}
                          font-weight={800}
                          fill={color}
                          style={{ "pointer-events": "none" }}
                        >
                          {t.line}
                        </text>
                      </g>
                    </g>
                  )}
                </Show>
              );
            }}
          </For>
        </svg>
      </div>

      {/* ─── 오버레이 UI ─── */}

      {/* 실시간 상태 pill (좌상) */}
      <div class="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold shadow-card backdrop-blur sm:left-4 sm:top-4">
        <Show
          when={props.isLive}
          fallback={
            <>
              <span class="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span class="text-slate-500">실시간 연결 안됨</span>
            </>
          }
        >
          <span class="relative inline-flex h-2 w-2">
            <span class="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span class="text-emerald-700">
            실시간 운행 {props.trains?.length ?? 0}대
          </span>
        </Show>
      </div>

      {/* 줌 컨트롤 (우상) */}
      <div class="absolute right-3 top-3 flex flex-col gap-1.5 rounded-2xl bg-white/95 p-1.5 shadow-card backdrop-blur sm:right-4 sm:top-4">
        <button
          type="button"
          onClick={zoomIn}
          class="flex h-10 w-10 items-center justify-center rounded-xl text-(--color-text) transition hover:bg-(--color-bg-soft)"
          aria-label="확대"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={zoomOut}
          class="flex h-10 w-10 items-center justify-center rounded-xl text-(--color-text) transition hover:bg-(--color-bg-soft)"
          aria-label="축소"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={reset}
          class="flex h-10 w-10 items-center justify-center rounded-xl text-(--color-text-muted) transition hover:bg-(--color-bg-soft) hover:text-(--color-text)"
          aria-label="원래 크기"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      {/* 안내 (좌하) */}
      <div class="absolute bottom-3 left-3 hidden rounded-xl bg-white/95 px-3 py-2 text-[11px] font-medium text-(--color-text-muted) shadow-card backdrop-blur sm:block">
        역/열차 클릭 · 드래그 이동 · 휠/핀치 줌
      </div>

      {/* 줌 배율 (우하) */}
      <div class="absolute right-3 bottom-3 rounded-xl bg-white/95 px-3 py-1.5 text-[11px] font-bold text-(--color-text-muted) shadow-card sm:right-4 sm:bottom-4">
        {Math.round(scale() * 100)}%
      </div>
    </div>
  );
}
