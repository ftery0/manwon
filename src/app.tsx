import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Layout } from "~/components/layout/Layout";
import "~/styles/globals.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <Layout>
          <Suspense>{props.children}</Suspense>
        </Layout>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
