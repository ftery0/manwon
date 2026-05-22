export function Footer() {
  return (
    <footer class="bg-(--color-bg-subtle)">
      <div class="mx-auto max-w-5xl px-5 py-8">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-(--color-text)">만원</p>
            <p class="mt-0.5 text-xs text-(--color-text-muted)">
              서울 지하철 혼잡도 시각화 서비스
            </p>
          </div>
          <div class="text-xs text-(--color-text-muted)">
            <p>데이터 출처: 공공데이터포털, 서울 열린데이터광장</p>
            <p class="mt-0.5">© 2025 manwon. 공공데이터 기반 비상업 서비스.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
