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
}

// 2호선 역 순서 (내선순환 기준)
export const LINE2_STATIONS = [
  "시청", "을지로입구", "을지로3가", "을지로4가", "동대문역사문화공원",
  "신당", "상왕십리", "왕십리", "한양대", "뚝섬", "성수", "건대입구",
  "구의", "강변", "잠실나루", "잠실", "잠실새내", "종합운동장", "삼성",
  "선릉", "역삼", "강남", "교대", "서초", "방배", "사당", "낙성대",
  "서울대입구", "봉천", "신림", "신대방", "구로디지털단지", "대림",
  "신도림", "문래", "영등포구청", "당산", "합정", "홍대입구", "신촌",
  "이대", "아현", "충정로",
];

// 역별 기본 혼잡도 가중치 (1.0 기준)
const STATION_WEIGHT: Record<string, number> = {
  강남: 1.4,
  홍대입구: 1.3,
  신촌: 1.2,
  잠실: 1.25,
  사당: 1.2,
  구로디지털단지: 1.15,
  신도림: 1.2,
  왕십리: 1.1,
  건대입구: 1.1,
  선릉: 1.1,
  역삼: 1.1,
  교대: 1.1,
  시청: 1.1,
  을지로입구: 1.05,
  합정: 1.05,
};

function getStationWeight(station: string): number {
  return STATION_WEIGHT[station] ?? 1.0;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

function addMinutes(timeStr: string, mins: number): string {
  const { hours, minutes } = parseTime(timeStr);
  const total = hours * 60 + minutes + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function calcCongestion(station: string, timeStr: string): number {
  const { hours } = parseTime(timeStr);
  const weight = getStationWeight(station);

  let base: number;
  if (hours >= 7 && hours < 9) {
    // 출근 혼잡
    base = 70 + Math.random() * 30;
  } else if (hours >= 18 && hours < 20) {
    // 퇴근 혼잡
    base = 65 + Math.random() * 35;
  } else if (hours >= 9 && hours < 18) {
    // 낮 시간
    base = 30 + Math.random() * 30;
  } else {
    // 야간/새벽
    base = 20 + Math.random() * 20;
  }

  return Math.min(Math.round(base * weight), 130);
}

function toLabel(pct: number): "여유" | "보통" | "혼잡" {
  if (pct < 60) return "여유";
  if (pct < 90) return "보통";
  return "혼잡";
}

function getDirection(fromIdx: number, toIdx: number): string {
  const diff = toIdx - fromIdx;
  if (diff > 0) {
    if (diff <= LINE2_STATIONS.length / 2) return "2호선 내선";
    return "2호선 외선";
  } else {
    if (-diff <= LINE2_STATIONS.length / 2) return "2호선 외선";
    return "2호선 내선";
  }
}

function shortestPath(
  fromIdx: number,
  toIdx: number
): { indices: number[]; direction: string } {
  const n = LINE2_STATIONS.length;
  const clockwise: number[] = [];
  let i = fromIdx;
  while (i !== toIdx) {
    clockwise.push(i);
    i = (i + 1) % n;
  }
  clockwise.push(toIdx);

  const counterClockwise: number[] = [];
  let j = fromIdx;
  while (j !== toIdx) {
    counterClockwise.push(j);
    j = (j - 1 + n) % n;
  }
  counterClockwise.push(toIdx);

  if (clockwise.length <= counterClockwise.length) {
    return { indices: clockwise, direction: getDirection(fromIdx, toIdx) };
  }
  return {
    indices: counterClockwise,
    direction: getDirection(fromIdx, toIdx),
  };
}

export function planRoute(
  from: string,
  to: string,
  departureTime: string
): RouteResult | null {
  const fromIdx = LINE2_STATIONS.indexOf(from);
  const toIdx = LINE2_STATIONS.indexOf(to);

  if (fromIdx === -1 || toIdx === -1) return null;
  if (fromIdx === toIdx) return null;

  const { indices, direction } = shortestPath(fromIdx, toIdx);

  const stops: RouteStop[] = [];
  let currentTime = departureTime;

  for (let s = 0; s < indices.length; s++) {
    const stationName = LINE2_STATIONS[indices[s]!]!;
    const isStart = s === 0;
    const isEnd = s === indices.length - 1;
    const congestionPct = calcCongestion(stationName, currentTime);
    const label = toLabel(congestionPct);

    stops.push({
      time: currentTime,
      station: stationName,
      line: isEnd ? "도착" : direction,
      congestionPct,
      label,
      isTransfer: false,
      isStart,
      isEnd,
    });

    if (!isEnd) {
      currentTime = addMinutes(currentTime, 2);
    }
  }

  const congestedStops = stops.filter(
    (s): s is RouteStop & { congestionPct: number } => s.congestionPct !== null
  );
  const avgCongestion =
    congestedStops.length > 0
      ? Math.round(
          congestedStops.reduce((sum, s) => sum + s.congestionPct, 0) /
            congestedStops.length
        )
      : 0;

  const busiestStop = congestedStops.reduce(
    (max, s) => (s.congestionPct > (max.congestionPct ?? 0) ? s : max),
    congestedStops[0]!
  );

  const totalMinutes = (indices.length - 1) * 2;

  return {
    stops,
    totalMinutes,
    avgCongestion,
    busiestStop,
  };
}
