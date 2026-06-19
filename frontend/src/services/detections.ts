/**
 * Detection API calls — upload media and query history.
 */
import { api } from "./api";
import type { Detection, DetectionList } from "../types";

export function listDetections(params = "") {
  return api<DetectionList>(`/detections${params}`);
}

export function uploadDetection(
  file: File,
  confidence: number,
  modelName: string,
  source: "image" | "video" | "webcam"
) {
  const body = new FormData();
  body.append("file", file);
  body.append("confidence_threshold", String(confidence));
  body.append("model_name", modelName);
  return api<Detection>(`/detections/${source}`, { method: "POST", body });
}

export function deleteDetection(detectionId: number) {
  return api<void>(`/detections/${detectionId}`, { method: "DELETE" });
}
