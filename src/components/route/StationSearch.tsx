import { createSignal, For, Show, onCleanup } from "solid-js";
import { LINE2_STATIONS } from "~/lib/route-planner";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

export function StationSearch(props: Props) {
  const [open, setOpen] = createSignal(false);
  const [cursor, setCursor] = createSignal(-1);

  const filtered = () => {
    const q = props.value.trim();
    if (!q) return LINE2_STATIONS.slice(0, 10);
    return LINE2_STATIONS.filter((s) => s.includes(q));
  };

  function select(station: string) {
    props.onChange(station);
    setOpen(false);
    setCursor(-1);
  }

  function handleInput(e: InputEvent) {
    const val = (e.currentTarget as HTMLInputElement).value;
    props.onChange(val);
    setOpen(true);
    setCursor(-1);
  }

  function handleFocus() {
    setOpen(true);
  }

  function handleBlur() {
    // 약간의 딜레이로 클릭 이벤트가 먼저 처리되도록
    setTimeout(() => setOpen(false), 150);
  }

  function handleKeyDown(e: KeyboardEvent) {
    const list = filtered();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = cursor();
      if (idx >= 0 && list[idx]) {
        select(list[idx]!);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-(--color-text)">{props.label}</label>
      <div class="relative">
        <input
          type="text"
          value={props.value}
          placeholder={props.placeholder}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autocomplete="off"
          class="w-full rounded-xl border border-(--color-border) bg-white px-4 py-2.5 text-sm text-(--color-text) outline-none transition-all placeholder:text-(--color-text-muted) focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/20"
        />
        <Show when={open() && filtered().length > 0}>
          <ul
            class="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-(--color-border) bg-white py-1 shadow-lg"
            role="listbox"
          >
            <For each={filtered()}>
              {(station, idx) => (
                <li
                  role="option"
                  aria-selected={cursor() === idx()}
                  onMouseDown={() => select(station)}
                  class={`cursor-pointer px-4 py-2 text-sm transition-colors ${
                    cursor() === idx()
                      ? "bg-(--color-primary-soft) text-(--color-primary)"
                      : "text-(--color-text) hover:bg-(--color-bg-subtle)"
                  }`}
                >
                  {station}
                  <span class="ml-2 text-xs text-(--color-text-muted)">2호선</span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
}
