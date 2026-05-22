import { createSignal, Show } from "solid-js";
import { StationSearch } from "~/components/route/StationSearch";
import { Button } from "~/components/ui/Button";

interface Props {
  onSearch: (from: string, to: string, time: string) => void;
}

export function RouteForm(props: Props) {
  const [from, setFrom] = createSignal("신촌");
  const [to, setTo] = createSignal("강남");
  const [time, setTime] = createSignal("08:10");
  const [error, setError] = createSignal("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    const f = from().trim();
    const t = to().trim();

    if (!f || !t) {
      setError("출발역과 도착역을 모두 입력해주세요.");
      return;
    }
    if (f === t) {
      setError("출발역과 도착역이 같습니다.");
      return;
    }

    setError("");
    props.onSearch(f, t, time());
  }

  return (
    <form
      onSubmit={handleSubmit}
      class="rounded-2xl bg-white p-6 shadow-card"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StationSearch
          value={from()}
          onChange={setFrom}
          placeholder="출발역 입력"
          label="출발역"
        />
        <StationSearch
          value={to()}
          onChange={setTo}
          placeholder="도착역 입력"
          label="도착역"
        />
      </div>

      <div class="mt-4 flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-(--color-text)">출발 시각</label>
        <input
          type="time"
          value={time()}
          onInput={(e) => setTime((e.currentTarget as HTMLInputElement).value)}
          class="w-44 rounded-xl bg-(--color-bg-soft) px-4 py-3 text-sm font-medium text-(--color-text) outline-none transition focus:bg-white focus:outline-2 focus:outline-(--color-primary)"
        />
      </div>

      <Show when={error()}>
        <p class="mt-3 text-sm text-(--color-congestion-high)">{error()}</p>
      </Show>

      <div class="mt-5">
        <Button type="submit" class="w-full sm:w-auto">
          경로 혼잡도 확인 →
        </Button>
      </div>
    </form>
  );
}
