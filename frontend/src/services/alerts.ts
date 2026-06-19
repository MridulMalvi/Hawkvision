/**
 * Alert rules and alert event API calls.
 * Types are defined in types/index.ts — import from there.
 */
import { api } from "./api";
import type { AlertEvent, AlertRule, AlertRuleCreate } from "../types";

export function listAlertRules() {
  return api<AlertRule[]>("/alerts/rules");
}

export function createAlertRule(payload: AlertRuleCreate) {
  return api<AlertRule>("/alerts/rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAlertRule(ruleId: number, payload: AlertRuleCreate) {
  return api<AlertRule>(`/alerts/rules/${ruleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAlertRule(ruleId: number) {
  return api<void>(`/alerts/rules/${ruleId}`, { method: "DELETE" });
}

export function listAlertEvents() {
  return api<AlertEvent[]>("/alerts/events");
}
