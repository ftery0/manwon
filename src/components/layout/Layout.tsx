import { JSX } from "solid-js";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout(props: { children: JSX.Element }) {
  return (
    <div class="flex min-h-screen flex-col bg-(--color-bg)">
      <Header />
      <main class="flex-1">{props.children}</main>
      <Footer />
    </div>
  );
}
