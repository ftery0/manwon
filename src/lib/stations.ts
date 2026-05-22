import { GENERATED_STATIONS, type GeneratedStation } from "~/lib/data/stations.generated";
import { LINE_ORDER, SUPPORTED_LINES } from "~/lib/data/line-order.generated";

export interface Station {
  id: string;
  name: string;
  line: string;
  lat: number;
  lng: number;
  transfers: string[];
}

export const STATIONS: Station[] = GENERATED_STATIONS as Station[];

const STATION_INDEX: Record<string, Station> = (() => {
  const m: Record<string, Station> = {};
  for (const s of STATIONS) m[s.id] = s;
  return m;
})();

const STATIONS_BY_NAME: Record<string, Station[]> = (() => {
  const m: Record<string, Station[]> = {};
  for (const s of STATIONS) {
    if (!m[s.name]) m[s.name] = [];
    m[s.name].push(s);
  }
  return m;
})();

export function getStation(id: string): Station | undefined {
  return STATION_INDEX[id];
}

export function getStationsByName(name: string): Station[] {
  return STATIONS_BY_NAME[name] ?? [];
}

/** 같은 이름의 역(환승역)에 해당하는 모든 호선의 station 객체 */
export function getTransferStations(stationId: string): Station[] {
  const s = getStation(stationId);
  if (!s) return [];
  return getStationsByName(s.name);
}

/** 호선별 역 순서 (id 배열) */
export function getLineStations(line: string): string[] {
  return LINE_ORDER[line] ?? [];
}

export { LINE_ORDER, SUPPORTED_LINES };

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

/** 역 ID 형식: "{line}_{name}" */
export function makeStationId(line: string, name: string): string {
  return `${line}_${name}`;
}
