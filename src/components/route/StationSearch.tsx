import { createSignal, For, Show } from "solid-js";
import { ALL_STATION_NAMES } from "~/lib/route-planner";
import { getStationsByName } from "~/lib/stations";

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
    if (!q) return ALL_STATION_NAMES.slice(0, 12);
    return ALL_STATION_NAMES.filter((s) => s.includes(q)).slice(0, 20);
  };

  function getLinesFor(name: string): string {
    const list = getStationsByName(name);
    const unique = Array.from(new Set(list.map((s) => s.line))).sort();
    return unique.map((l) => `${l}호선`).join("·");
  }

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
      <label class="text-sm font-semibold text-(--color-text)">{props.label}</label>
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
          class="w-full rounded-xl bg-(--color-bg-soft) px-4 py-3 text-sm font-medium text-(--color-text) outline-none transition placeholder:text-(--color-text-subtle) focus:bg-white focus:outline-2 focus:outline-(--color-primary)"
        />
        <Show when={open() && filtered().length > 0}>
          <ul
            class="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-card-lg"
            role="listbox"
          >
            <For each={filtered()}>
              {(station, idx) => (
                <li
                  role="option"
                  aria-selected={cursor() === idx()}
                  onMouseDown={() => select(station)}
                  class={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    cursor() === idx()
                      ? "bg-(--color-primary-soft)"
                      : "hover:bg-(--color-bg-soft)"
                  }`}
                >
                  <span class="font-semibold text-(--color-text)">{station}</span>
                  <span class="ml-2 text-xs text-(--color-text-muted)">
                    {getLinesFor(station)}
                  </span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
}
