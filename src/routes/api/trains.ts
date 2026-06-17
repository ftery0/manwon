import type { APIEvent } from "@solidjs/start/server";

// 서울 열린데이터광장 실시간 열차 위치정보 (OA-12601)
// 공식 샘플: http://swopenapi.seoul.go.kr/api/subway/sample/json/realtimePosition/0/5/2호선
// 실키 사용 시: http://swopenapi.seoul.go.kr/api/subway/{KEY}/json/realtimePosition/{START}/{END}/{lineName}

const BASE = "http://swopenapi.seoul.go.kr/api/subway";
const LINES = ["1호선", "2호선", "3호선", "4호선", "5호선", "6호선", "7호선", "8호선"];

// subwayId → 호선 번호 (우리 데이터의 line key)
const SUBWAY_ID_TO_LINE: Record<string, string> = {
  "1001": "1",
  "1002": "2",
  "1003": "3",
  "1004": "4",
  "1005": "5",
  "1006": "6",
  "1007": "7",
  "1008": "8",
};

interface ApiRow {
  subwayId: string;
  subwayNm: string;
  statnId: string;
  statnNm: string;
  trainNo: string;
  recptnDt: string; // "2026-06-16 15:35:27"
  updnLine: string; // "0" 상행 / "1" 하행
  statnTid: string;
  statnTnm: string;
  trainSttus: string; // "0" 진입중? "1" 진입 "2" 도착 "3" 출발
  directAt: string;  // "0" 일반 / "1" 급행
  lstcarAt: string;  // "0" / "1" 막차
}

interface ApiResp {
  errorMessage?: { status: number; code: string; message: string; total: number };
  status?: number;
  code?: string;
  message?: string;
  realtimePositionList?: ApiRow[];
}

export interface Train {
  id: string;             // 안정적 키 "line-trainNo" — store reconcile용
  line: string;           // "2"
  trainNo: string;        // "2277"
  stationName: string;    // "강변"
  terminalName: string;   // "성수"
  direction: "up" | "down"; // updnLine 0=up, 1=down
  status: "approaching" | "arrived" | "departed";
  express: boolean;
  lastCar: boolean;
  receivedAt: string;
}

export interface TrainsResponse {
  meta: {
    fetchedAt: string;
    source: string;
    totalTrains: number;
    lineCounts: Record<string, number>;
  };
  trains: Train[];
}

// "남한산성입구(성남법원,검찰청)" → "남한산성입구"
function normalizeStationName(name: string): string {
  return name.replace(/\(.*?\)/g, "").trim();
}

function rowToTrain(row: ApiRow): Train | null {
  const line = SUBWAY_ID_TO_LINE[row.subwayId];
  if (!line) return null;

  const statusMap: Record<string, Train["status"]> = {
    "0": "approaching",
    "1": "approaching",
    "2": "arrived",
    "3": "departed",
  };

  // 종착역명에 "행" / "종착" 같은 접미사가 붙어있을 수 있음 — 제거
  const terminal = row.statnTnm
    ?.replace(/(행|종착)$/g, "")
    .trim();

  return {
    id: `${line}-${row.trainNo}`,
    line,
    trainNo: row.trainNo,
    stationName: normalizeStationName(row.statnNm),
    terminalName: normalizeStationName(terminal ?? ""),
    direction: row.updnLine === "0" ? "up" : "down",
    status: statusMap[row.trainSttus] ?? "approaching",
    express: row.directAt === "1",
    lastCar: row.lstcarAt === "1",
    receivedAt: row.recptnDt,
  };
}

async function fetchLine(key: string, lineName: string): Promise<ApiRow[]> {
  // 한 호선당 최대 100건이면 충분 (현실에서 호선당 50대 이내)
  const url = `${BASE}/${encodeURIComponent(key)}/json/realtimePosition/0/100/${encodeURIComponent(lineName)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.warn(`[trains] ${lineName} HTTP ${res.status}`);
      return [];
    }
    const json = (await res.json()) as ApiResp;
    return json.realtimePositionList ?? [];
  } catch (e) {
    console.warn(`[trains] ${lineName} fetch failed:`, (e as Error)?.message);
    return [];
  }
}

export async function GET(_event: APIEvent) {
  const key = process.env.SEOUL_OPEN_API_KEY;

  if (!key) {
    return new Response(
      JSON.stringify({
        error:
          "SEOUL_OPEN_API_KEY 환경변수가 설정되지 않았습니다. data.seoul.go.kr에서 무료 발급 가능합니다.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const results = await Promise.all(LINES.map((ln) => fetchLine(key, ln)));
  const trains: Train[] = [];
  const lineCounts: Record<string, number> = {};

  for (const rows of results) {
    for (const row of rows) {
      const t = rowToTrain(row);
      if (!t) continue;
      trains.push(t);
      lineCounts[t.line] = (lineCounts[t.line] ?? 0) + 1;
    }
  }

  const body: TrainsResponse = {
    meta: {
      fetchedAt: new Date().toISOString(),
      source: "서울 열린데이터광장 OA-12601 realtimePosition",
      totalTrains: trains.length,
      lineCounts,
    },
    trains,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      // CDN 캐시: 10초 fresh + 30초 SWR. 다수 클라이언트가 같은 응답을 공유하게 해
      // 서울 API rate limit(보통 일 1000건)을 안전권에 둠.
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
    },
  });
}
