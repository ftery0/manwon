import {
  createResource,
  createSignal,
  createMemo,
  createEffect,
  onCleanup,
  onMount,
  Show,
  For,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { isServer } from "solid-js/web";
import { FilterBar } from "~/components/map/FilterBar";
import { SubwayMap } from "~/components/map/SubwayMap";
import { TrainPanel } from "~/components/map/TrainPanel";
import { CongestionChart } from "~/components/chart/CongestionChart";
import { SummaryCards } from "~/components/chart/SummaryCards";
import {
  fetchCongestionData,
  getCongestion,
  getSummary,
  type FilterType,
} from "~/lib/congestion";
import { STATIONS, getStation } from "~/lib/stations";
import {
  currentBucket,
  fetchTrains,
  resolveStation,
  type Train,
} from "~/lib/trains";

const POLL_MS = 8000;

export default function MapPage() {
  const [selectedStation, setSelectedStation] = createSignal<string | null>(null);
  const [selectedTrain, setSelectedTrain] = createSignal<Train | null>(null);
  const [filter, setFilter] = createSignal<FilterType>("weekday");
  const [query, setQuery] = createSignal("");

  const [congestionData] = createResource(fetchCongestionData);
  const [trainsData, { refetch: refetchTrains }] = createResource(
    () => (isServer ? null : "client"),
    () => fetchTrains()
  );

  // 폴링마다 새 배열·새 객체가 들어오는데 그대로 <For>에 넘기면
  // 모든 SVG <g>가 매번 destroy/recreate 되어 깜빡임 발생.
  // createStore + reconcile(key:"id") 로 같은 열차는 같은 reference 유지 → DOM 노드 재사용.
  const [trainStore, setTrainStore] = createStore<{ list: Train[] }>({ list: [] });
  createEffect(() => {
    const d = trainsData();
    if (!d) return;
    setTrainStore("list", reconcile(d.trains, { key: "id", merge: true }));
  });

  onMount(() => {
    if (isServer) return;
    const id = setInterval(() => refetchTrains(), POLL_MS);
    onCleanup(() => clearInterval(id));
  });

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

  const selectedTrainOverall = createMemo<number | null>(() => {
    const t = selectedTrain();
    const data = congestionData();
    if (!t || !data) return null;
    const station = resolveStation(t.line, t.stationName);
    if (!station) return null;
    const arr = getCongestion(data, station.id, filter());
    if (arr.every((v) => v === 0)) return null;
    return arr[currentBucket()] ?? 0;
  });

  const selectedTrainKey = createMemo(() => selectedTrain()?.id ?? null);

  const refreshedSelectedTrain = createMemo<Train | null>(() => {
    const cur = selectedTrain();
    if (!cur) return null;
    // store에서 같은 id를 찾아 최신 reference 반환 (같은 객체면 selectedTrain memo도 변하지 않음)
    const found = trainStore.list.find((t) => t.id === cur.id);
    return found ?? cur;
  });

  const hasSelection = () => !!refreshedSelectedTrain() || !!selectedStation();

  return (
    <div class="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-8">
      {/* 페이지 헤더 (컴팩트) */}
      <div class="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-(--color-primary-soft) px-2.5 py-1 text-[11px] font-semibold text-(--color-primary)">
            <span class="h-1.5 w-1.5 rounded-full bg-(--color-primary)" />
            실시간 노선도
          </span>
          <h1 class="mt-2 text-xl font-extrabold tracking-tight text-(--color-text) sm:text-2xl">
            수도권 노선도 · 실시간 운행
          </h1>
        </div>
        <Show when={trainsData()}>
          {(d) => (
            <p class="text-[11px] text-(--color-text-subtle) sm:text-right">
              {d().meta.totalTrains}대 운행 중 · 갱신{" "}
              {new Date(d().meta.fetchedAt).toLocaleTimeString("ko-KR")}
            </p>
          )}
        </Show>
      </div>

      <Show when={trainsData.error}>
        <p class="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700">
          실시간 데이터 불러오기 실패 — SEOUL_OPEN_API_KEY 환경변수 확인.
        </p>
      </Show>

      {/* ─── 상단: 노선도 (전폭, 큼) ─── */}
      <SubwayMap
        selectedStation={selectedStation()}
        onSelect={(id) => {
          setSelectedStation(id);
          setSelectedTrain(null);
        }}
        trains={trainStore.list}
        selectedTrainKey={selectedTrainKey()}
        onSelectTrain={(t) => {
          setSelectedTrain(t);
          setSelectedStation(null);
        }}
        isLive={!!trainsData() && !trainsData.error}
        pollIntervalMs={POLL_MS}
      />

      {/* ─── 하단: 검색 + 상세 패널 ─── */}
      <div class="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-12">
        {/* 검색 / 필터 (좌측 또는 상단) */}
        <div class="rounded-2xl bg-white p-4 shadow-card sm:p-5 lg:col-span-4">
          <p class="text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">
            역 검색
          </p>
          <div class="relative mt-2.5">
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

          <Show when={searchResults().length > 0}>
            <ul class="mt-2.5 flex flex-col gap-1">
              <For each={searchResults()}>
                {(s) => (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStation(s.id);
                        setSelectedTrain(null);
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
            <p class="mt-2.5 rounded-xl bg-(--color-bg-soft) px-3 py-3 text-xs text-(--color-text-muted)">
              검색 결과 없음. 1~8호선 역명을 입력하세요.
            </p>
          </Show>

          <div class="mt-4 border-t border-(--color-border-soft) pt-3">
            <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-(--color-text-muted)">
              기간
            </p>
            <FilterBar value={filter()} onChange={setFilter} />
          </div>
        </div>

        {/* 우측 (또는 하단): 선택된 역/열차 상세 */}
        <div class="lg:col-span-8">
          <Show
            when={refreshedSelectedTrain()}
            fallback={
              <Show
                when={selectedStation()}
                fallback={
                  <div class="flex h-full flex-col items-center justify-center rounded-2xl bg-(--color-bg-subtle) px-6 py-10 text-center sm:py-12">
                    <p class="text-3xl">🚇</p>
                    <p class="mt-3 text-sm font-bold text-(--color-text)">
                      역 또는 열차를 클릭하세요
                    </p>
                    <p class="mt-1.5 text-xs leading-relaxed text-(--color-text-muted)">
                      위 노선도에서 역 점이나 움직이는 열차를 클릭하면<br />
                      혼잡도 정보가 여기에 표시됩니다.
                    </p>
                  </div>
                }
              >
                <div class="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-card sm:p-5">
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
            }
          >
            {(t) => (
              <TrainPanel
                train={t()}
                overallPercent={selectedTrainOverall()}
                onClose={() => setSelectedTrain(null)}
              />
            )}
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
