import { A } from "@solidjs/router";
import { Button } from "~/components/ui/Button";
import { ROUTES } from "~/config/routes";

export default function NotFound() {
  return (
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <p class="text-5xl font-bold text-(--color-primary)">404</p>
      <h1 class="text-xl font-semibold text-(--color-text)">페이지를 찾을 수 없어요</h1>
      <p class="text-sm text-(--color-text-muted)">
        주소를 다시 확인하거나 홈으로 돌아가세요.
      </p>
      <Button as="a" href={ROUTES.HOME}>
        홈으로
      </Button>
    </div>
  );
}
