/**
 * Centralized React Query key factory.
 * Use these everywhere instead of inline string literals to prevent
 * typos and stale-cache bugs.
 */
export const queryKeys = {
  me: ["me"] as const,
  analytics: ["analytics"] as const,
  detections: (params?: string) => ["detections", params ?? ""] as const,
  alertRules: ["alert-rules"] as const,
  alertEvents: ["alert-events"] as const,
} as const;
