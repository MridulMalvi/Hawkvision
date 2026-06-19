/**
 * Shared TypeScript types that mirror the FastAPI Pydantic schemas.
 * Import from here — do NOT redefine types in individual service files.
 */

// ── Auth / User ──────────────────────────────────────────────────────────────

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
};

// ── Detection ─────────────────────────────────────────────────────────────────

export type TrackedObject = {
  id: number;
  track_id: string;
  class_name: string;
  confidence: number;
  bbox: Record<string, number>;
  movement_history: Array<{ x: number; y: number; frame: number }>;
};

export type Detection = {
  id: number;
  source_type: "image" | "video" | "webcam" | string;
  source_name: string;
  model_name: string;
  confidence_threshold: number;
  status: "completed" | "failed" | string;
  total_objects: number;
  average_confidence: number;
  duration_ms: number;
  metadata_json: {
    inference_mode?: "yolo" | "demo" | "error";
    model?: string;
    image_width?: number;
    image_height?: number;
    frames_processed?: number;
    duration_ms?: number;
  };
  created_at: string;
  tracked_objects: TrackedObject[];
};

export type DetectionList = {
  items: Detection[];
  total: number;
  page: number;
  page_size: number;
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export type AnalyticsSummary = {
  total_detections: number;
  total_objects: number;
  average_confidence: number;
  most_detected_classes: { class_name: string; count: number }[];
  trends: { date: string; detections: number }[];
};

// ── Alerts ────────────────────────────────────────────────────────────────────

export type AlertRule = {
  id: number;
  name: string;
  class_name: string;
  min_confidence: number;
  email_recipients: string[];
  is_active: boolean;
  owner_id: number;
  created_at: string;
};

export type AlertRuleCreate = Omit<AlertRule, "id" | "owner_id" | "created_at">;

export type AlertEvent = {
  id: number;
  rule_id: number;
  detection_id: number;
  message: string;
  created_at: string;
};
