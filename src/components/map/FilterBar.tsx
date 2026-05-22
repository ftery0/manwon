import type { FilterType } from "~/lib/congestion";

interface Props {
  value: FilterType;
  onChange: (f: FilterType) => void;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "weekday", label: "평일" },
  { key: "weekend", label: "주말" },
  { key: "all",     label: "전체" },
];

export function FilterBar(props: Props) {
  return (
    <div class="flex items-center gap-1.5 rounded-xl border border-(--color-border) bg-(--color-bg-subtle) p-1">
      {FILTERS.map((f) => (
        <button
          type="button"
          onClick={() => props.onChange(f.key)}
          class={
            `flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ` +
            (props.value === f.key
              ? "bg-(--color-primary) text-white shadow-sm"
              : "text-(--color-text-muted) hover:text-(--color-primary)")
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
