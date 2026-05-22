import { createSignal, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";

interface Props {
  /** 선택된 역 이름 (예: "강남"). 사이드 검색 패널에서 전달. */
  selectedStation?: string | null;
}

/**
 * 서울 수도권 전체 노선도 뷰어.
 * 원본 SVG: github.com/Sinseiki/opensource-seoul-subway-map (MIT)
 * 드래그 팬 + 휠 줌.
 */
export function SubwayMap(_props: Props) {
  let containerRef: HTMLDivElement | undefined;

  // 초기 스케일을 크게 — 한 화면에 빡빡하게 차도록
  const [scale, setScale] = createSignal(1.8);
  const [tx, setTx] = createSignal(0);
  const [ty, setTy] = createSignal(0);

  const MIN_SCALE = 0.6;
  const MAX_SCALE = 5;

  let dragStart: { x: number; y: number; tx: number; ty: number } | null = null;

  const onMouseDown = (e: MouseEvent) => {
    dragStart = { x: e.clientX, y: e.clientY, tx: tx(), ty: ty() };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragStart) return;
    setTx(dragStart.tx + (e.clientX - dragStart.x));
    setTy(dragStart.ty + (e.clientY - dragStart.y));
  };

  const onMouseUp = () => {
    dragStart = null;
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale() * (1 + delta)));
    setScale(newScale);
  };

  onMount(() => {
    if (isServer) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    containerRef?.addEventListener("wheel", onWheel, { passive: false });
  });

  onCleanup(() => {
    if (isServer) return;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    containerRef?.removeEventListener("wheel", onWheel);
  });

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s * 1.25));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, s / 1.25));
  const reset = () => {
    setScale(1.8);
    setTx(0);
    setTy(0);
  };

  return (
    <div class="relative h-[680px] w-full overflow-hidden rounded-2xl bg-(--color-bg-subtle) lg:h-[820px]">
      <div
        ref={containerRef}
        class="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        style={{ "touch-action": "none" }}
      >
        <img
          src="/seoul-subway-map.svg"
          alt="서울 수도권 전체 노선도"
          draggable={false}
          class="pointer-events-none absolute left-1/2 top-1/2 h-full w-auto max-w-none select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${tx()}px, ${ty()}px) scale(${scale()})`,
            "transform-origin": "center center",
            transition: dragStart ? "none" : "transform 0.18s ease-out",
          }}
        />
      </div>

      {/* 줌 컨트롤 */}
      <div class="absolute right-4 top-4 flex flex-col gap-1.5 rounded-2xl bg-white p-1.5 shadow-card">
        <button
          type="button"
          onClick={zoomIn}
          class="flex h-9 w-9 items-center justify-center rounded-xl text-(--color-text) transition hover:bg-(--color-bg-soft)"
          aria-label="확대"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={zoomOut}
          class="flex h-9 w-9 items-center justify-center rounded-xl text-(--color-text) transition hover:bg-(--color-bg-soft)"
          aria-label="축소"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={reset}
          class="flex h-9 w-9 items-center justify-center rounded-xl text-(--color-text-muted) transition hover:bg-(--color-bg-soft) hover:text-(--color-text)"
          aria-label="원래 크기"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      {/* 줌 배율 표시 */}
      <div class="absolute right-4 bottom-4 rounded-xl bg-white/95 px-3 py-1.5 text-[11px] font-bold text-(--color-text-muted) shadow-card">
        {Math.round(scale() * 100)}%
      </div>

      {/* 안내 */}
      <div class="absolute bottom-4 left-4 rounded-xl bg-white/95 px-3 py-2 text-[11px] font-medium text-(--color-text-muted) shadow-card backdrop-blur">
        드래그로 이동 · 휠로 줌 · 1~9호선 수도권 전체
      </div>
    </div>
  );
}
