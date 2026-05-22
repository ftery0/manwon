export interface Station {
  id: string;
  name: string;
  line: string;
  x: number;
  y: number;
  transfers: string[];
}

// 2호선 43개 역 — SVG viewBox 800x550 기준 루프 형태 좌표
// 외선순환 기준 시계방향: 시청 → 을지로입구 → ... → 충정로 → 시청
export const STATIONS: Station[] = [
  // 상단 중앙 (시청 ~ 을지로3가)
  { id: "2_시청",     name: "시청",     line: "2", x: 360, y: 120, transfers: ["1"] },
  { id: "2_을지로입구", name: "을지로입구", line: "2", x: 420, y: 120, transfers: [] },
  { id: "2_을지로3가", name: "을지로3가", line: "2", x: 480, y: 120, transfers: ["3"] },
  { id: "2_을지로4가", name: "을지로4가", line: "2", x: 540, y: 120, transfers: ["5"] },
  { id: "2_동대문역사문화공원", name: "동대문역사문화공원", line: "2", x: 600, y: 140, transfers: ["4", "5"] },

  // 우측 상단 (신당 ~ 왕십리)
  { id: "2_신당",     name: "신당",     line: "2", x: 640, y: 185, transfers: [] },
  { id: "2_상왕십리", name: "상왕십리", line: "2", x: 660, y: 230, transfers: [] },
  { id: "2_왕십리",   name: "왕십리",   line: "2", x: 670, y: 275, transfers: ["5", "경의중앙", "수인분당"] },

  // 우측 (한양대 ~ 건대입구)
  { id: "2_한양대",   name: "한양대",   line: "2", x: 660, y: 320, transfers: [] },
  { id: "2_뚝섬",     name: "뚝섬",     line: "2", x: 645, y: 360, transfers: [] },
  { id: "2_성수",     name: "성수",     line: "2", x: 620, y: 395, transfers: [] },
  { id: "2_건대입구", name: "건대입구", line: "2", x: 590, y: 425, transfers: ["7"] },

  // 우측 하단 (구의 ~ 잠실)
  { id: "2_구의",     name: "구의",     line: "2", x: 555, y: 448, transfers: [] },
  { id: "2_강변",     name: "강변",     line: "2", x: 518, y: 462, transfers: [] },
  { id: "2_잠실나루", name: "잠실나루", line: "2", x: 481, y: 468, transfers: [] },
  { id: "2_잠실",     name: "잠실",     line: "2", x: 444, y: 468, transfers: ["8", "수인분당"] },

  // 하단 (잠실새내 ~ 종합운동장)
  { id: "2_잠실새내", name: "잠실새내", line: "2", x: 407, y: 462, transfers: [] },
  { id: "2_종합운동장", name: "종합운동장", line: "2", x: 370, y: 450, transfers: [] },

  // 하단 좌측 (삼성 ~ 강남)
  { id: "2_삼성",     name: "삼성",     line: "2", x: 335, y: 435, transfers: [] },
  { id: "2_선릉",     name: "선릉",     line: "2", x: 300, y: 420, transfers: ["수인분당"] },
  { id: "2_역삼",     name: "역삼",     line: "2", x: 265, y: 405, transfers: [] },
  { id: "2_강남",     name: "강남",     line: "2", x: 230, y: 390, transfers: ["신분당"] },

  // 좌측 하단 (교대 ~ 당산)
  { id: "2_교대",     name: "교대",     line: "2", x: 200, y: 370, transfers: ["3"] },
  { id: "2_서초",     name: "서초",     line: "2", x: 175, y: 345, transfers: [] },
  { id: "2_방배",     name: "방배",     line: "2", x: 155, y: 315, transfers: [] },
  { id: "2_사당",     name: "사당",     line: "2", x: 140, y: 283, transfers: ["4"] },
  { id: "2_낙성대",   name: "낙성대",   line: "2", x: 132, y: 250, transfers: [] },
  { id: "2_서울대입구", name: "서울대입구", line: "2", x: 128, y: 217, transfers: [] },
  { id: "2_봉천",     name: "봉천",     line: "2", x: 130, y: 185, transfers: [] },
  { id: "2_신림",     name: "신림",     line: "2", x: 138, y: 155, transfers: [] },
  { id: "2_신대방",   name: "신대방",   line: "2", x: 152, y: 128, transfers: [] },
  { id: "2_구로디지털단지", name: "구로디지털단지", line: "2", x: 175, y: 108, transfers: [] },
  { id: "2_대림",     name: "대림",     line: "2", x: 205, y: 95, transfers: ["7"] },
  { id: "2_신도림",   name: "신도림",   line: "2", x: 240, y: 90, transfers: ["1"] },
  { id: "2_문래",     name: "문래",     line: "2", x: 275, y: 92, transfers: [] },
  { id: "2_영등포구청", name: "영등포구청", line: "2", x: 308, y: 96, transfers: [] },

  // 좌측 상단 (당산 ~ 시청) — 영등포구청(308,96)에서 시청(360,120) 방향으로 이어짐
  { id: "2_당산",     name: "당산",     line: "2", x: 308, y: 82, transfers: ["9"] },
  { id: "2_합정",     name: "합정",     line: "2", x: 315, y: 75, transfers: ["6"] },
  { id: "2_홍대입구", name: "홍대입구", line: "2", x: 325, y: 76, transfers: ["경의중앙", "공항"] },
  { id: "2_신촌",     name: "신촌",     line: "2", x: 335, y: 88, transfers: [] },
  { id: "2_이대",     name: "이대",     line: "2", x: 342, y: 96, transfers: [] },
  { id: "2_아현",     name: "아현",     line: "2", x: 348, y: 103, transfers: [] },
  { id: "2_충정로",   name: "충정로",   line: "2", x: 354, y: 111, transfers: ["5"] },
];

// 루프 라인 연결 순서 (polyline points용)
export const LINE2_ORDER: string[] = [
  "2_시청", "2_을지로입구", "2_을지로3가", "2_을지로4가", "2_동대문역사문화공원",
  "2_신당", "2_상왕십리", "2_왕십리", "2_한양대", "2_뚝섬", "2_성수", "2_건대입구",
  "2_구의", "2_강변", "2_잠실나루", "2_잠실", "2_잠실새내", "2_종합운동장",
  "2_삼성", "2_선릉", "2_역삼", "2_강남", "2_교대", "2_서초", "2_방배", "2_사당",
  "2_낙성대", "2_서울대입구", "2_봉천", "2_신림", "2_신대방", "2_구로디지털단지",
  "2_대림", "2_신도림", "2_문래", "2_영등포구청",
  "2_당산", "2_합정", "2_홍대입구", "2_신촌", "2_이대", "2_아현", "2_충정로",
  "2_시청", // 루프 닫기
];

export function getStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

export function getLineColor(line: string): string {
  const colors: Record<string, string> = {
    "1": "#0052A4",
    "2": "#00A84D",
    "3": "#EF7C1C",
    "4": "#00A5DE",
    "5": "#996CAC",
    "6": "#CD7C2F",
    "7": "#747F00",
    "8": "#E6186C",
    "9": "#BDB092",
  };
  return colors[line] ?? "#999999";
}
