import type { Train, TrainsResponse } from "~/routes/api/trains";
import {
  getLineStations,
  getStation,
  STATIONS,
  type Station,
} from "~/lib/stations";

export type { Train, TrainsResponse } from "~/routes/api/trains";

/** 호선 + 역명으로 우리 데이터의 station id를 찾는다. */
export function resolveStation(line: string, name: string): Station | undefined {
  return STATIONS.find((s) => s.line === line && s.name === name);
}

/**
 * 현재 역과 종착역, 호선 순서를 보고 "다음 역"을 결정한다.
 * 보간 애니메이션에 사용.
 */
export function getNextStationId(
  line: string,
  currentStationId: string,
  terminalName: string
): string | null {
  const order = getLineStations(line);
  const curIdx = order.indexOf(currentStationId);
  if (curIdx === -1) return null;

  const terminalStation = resolveStation(line, terminalName);
  if (!terminalStation) {
    // 종착역을 못 찾으면 현재 역에 머무름
    return null;
  }
  const termIdx = order.indexOf(terminalStation.id);
  if (termIdx === -1 || termIdx === curIdx) return null;

  const step = termIdx > curIdx ? 1 : -1;
  const next = order[curIdx + step];
  return next ?? null;
}

/**
 * trainSttus → 보간 비율 (0=현재 역에 막 진입 ~ 1=다음 역에 거의 도착)
 *  - approaching: 0.15  (현재 역으로 들어오는 중)
 *  - arrived:     0.0   (현재 역에 정차)
 *  - departed:    0.5   (현재 역 출발, 다음 역 향해 가는 중)
 */
export function statusToProgress(status: Train["status"]): number {
  switch (status) {
    case "approaching":
      return 0.15;
    case "arrived":
      return 0;
    case "departed":
      return 0.5;
  }
}

export async function fetchTrains(): Promise<TrainsResponse> {
  const res = await fetch("/api/trains", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as TrainsResponse;
}

/**
 * 안정적인 train id (호선+번호) — 클라이언트에서 같은 열차를 추적하기 위해.
 * 1호선 0667 → "1-0667"
 */
export function trainKey(t: Train): string {
  return `${t.line}-${t.trainNo}`;
}

/**
 * 칸별 혼잡도 근사: 전체 평균 혼잡도 V를 받아 10칸 분포를 만든다.
 * 일반적으로 중간 칸이 더 붐비고 양 끝 칸이 덜 붐비는 분포를 가정.
 * (실시간 칸별은 SK puzzle 유료 API 외에 공개 API 없음 — 추정값)
 */
export function approximateCarCongestion(overallPercent: number): number[] {
  // 정규화된 분포 가중치 (10칸, 합 = 10)
  // 양 끝이 0.7, 중간이 1.15~1.25 정도. 실제 또타지하철 통계에서 관측되는 패턴.
  const weights = [0.70, 0.85, 1.05, 1.20, 1.25, 1.20, 1.10, 1.00, 0.85, 0.80];
  // weights 합이 정확히 10이 되도록 보정
  const sum = weights.reduce((a, b) => a + b, 0);
  const norm = weights.map((w) => (w / sum) * 10);
  return norm.map((w) => Math.round(overallPercent * w));
}

/**
 * 현재 시각의 30분 버킷 인덱스 (0~47)
 */
export function currentBucket(): number {
  const now = new Date();
  return now.getHours() * 2 + (now.getMinutes() >= 30 ? 1 : 0);
}

/**
 * 한산~혼잡 라벨 (또타지하철 기준에 가깝게)
 */
export function congestionLabel(value: number): {
  label: string;
  color: string;
} {
  if (value < 80) return { label: "여유", color: "#22C55E" };
  if (value < 130) return { label: "보통", color: "#FBBF24" };
  if (value < 150) return { label: "주의", color: "#FB923C" };
  return { label: "혼잡", color: "#EF4444" };
}
