import { createSignal, Show } from "solid-js";
import { Badge } from "~/components/ui/Badge";
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
        `"${from}" → "${to}" 경로를 찾을 수 없습니다. 2호선 역명을 정확히 입력해주세요.`
      );
    } else {
      setRouteResult(result);
    }
  }

  return (
    <div class="mx-auto max-w-2xl px-5 py-16">
      <Badge>F2 — 경로 혼잡도</Badge>
      <h1 class="mt-4 text-3xl font-bold text-(--color-text)">
        경로 기반 혼잡도 타임라인
      </h1>
      <p class="mt-3 text-base text-(--color-text-muted)">
        출발역, 도착역, 출발 시각을 입력하면 정거장별 혼잡도를 타임라인으로
        보여줍니다. (2호선)
      </p>

      <div class="mt-8">
        <RouteForm onSearch={handleSearch} />
      </div>

      <Show when={isSearched() && errorMsg()}>
        <div class="mt-6 rounded-xl border border-(--color-congestion-high)/30 bg-red-50 px-5 py-4 text-sm text-red-600">
          {errorMsg()}
        </div>
      </Show>

      <Show when={routeResult() !== null}>
        <CongestionTimeline result={routeResult()!} />
      </Show>
    </div>
  );
}
