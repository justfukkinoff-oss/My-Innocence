import { InternetIdentityProvider } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import "./index.css";
import { router } from "./router";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

const queryClient = new QueryClient();
if (import.meta.env.DEV) {
  // Dev-only: lets browser-driven tests trigger refetches.
  (window as unknown as { __queryClient: QueryClient }).__queryClient =
    queryClient;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <InternetIdentityProvider>
      <RouterProvider router={router} />
    </InternetIdentityProvider>
  </QueryClientProvider>,
);
