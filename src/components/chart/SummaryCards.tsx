import type { getSummary } from "~/lib/congestion";

interface Props {
  summary: ReturnType<typeof getSummary>;
}

function congestionColor(value: number): string {
  if (value < 55) return "text-[#4ADE80]";
  if (value < 80) return "text-[#FBBF24]";
  return "text-[#F87171]";
}

function congestionBg(value: number): string {
  if (value < 55) return "bg-[#F0FDF4]";
  if (value < 80) return "bg-[#FFFBEB]";
  return "bg-[#FEF2F2]";
}

function congestionLabel(value: number): string {
  if (value < 55) return "여유";
  if (value < 80) return "보통";
  return "혼잡";
}

export function SummaryCards(props: Props) {
  const cards = () => [
    {
      label: "출근 혼잡도",
      sublabel: "07:00 – 09:00",
      value: props.summary.commuteMorning,
      icon: "🌅",
    },
    {
      label: "퇴근 혼잡도",
      sublabel: "18:00 – 20:00",
      value: props.summary.commuteEvening,
      icon: "🌆",
    },
    {
      label: "가장 한산",
      sublabel: props.summary.quietest.hour,
      value: props.summary.quietest.value,
      icon: "😌",
    },
  ];

  return (
    <div class="grid grid-cols-3 gap-3">
      {cards().map((card) => (
        <div
          class={`rounded-xl p-3 ${congestionBg(card.value)} flex flex-col gap-1`}
        >
          <div class="flex items-center gap-1.5">
            <span class="text-base">{card.icon}</span>
            <span class="text-xs text-(--color-text-muted) font-medium">
              {card.label}
            </span>
          </div>
          <div class={`text-xl font-bold ${congestionColor(card.value)}`}>
            {card.value}%
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-(--color-text-muted)">
              {card.sublabel}
            </span>
            <span
              class={`text-[10px] font-semibold ${congestionColor(card.value)}`}
            >
              {congestionLabel(card.value)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
