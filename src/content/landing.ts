export const LANDING = {
  hero: {
    badge: "서울 1~9호선 공공데이터 기반",
    headline: "타기 전에\n미리 확인하세요",
    subheadline: "만원인지 한산한지, 역별 시간대 혼잡도를 그래프로 한눈에.",
    cta: {
      primary: { label: "노선도 보기", href: "/map" },
      secondary: { label: "경로 혼잡도 확인", href: "/route" },
    },
    hint: "클릭 한 번으로 역별 혼잡도 확인",
  },
  f1: {
    badge: "F1 — 노선도 탐색",
    headline: "역 하나 클릭하면\n24시간 그래프로",
    description:
      "수도권 노선도에서 역을 클릭하면 그 역의 시간대별 평균 혼잡도를 바로 보여줩니다. 평일/주말 필터와 기간 선택으로 원하는 조건의 평균을 낼 수 있어요.",
    usecases: [
      { icon: "🏠", text: "집 구할 때 — 후보 동네 역의 출근 혼잡도 비교" },
      { icon: "📅", text: "외출 계획 — 한산한 시간 골라서 이동" },
      { icon: "⏰", text: "통근자 — 30분 일찍/늦게 가면 얼마나 다른지" },
    ],
    cta: "노선도 열기",
    ctaHref: "/map",
  },
  f2: {
    badge: "F2 — 경로 혼잡도",
    headline: "출발-도착 입력하면\n구간별 혼잡도 타임라인",
    description:
      "출발역, 도착역, 시간을 입력하면 각 정거장 도착 예상 시각과 그 시각의 평균 혼잡도를 타임라인으로 보여줍니다. 환승 구간 소요시간도 포함됩니다.",
    preview: [
      { time: "08:10", station: "서울대입구", line: "2호선 상행", percent: 65, label: "여유" },
      { time: "08:15", station: "사당", line: "", percent: 88, label: "보통" },
      { time: "08:20", station: "교대", line: "환승 (도보 3분)", percent: null, label: "환승" },
      { time: "08:23", station: "교대", line: "3호선 상행", percent: 82, label: "보통" },
      { time: "08:25", station: "고속터미널", line: "", percent: 105, label: "혼잡" },
      { time: "08:30", station: "신사", line: "도착", percent: 60, label: "여유" },
    ],
    cta: "경로 혼잡도 확인",
    ctaHref: "/route",
  },
  datasource: {
    headline: "전부 공공데이터, 무료",
    description: "서울시 열린데이터광장과 공공데이터포털에서 제공하는 데이터를 전처리해서 씁니다.",
    sources: [
      { label: "1~8호선 혼잡도", desc: "30분 단위 · 평일/토/일 · 상하행" },
      { label: "9호선 혼잡도", desc: "서울 열린데이터광장" },
      { label: "역간 소요시간", desc: "공공데이터포털 API" },
      { label: "환승 소요시간", desc: "환승역별 도보 시간" },
    ],
    note: "실시간 데이터는 v3에서 지원 예정입니다.",
  },
} as const;
