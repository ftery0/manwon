import type { APIEvent } from "@solidjs/start/server";

// ─── 공공데이터포털 API 설정 ────────────────────────────────────────────────
// 서울교통공사_지하철혼잡도정보 (namespace: 15071311)
// Swagger: https://infuser.odcloud.kr/oas/docs?namespace=15071311/v1
// 가장 최신 분기 endpoint (2026 Q1)
const LATEST_ENDPOINT =
  "https://api.odcloud.kr/api/15071311/v1/uddi:93f3aca2-a46a-4e30-b797-aa1870dbfa2a";

// 분기별 endpoint 목록 (과거 데이터 fallback용)
const ENDPOINTS: Record<string, string> = {
  "2026-Q1": "uddi:93f3aca2-a46a-4e30-b797-aa1870dbfa2a",
  "2025-Q3": "uddi:daf4624e-d52d-4b09-856b-e1c13749b20e",
  "2025-Q2": "uddi:dd6fa0b1-5f6e-4923-b36d-bbb72411c474",
  "2025-Q1": "uddi:7bd50077-dea4-48c5-a50f-c1f073afcf1e",
  "2024-Q4": "uddi:4496e31f-58bb-4056-a75f-b43e85cfff21",
};

// ─── 타입 정의 ──────────────────────────────────────────────────────────────

export interface StationCongestion {
  weekday: number[];   // 48개 버킷 (30분 단위, 00:00~23:30)
  weekend: number[];
}

export interface CongestionResponse {
  meta: {
    source: string;
    quarter: string;
    bucketMinutes: 30;
    totalStations: number;
  };
  data: Record<string, StationCongestion>;
}

// 공공데이터 API row 타입
interface ApiRow {
  호선: string;
  역번호?: string;
  출발역: string;      // 역명 (실제 필드명은 "출발역")
  상하구분: string;    // "상행" | "하행"
  요일구분: string;    // "평일" | "토요일" | "일요일"
  [timeSlot: string]: string | undefined; // "5시30분", "6시00분", ...
}

interface ApiResponse {
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  data: ApiRow[];
}

// ─── 시간 슬롯 → 버킷 인덱스 변환 ──────────────────────────────────────────

// 공공데이터 필드명: "5시30분", "6시00분", ..., "23시30분", "00시00분", "00시30분"
function buildTimeSlotMap(): { field: string; bucket: number }[] {
  const slots: { field: string; bucket: number }[] = [];

  // 05:30 ~ 23:30
  for (let h = 5; h < 24; h++) {
    for (const m of [0, 30]) {
      if (h === 5 && m === 0) continue; // 5시00분은 데이터 없음
      const bucket = h * 2 + m / 30;
      const field = `${h}시${m === 0 ? "00" : "30"}분`;
      slots.push({ field, bucket });
    }
  }

  // 00:00, 00:30 (자정 이후)
  slots.push({ field: "00시00분", bucket: 0 });
  slots.push({ field: "00시30분", bucket: 1 });

  return slots;
}

const TIME_SLOT_MAP = buildTimeSlotMap();

function rowTo48Buckets(row: ApiRow): number[] {
  const buckets = new Array(48).fill(0);
  for (const { field, bucket } of TIME_SLOT_MAP) {
    const raw = row[field];
    if (raw !== undefined && raw !== "") {
      buckets[bucket] = Math.round(parseFloat(raw));
    }
  }
  return buckets;
}

// ─── API 데이터 파싱 → CongestionData 변환 ──────────────────────────────────

function parseRows(rows: ApiRow[]): Record<string, StationCongestion> {
  // key: "호선_역명"
  type Accumulator = {
    weekdayBuckets: number[][];
    weekendBuckets: number[][];
  };

  const acc: Record<string, Accumulator> = {};

  for (const row of rows) {
    const lineRaw = row["호선"]?.trim();
    const name = row["출발역"]?.trim();
    if (!lineRaw || !name) continue;

    // "2호선" → "2", "1호선" → "1" (프론트엔드 ID 형식과 통일)
    const line = lineRaw.replace("호선", "");
    const key = `${line}_${name}`;
    if (!acc[key]) {
      acc[key] = { weekdayBuckets: [], weekendBuckets: [] };
    }

    const buckets = rowTo48Buckets(row);
    const dayType = row["요일구분"]?.trim();

    if (dayType === "평일") {
      acc[key].weekdayBuckets.push(buckets);
    } else if (dayType === "토요일" || dayType === "일요일") {
      acc[key].weekendBuckets.push(buckets);
    }
  }

  const result: Record<string, StationCongestion> = {};

  for (const [key, { weekdayBuckets, weekendBuckets }] of Object.entries(acc)) {
    const avg = (arrays: number[][]): number[] => {
      if (arrays.length === 0) return new Array(48).fill(0);
      return arrays[0].map((_, i) =>
        Math.round(arrays.reduce((sum, arr) => sum + arr[i], 0) / arrays.length)
      );
    };

    result[key] = {
      weekday: avg(weekdayBuckets),
      weekend: avg(weekendBuckets),
    };
  }

  return result;
}

// ─── 공공데이터 API fetch (페이지네이션) ────────────────────────────────────

async function fetchAllRows(serviceKey: string): Promise<ApiRow[]> {
  const allRows: ApiRow[] = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const url = new URL(LATEST_ENDPOINT);
    url.searchParams.set("serviceKey", serviceKey);
    url.searchParams.set("page", String(page));
    url.searchParams.set("perPage", String(perPage));
    url.searchParams.set("returnType", "JSON");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`API 응답 오류: HTTP ${res.status}`);
    }

    const json = (await res.json()) as ApiResponse;
    allRows.push(...json.data);

    if (allRows.length >= json.totalCount || json.data.length < perPage) break;
    page++;
  }

  return allRows;
}

// ─── 요청 핸들러 ────────────────────────────────────────────────────────────

export async function GET(_event: APIEvent) {
  const serviceKey = process.env.DATA_API_KEY;

  if (!serviceKey) {
    return new Response(
      JSON.stringify({ error: "DATA_API_KEY 환경변수가 설정되지 않았습니다." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const rows = await fetchAllRows(serviceKey);
    const data = parseRows(rows);

    const response: CongestionResponse = {
      meta: {
        source: "서울교통공사 공공데이터포털 (api.odcloud.kr)",
        quarter: "2026-Q1",
        bucketMinutes: 30,
        totalStations: Object.keys(data).length,
      },
      data,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        // 1시간 캐시 — 데이터가 분기별 갱신이라 CDN 캐시 적극 활용
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return new Response(
      JSON.stringify({ error: `공공데이터 API 오류: ${message}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
