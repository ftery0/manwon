export type FilterType = "weekday" | "weekend" | "all";

export interface StationCongestion {
  weekday: number[]; // 48개 값 (30분 단위)
  weekend: number[];
}

export interface CongestionData {
  [stationId: string]: StationCongestion;
}

// 48버킷 인덱스 → "HH:MM" 문자열
export function bucketToTime(index: number): string {
  const totalMinutes = index * 30;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Fallback mock 데이터 (public/data/congestion.json 없을 때 사용)
// ---------------------------------------------------------------------------

function makeCurve(
  peakHours: number[],
  peakValues: number[],
  base: number
): number[] {
  const buckets: number[] = new Array(48).fill(base);
  peakHours.forEach((h, i) => {
    const center = h * 2; // 30분 단위
    const peak = peakValues[i];
    for (let b = 0; b < 48; b++) {
      const dist = Math.abs(b - center);
      const contribution = peak * Math.exp((-dist * dist) / 8);
      buckets[b] = Math.max(buckets[b], Math.round(contribution));
    }
  });
  return buckets;
}

const MOCK_DATA: CongestionData = (() => {
  const stations = [
    "2_시청", "2_을지로입구", "2_을지로3가", "2_을지로4가", "2_동대문역사문화공원",
    "2_신당", "2_상왕십리", "2_왕십리", "2_한양대", "2_뚝섬", "2_성수", "2_건대입구",
    "2_구의", "2_강변", "2_잠실나루", "2_잠실", "2_잠실새내", "2_종합운동장",
    "2_삼성", "2_선릉", "2_역삼", "2_강남", "2_교대", "2_서초", "2_방배", "2_사당",
    "2_낙성대", "2_서울대입구", "2_봉천", "2_신림", "2_신대방", "2_구로디지털단지",
    "2_대림", "2_신도림", "2_문래", "2_영등포구청",
    "2_당산", "2_합정", "2_홍대입구", "2_신촌", "2_이대", "2_아현", "2_충정로",
  ];

  // 역별 특성 정의 (출근 피크, 퇴근 피크, 기본 혼잡도)
  const profiles: Record<string, [number, number, number]> = {
    "2_강남":     [8, 18, 40],
    "2_역삼":     [8, 18, 38],
    "2_선릉":     [8, 18, 35],
    "2_삼성":     [8, 19, 36],
    "2_홍대입구": [12, 20, 42],
    "2_신촌":     [10, 18, 30],
    "2_잠실":     [9, 19, 38],
    "2_왕십리":   [8, 18, 32],
    "2_신도림":   [8, 18, 55],
    "2_건대입구": [10, 19, 35],
    "2_사당":     [8, 18, 38],
  };

  const result: CongestionData = {};
  for (const id of stations) {
    const [morningPeak, eveningPeak, base] = profiles[id] ?? [8, 18, 25];
    const morningVal = base + 45 + Math.floor(Math.random() * 15);
    const eveningVal = base + 30 + Math.floor(Math.random() * 15);

    result[id] = {
      weekday: makeCurve(
        [morningPeak, 13, eveningPeak],
        [morningVal, base + 10, eveningVal],
        base
      ),
      weekend: makeCurve(
        [12, 15, 20],
        [base + 20, base + 30, base + 15],
        base - 5
      ),
    };
  }
  return result;
})();

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

export async function fetchCongestionData(): Promise<CongestionData> {
  try {
    // SolidStart API 라우트 → 서버에서 공공데이터 처리 후 반환
    const res = await fetch("/api/congestion");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data: CongestionData };
    return json.data;
  } catch {
    // 서버 실패 시 로컬 fallback
    return MOCK_DATA;
  }
}

export function getCongestion(
  data: CongestionData,
  stationId: string,
  filter: FilterType
): number[] {
  const entry = data[stationId];
  if (!entry) return new Array(48).fill(0);

  if (filter === "weekday") return entry.weekday;
  if (filter === "weekend") return entry.weekend;

  // "all" — 평일/주말 평균
  return entry.weekday.map((v, i) => Math.round((v + entry.weekend[i]) / 2));
}

export function getSummary(values: number[]): {
  commuteMorning: number;
  commuteEvening: number;
  quietest: { hour: string; value: number };
  busiest: { hour: string; value: number };
} {
  // 07:00~09:00 = 버킷 14~17 (각 30분)
  const morningBuckets = values.slice(14, 18);
  const commuteMorning =
    morningBuckets.length > 0
      ? Math.round(morningBuckets.reduce((a, b) => a + b, 0) / morningBuckets.length)
      : 0;

  // 18:00~20:00 = 버킷 36~39
  const eveningBuckets = values.slice(36, 40);
  const commuteEvening =
    eveningBuckets.length > 0
      ? Math.round(eveningBuckets.reduce((a, b) => a + b, 0) / eveningBuckets.length)
      : 0;

  let quietestIdx = 0;
  let busiestIdx = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] < values[quietestIdx]) quietestIdx = i;
    if (values[i] > values[busiestIdx]) busiestIdx = i;
  }

  return {
    commuteMorning,
    commuteEvening,
    quietest: { hour: bucketToTime(quietestIdx), value: values[quietestIdx] },
    busiest:  { hour: bucketToTime(busiestIdx),  value: values[busiestIdx] },
  };
}
