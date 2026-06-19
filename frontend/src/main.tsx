/**
 * Application entry point.
 * Dark-mode class is applied synchronously before React renders
 * to prevent a flash of the wrong theme on page load.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

// Apply persisted theme BEFORE first paint to avoid FOUC
const storedTheme = (() => {
  try {
    return localStorage.getItem("hawkvision_theme");
  } catch {
    return null;
  }
})();
if (
  storedTheme === "dark" ||
  (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.documentElement.classList.add("dark");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 s — avoids redundant refetches on tab focus
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
