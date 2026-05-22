import type { Station } from "~/lib/stations";

interface Props {
  station: Station;
  isSelected: boolean;
  congestionColor: string;
  onSelect: (id: string) => void;
}

export function StationDot(props: Props) {
  const r = () => (props.isSelected ? 8 : 5);
  const strokeW = () => (props.isSelected ? 2.5 : 1.5);
  const stroke = () => (props.isSelected ? "#6FA8FF" : "white");

  return (
    <g
      onClick={() => props.onSelect(props.station.id)}
      style={{ cursor: "pointer" }}
      role="button"
      aria-label={props.station.name}
    >
      {/* 클릭 영역 확장 (투명 원) */}
      <circle
        cx={props.station.x}
        cy={props.station.y}
        r={14}
        fill="transparent"
      />
      {/* 선택 링 */}
      {props.isSelected && (
        <circle
          cx={props.station.x}
          cy={props.station.y}
          r={12}
          fill="none"
          stroke="#6FA8FF"
          stroke-width="1.5"
          opacity="0.4"
        />
      )}
      {/* 역 점 */}
      <circle
        cx={props.station.x}
        cy={props.station.y}
        r={r()}
        fill={props.congestionColor}
        stroke={stroke()}
        stroke-width={strokeW()}
      />
      {/* 환승역 — 내부 흰 점 */}
      {props.station.transfers.length > 0 && (
        <circle
          cx={props.station.x}
          cy={props.station.y}
          r={2}
          fill="white"
          style={{ "pointer-events": "none" }}
        />
      )}
    </g>
  );
}
