import { createResource, createSignal, createMemo, Show, For } from "solid-js";
import { FilterBar } from "~/components/map/FilterBar";
import { SubwayMap } from "~/components/map/SubwayMap";
import { CongestionChart } from "~/components/chart/CongestionChart";
import { SummaryCards } from "~/components/chart/SummaryCards";
import {
  fetchCongestionData,
  getCongestion,
  getSummary,
  type FilterType,
} from "~/lib/congestion";
import { STATIONS, getStation } from "~/lib/stations";

export default function MapPage() {
  const [selectedStation, setSelectedStation] = createSignal<string | null>(null);
  const [filter, setFilter] = createSignal<FilterType>("weekday");
  const [query, setQuery] = createSignal("");

  const [congestionData] = createResource(fetchCongestionData);

  const selectedName = createMemo(() => {
    const id = selectedStation();
    if (!id) return null;
    return getStation(id)?.name ?? id;
  });

  const searchResults = createMemo(() => {
    const q = query().trim();
    if (!q) return [];
    return STATIONS.filter((s) => s.name.includes(q)).slice(0, 8);
  });

  const congestionValues = createMemo<number[]>(() => {
    const data = congestionData();
    const id = selectedStation();
    if (!data || !id) return new Array(48).fill(0);
    return getCongestion(data, id, filter());
  });

  const summary = createMemo(() => getSummary(congestionValues()));

  return (
    <div class="mx-auto max-w-7xl px-5 py-8 lg:py-10">
      {/* 페이지 헤더 */}
      <div class="mb-6">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-(--color-primary-soft) px-3 py-1.5 text-xs font-semibold text-(--color-primary)">
          <span class="h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
          노선도 탐색
        </span>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-(--color-text) sm:text-[2rem]">
          수도권 전체 노선도
        </h1>
        <p class="mt-2 text-sm text-(--color-text-muted)">
          1~9호선과 수도권 광역철도까지. 역을 검색해 시간대별 혼잡도를 확인하세요.
        </p>
      </div>

      {/* 메인 레이아웃 */}
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* 노선도 (좌) */}
        <div class="w-full lg:w-[62%]">
          <SubwayMap selectedStation={selectedStation()} />
        </div>

        {/* 우측 패널 */}
        <div class="flex w-full flex-col gap-4 lg:w-[38%]">
          {/* 검색 카드 */}
          <div class="rounded-2xl bg-white p-5 shadow-card">
            <p class="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">
              역 검색
            </p>
            <div class="relative mt-3">
              <input
                type="text"
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                placeholder="예: 강남, 잠실, 홍대입구"
                class="w-full rounded-xl bg-(--color-bg-soft) px-4 py-3 text-sm font-medium text-(--color-text) placeholder:text-(--color-text-subtle) focus:bg-white focus:outline-2 focus:outline-(--color-primary)"
              />
              <Show when={query()}>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text)"
                  aria-label="검색어 지우기"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
              </Show>
            </div>

            {/* 자동완성 결과 */}
            <Show when={searchResults().length > 0}>
              <ul class="mt-3 flex flex-col gap-1">
                <For each={searchResults()}>
                  {(s) => (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStation(s.id);
                          setQuery("");
                        }}
                        class="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-(--color-bg-soft)"
                      >
                        <span class="text-sm font-bold text-(--color-text)">{s.name}</span>
                        <span class="rounded-md bg-(--color-primary-soft) px-2 py-0.5 text-[11px] font-bold text-(--color-primary)">
                          {s.line}호선
                        </span>
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
            <Show when={query() && searchResults().length === 0}>
              <p class="mt-3 rounded-xl bg-(--color-bg-soft) px-3 py-3 text-xs text-(--color-text-muted)">
                검색 결과가 없어요. 현재 혼잡도 데이터는 2호선 위주로 제공돼요.
              </p>
            </Show>

            {/* 필터 */}
            <div class="mt-4 border-t border-(--color-border-soft) pt-4">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">
                기간
              </p>
              <FilterBar value={filter()} onChange={setFilter} />
            </div>
          </div>

          {/* 선택된 역 혼잡도 */}
          <Show
            when={selectedStation()}
            fallback={
              <div class="flex flex-col items-center justify-center rounded-2xl bg-(--color-bg-subtle) px-6 py-10 text-center">
                <p class="text-3xl">🚇</p>
                <p class="mt-3 text-sm font-bold text-(--color-text)">역을 검색하세요</p>
                <p class="mt-1.5 text-xs text-(--color-text-muted)">
                  위 검색창에 역 이름을 입력하면<br />시간대별 혼잡도가 표시됩니다.
                </p>
              </div>
            }
          >
            <div class="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-card">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-xl font-extrabold tracking-tight text-(--color-text)">
                    {selectedName()}
                  </h2>
                  <p class="mt-0.5 text-xs text-(--color-text-muted)">
                    {getStation(selectedStation()!)?.line}호선 · 시간대별 혼잡도
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStation(null)}
                  class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-(--color-text-muted) transition hover:bg-(--color-bg-soft) hover:text-(--color-text)"
                >
                  닫기
                </button>
              </div>

              <SummaryCards summary={summary()} />

              <div>
                <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">
                  시간대별 혼잡도
                </p>
                <CongestionChart values={congestionValues()} />
              </div>

              <p class="text-center text-[10px] text-(--color-text-subtle)">
                * 공공데이터 기반 평균값 / 실제와 다를 수 있음
              </p>
            </div>
          </Show>
        </div>
      </div>

      <Show when={congestionData.loading}>
        <p class="mt-4 animate-pulse text-center text-xs text-(--color-text-muted)">
          데이터 로딩 중...
        </p>
      </Show>
    </div>
  );
}
