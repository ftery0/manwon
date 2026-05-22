import type { APIEvent } from "@solidjs/start/server";

export interface StationInfo {
  id: string;
  name: string;
  line: string;
  x: number;
  y: number;
  transfers: string[];
  lat?: number;
  lng?: number;
}

// 서울시 역 좌표 데이터 (서울 열린데이터광장 OA-15442 기반)
// 실제 API: https://data.seoul.go.kr/dataList/OA-15442/S/1/datasetView.do
// API 키 필요: process.env.SEOUL_API_KEY
async function fetchFromSeoulAPI(): Promise<StationInfo[] | null> {
  const apiKey = process.env.SEOUL_OPEN_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `http://openapi.seoul.go.kr:8088/${apiKey}/json/SearchSTNBySubwayLineInfo/1/300/`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const json = await res.json() as {
      SearchSTNBySubwayLineInfo?: {
        row?: Array<{
          STATION_NM: string;
          LINE_NUM: string;
          XPOINT_WGS: string;
          YPOINT_WGS: string;
        }>;
      };
    };

    const rows = json.SearchSTNBySubwayLineInfo?.row ?? [];
    return rows.map((r, i) => ({
      id: `${r.LINE_NUM.replace("호선", "")}_${r.STATION_NM}`,
      name: r.STATION_NM,
      line: r.LINE_NUM.replace("호선", ""),
      x: 0, // SVG 좌표는 별도 계산 필요
      y: 0,
      transfers: [],
      lat: parseFloat(r.YPOINT_WGS),
      lng: parseFloat(r.XPOINT_WGS),
    }));
  } catch {
    return null;
  }
}

// 내장 역 데이터 (API 연결 전 fallback)
const BUILTIN_STATIONS: StationInfo[] = [
  { id: "2_시청",     name: "시청",     line: "2", x: 360, y: 120, transfers: ["1"],   lat: 37.5653, lng: 126.9774 },
  { id: "2_을지로입구", name: "을지로입구", line: "2", x: 420, y: 120, transfers: [],   lat: 37.5659, lng: 126.9826 },
  { id: "2_을지로3가", name: "을지로3가", line: "2", x: 480, y: 120, transfers: ["3"], lat: 37.5661, lng: 126.9924 },
  { id: "2_을지로4가", name: "을지로4가", line: "2", x: 540, y: 120, transfers: ["5"], lat: 37.5665, lng: 126.9986 },
  { id: "2_동대문역사문화공원", name: "동대문역사문화공원", line: "2", x: 600, y: 140, transfers: ["4", "5"], lat: 37.5652, lng: 127.0089 },
  { id: "2_신당",     name: "신당",     line: "2", x: 640, y: 185, transfers: [],     lat: 37.5658, lng: 127.0194 },
  { id: "2_상왕십리", name: "상왕십리", line: "2", x: 660, y: 230, transfers: [],     lat: 37.5630, lng: 127.0273 },
  { id: "2_왕십리",   name: "왕십리",   line: "2", x: 670, y: 275, transfers: ["5","수인분당"], lat: 37.5612, lng: 127.0373 },
  { id: "2_한양대",   name: "한양대",   line: "2", x: 660, y: 320, transfers: [],     lat: 37.5554, lng: 127.0443 },
  { id: "2_뚝섬",     name: "뚝섬",     line: "2", x: 645, y: 360, transfers: [],     lat: 37.5476, lng: 127.0475 },
  { id: "2_성수",     name: "성수",     line: "2", x: 620, y: 395, transfers: [],     lat: 37.5445, lng: 127.0559 },
  { id: "2_건대입구", name: "건대입구", line: "2", x: 590, y: 425, transfers: ["7"],  lat: 37.5404, lng: 127.0696 },
  { id: "2_구의",     name: "구의",     line: "2", x: 555, y: 448, transfers: [],     lat: 37.5372, lng: 127.0813 },
  { id: "2_강변",     name: "강변",     line: "2", x: 518, y: 462, transfers: [],     lat: 37.5357, lng: 127.0946 },
  { id: "2_잠실나루", name: "잠실나루", line: "2", x: 481, y: 468, transfers: [],     lat: 37.5136, lng: 127.0998 },
  { id: "2_잠실",     name: "잠실",     line: "2", x: 444, y: 468, transfers: ["8","수인분당"], lat: 37.5133, lng: 127.1001 },
  { id: "2_잠실새내", name: "잠실새내", line: "2", x: 407, y: 462, transfers: [],     lat: 37.5116, lng: 127.0931 },
  { id: "2_종합운동장", name: "종합운동장", line: "2", x: 370, y: 450, transfers: [], lat: 37.5099, lng: 127.0729 },
  { id: "2_삼성",     name: "삼성",     line: "2", x: 335, y: 435, transfers: [],     lat: 37.5088, lng: 127.0632 },
  { id: "2_선릉",     name: "선릉",     line: "2", x: 300, y: 420, transfers: ["수인분당"], lat: 37.5044, lng: 127.0492 },
  { id: "2_역삼",     name: "역삼",     line: "2", x: 265, y: 405, transfers: [],     lat: 37.5007, lng: 127.0361 },
  { id: "2_강남",     name: "강남",     line: "2", x: 230, y: 390, transfers: ["신분당"], lat: 37.4979, lng: 127.0276 },
  { id: "2_교대",     name: "교대",     line: "2", x: 200, y: 370, transfers: ["3"],  lat: 37.4937, lng: 127.0138 },
  { id: "2_서초",     name: "서초",     line: "2", x: 175, y: 345, transfers: [],     lat: 37.4836, lng: 127.0114 },
  { id: "2_방배",     name: "방배",     line: "2", x: 155, y: 315, transfers: [],     lat: 37.4808, lng: 126.9977 },
  { id: "2_사당",     name: "사당",     line: "2", x: 140, y: 283, transfers: ["4"],  lat: 37.4763, lng: 126.9815 },
  { id: "2_낙성대",   name: "낙성대",   line: "2", x: 132, y: 250, transfers: [],     lat: 37.4750, lng: 126.9641 },
  { id: "2_서울대입구", name: "서울대입구", line: "2", x: 128, y: 217, transfers: [], lat: 37.4811, lng: 126.9528 },
  { id: "2_봉천",     name: "봉천",     line: "2", x: 130, y: 185, transfers: [],     lat: 37.4813, lng: 126.9401 },
  { id: "2_신림",     name: "신림",     line: "2", x: 138, y: 155, transfers: [],     lat: 37.4843, lng: 126.9295 },
  { id: "2_신대방",   name: "신대방",   line: "2", x: 152, y: 128, transfers: [],     lat: 37.4875, lng: 126.9167 },
  { id: "2_구로디지털단지", name: "구로디지털단지", line: "2", x: 175, y: 108, transfers: [], lat: 37.4854, lng: 126.9013 },
  { id: "2_대림",     name: "대림",     line: "2", x: 205, y: 95,  transfers: ["7"],  lat: 37.4921, lng: 126.8956 },
  { id: "2_신도림",   name: "신도림",   line: "2", x: 240, y: 90,  transfers: ["1"],  lat: 37.5088, lng: 126.8913 },
  { id: "2_문래",     name: "문래",     line: "2", x: 275, y: 92,  transfers: [],     lat: 37.5176, lng: 126.8964 },
  { id: "2_영등포구청", name: "영등포구청", line: "2", x: 308, y: 96, transfers: [],  lat: 37.5262, lng: 126.9012 },
  { id: "2_당산",     name: "당산",     line: "2", x: 308, y: 82,  transfers: ["9"],  lat: 37.5341, lng: 126.9010 },
  { id: "2_합정",     name: "합정",     line: "2", x: 315, y: 75,  transfers: ["6"],  lat: 37.5498, lng: 126.9147 },
  { id: "2_홍대입구", name: "홍대입구", line: "2", x: 325, y: 76,  transfers: ["경의중앙","공항"], lat: 37.5573, lng: 126.9236 },
  { id: "2_신촌",     name: "신촌",     line: "2", x: 335, y: 88,  transfers: [],     lat: 37.5551, lng: 126.9366 },
  { id: "2_이대",     name: "이대",     line: "2", x: 342, y: 96,  transfers: [],     lat: 37.5565, lng: 126.9462 },
  { id: "2_아현",     name: "아현",     line: "2", x: 348, y: 103, transfers: [],     lat: 37.5553, lng: 126.9563 },
  { id: "2_충정로",   name: "충정로",   line: "2", x: 354, y: 111, transfers: ["5"],  lat: 37.5601, lng: 126.9652 },
];

export async function GET(_event: APIEvent) {
  // 서울시 API 연결 시도 (API 키 있을 때만)
  const apiData = await fetchFromSeoulAPI();

  const stations = apiData ?? BUILTIN_STATIONS;
  const source = apiData ? "서울 열린데이터광장 API" : "내장 데이터";

  return new Response(
    JSON.stringify({ source, stations }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400", // 24시간 캐시
      },
    }
  );
}
