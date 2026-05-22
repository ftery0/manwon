import { createSignal, Show } from "solid-js";
import { RouteForm } from "~/components/route/RouteForm";
import { CongestionTimeline } from "~/components/route/CongestionTimeline";
import { planRoute, type RouteResult } from "~/lib/route-planner";

export default function RoutePage() {
  const [routeResult, setRouteResult] = createSignal<RouteResult | null>(null);
  const [isSearched, setIsSearched] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal("");

  function handleSearch(from: string, to: string, time: string) {
    setIsSearched(true);
    setErrorMsg("");
    const result = planRoute(from, to, time);
    if (!result) {
      setRouteResult(null);
      setErrorMsg(
        `"${from}" → "${to}" 경로를 찾을 수 없습니다. 역명을 정확히 입력했는지 확인해주세요.`
      );
    } else {
      setRouteResult(result);
    }
  }

  return (
    <div class="mx-auto max-w-2xl px-5 py-16">
      <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-500" />
        경로 혼잡도
      </span>
      <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-(--color-text)">
        경로 기반 혼잡도 타임라인
      </h1>
      <p class="mt-3 text-base leading-relaxed text-(--color-text-muted)">
        출발역, 도착역, 출발 시각을 입력하면 정거장별 혼잡도를 타임라인으로
        보여줍니다. 1~8호선 모든 환승 경로를 자동 계산합니다.
      </p>

      <div class="mt-8">
        <RouteForm onSearch={handleSearch} />
      </div>

      <Show when={isSearched() && errorMsg()}>
        <div class="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {errorMsg()}
        </div>
      </Show>

      <Show when={routeResult() !== null}>
        <CongestionTimeline result={routeResult()!} />
      </Show>
    </div>
  );
}
