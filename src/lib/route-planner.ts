import {
  STATIONS,
  LINE_ORDER,
  getStation,
  getStationsByName,
  type Station,
} from "~/lib/stations";

export interface RouteStop {
  time: string;
  station: string;
  line: string;
  congestionPct: number | null;
  label: "여유" | "보통" | "혼잡" | "환승";
  isTransfer: boolean;
  isStart: boolean;
  isEnd: boolean;
}

export interface RouteResult {
  stops: RouteStop[];
  totalMinutes: number;
  avgCongestion: number;
  busiestStop: RouteStop;
  transferCount: number;
}

const STOP_MINUTES = 2;
const TRANSFER_MINUTES = 3;

// ---------------------------------------------------------------------------
// 그래프 빌드
// ---------------------------------------------------------------------------

type EdgeType = "ride" | "transfer";

interface Edge {
  to: string;
  cost: number;
  type: EdgeType;
}

const GRAPH: Record<string, Edge[]> = (() => {
  const g: Record<string, Edge[]> = {};
  for (const s of STATIONS) g[s.id] = [];

  // 같은 호선 내 인접역
  for (const line of Object.keys(LINE_ORDER)) {
    const ids = LINE_ORDER[line];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!g[id]) g[id] = [];
      if (i > 0) g[id].push({ to: ids[i - 1], cost: STOP_MINUTES, type: "ride" });
      if (i < ids.length - 1)
        g[id].push({ to: ids[i + 1], cost: STOP_MINUTES, type: "ride" });
    }
  }

  // 환승 엣지 — 같은 이름의 다른 호선 역
  for (const s of STATIONS) {
    const same = getStationsByName(s.name);
    for (const other of same) {
      if (other.id !== s.id) {
        g[s.id].push({ to: other.id, cost: TRANSFER_MINUTES, type: "transfer" });
      }
    }
  }

  return g;
})();

// ---------------------------------------------------------------------------
// 최단 경로 (Dijkstra)
// ---------------------------------------------------------------------------

interface PathResult {
  ids: string[];
  edgeTypes: EdgeType[]; // 각 노드 진입 엣지 타입 (length = ids.length, 첫번째는 "ride" 더미)
}

function dijkstra(start: string, goal: string): PathResult | null {
  if (!GRAPH[start] || !GRAPH[goal]) return null;
  if (start === goal) return null;

  const dist: Record<string, number> = {};
  const prev: Record<string, { from: string; type: EdgeType } | null> = {};
  for (const id of Object.keys(GRAPH)) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[start] = 0;

  const visited = new Set<string>();

  while (true) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of Object.keys(dist)) {
      if (visited.has(id)) continue;
      if (dist[id] < best) {
        best = dist[id];
        u = id;
      }
    }
    if (u === null) break;
    if (u === goal) break;
    visited.add(u);

    for (const edge of GRAPH[u]) {
      if (visited.has(edge.to)) continue;
      const alt = dist[u] + edge.cost;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = { from: u, type: edge.type };
      }
    }
  }

  if (dist[goal] === Infinity) return null;

  const ids: string[] = [];
  const edgeTypes: EdgeType[] = [];
  let cur: string | null = goal;
  while (cur) {
    ids.push(cur);
    const p: { from: string; type: EdgeType } | null = prev[cur];
    if (p) edgeTypes.push(p.type);
    cur = p ? p.from : null;
  }
  ids.reverse();
  edgeTypes.reverse();
  // 첫 노드는 진입 엣지 없음 — "ride"로 패딩
  edgeTypes.unshift("ride");

  return { ids, edgeTypes };
}

// ---------------------------------------------------------------------------
// 혼잡도 계산 (간이 mock)
// ---------------------------------------------------------------------------

const STATION_WEIGHT: Record<string, number> = {
  강남: 1.4, 홍대입구: 1.3, 신촌: 1.2, 잠실: 1.25, 사당: 1.2,
  구로디지털단지: 1.15, 신도림: 1.2, 왕십리: 1.1, 건대입구: 1.1,
  선릉: 1.1, 역삼: 1.1, 교대: 1.1, 시청: 1.1, 을지로입구: 1.05,
  합정: 1.05, 신림: 1.1, 서울역: 1.15, 종로3가: 1.1,
};

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(":").map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

function addMinutes(t: string, mins: number): string {
  const { h, m } = parseTime(t);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function calcCongestion(stationName: string, timeStr: string): number {
  const { h } = parseTime(timeStr);
  const weight = STATION_WEIGHT[stationName] ?? 1.0;
  let base: number;
  if (h >= 7 && h < 9) base = 70 + Math.random() * 30;
  else if (h >= 18 && h < 20) base = 65 + Math.random() * 35;
  else if (h >= 9 && h < 18) base = 30 + Math.random() * 30;
  else base = 20 + Math.random() * 20;
  return Math.min(Math.round(base * weight), 130);
}

function toLabel(pct: number): "여유" | "보통" | "혼잡" {
  if (pct < 60) return "여유";
  if (pct < 90) return "보통";
  return "혼잡";
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

function pickStation(name: string): Station | null {
  const list = getStationsByName(name);
  return list[0] ?? null;
}

export function planRoute(
  fromName: string,
  toName: string,
  departureTime: string
): RouteResult | null {
  const fromStation = pickStation(fromName);
  const toStation = pickStation(toName);
  if (!fromStation || !toStation) return null;
  if (fromStation.name === toStation.name) return null;

  // 모든 출발지×도착지 호선 조합 중 최단 경로 탐색
  const fromCandidates = getStationsByName(fromName);
  const toCandidates = getStationsByName(toName);
  let best: { path: PathResult; cost: number } | null = null;

  for (const f of fromCandidates) {
    for (const t of toCandidates) {
      const path = dijkstra(f.id, t.id);
      if (!path) continue;
      const cost = path.edgeTypes
        .slice(1)
        .reduce((sum, type) => sum + (type === "transfer" ? TRANSFER_MINUTES : STOP_MINUTES), 0);
      if (!best || cost < best.cost) best = { path, cost };
    }
  }

  if (!best) return null;
  const { ids, edgeTypes } = best.path;

  const stops: RouteStop[] = [];
  let currentTime = departureTime;
  let transferCount = 0;

  for (let i = 0; i < ids.length; i++) {
    const st = getStation(ids[i])!;
    const incomingType = edgeTypes[i];
    const isStart = i === 0;
    const isEnd = i === ids.length - 1;
    const isTransfer = incomingType === "transfer" && !isStart;
    if (isTransfer) transferCount++;

    const congestionPct = isTransfer ? null : calcCongestion(st.name, currentTime);
    const label: RouteStop["label"] = isTransfer ? "환승" : toLabel(congestionPct!);

    stops.push({
      time: currentTime,
      station: st.name,
      line: isEnd ? "도착" : isTransfer ? `${st.line}호선 환승` : `${st.line}호선`,
      congestionPct,
      label,
      isTransfer,
      isStart,
      isEnd,
    });

    if (!isEnd) {
      const nextType = edgeTypes[i + 1];
      currentTime = addMinutes(
        currentTime,
        nextType === "transfer" ? TRANSFER_MINUTES : STOP_MINUTES
      );
    }
  }

  const valid = stops.filter(
    (s): s is RouteStop & { congestionPct: number } => s.congestionPct !== null
  );
  const avgCongestion =
    valid.length > 0
      ? Math.round(valid.reduce((sum, s) => sum + s.congestionPct, 0) / valid.length)
      : 0;
  const busiestStop =
    valid.length > 0
      ? valid.reduce((max, s) => (s.congestionPct > max.congestionPct ? s : max), valid[0])
      : stops[0]!;

  return {
    stops,
    totalMinutes: best.cost,
    avgCongestion,
    busiestStop,
    transferCount,
  };
}

/** 검색용: 중복 제거된 모든 역 이름 (가나다순) */
export const ALL_STATION_NAMES: string[] = Array.from(
  new Set(STATIONS.map((s) => s.name))
).sort((a, b) => a.localeCompare(b, "ko"));
