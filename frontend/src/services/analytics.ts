import { api } from "./api";
import type { AnalyticsSummary } from "../types";

export function getAnalytics() {
  return api<AnalyticsSummary>("/analytics/summary");
}

