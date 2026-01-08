import type { CheckStatus } from "../../shared/types";

export const STATUS_LABELS: Record<CheckStatus, string> = {
  OK: "OK",
  INVALID: "Invalid / Unauthorized",
  QUOTA_EXCEEDED: "Quota exceeded",
  RATE_LIMITED: "Rate limited",
  NETWORK_ERROR: "Network error",
  UNKNOWN_ERROR: "Unknown error"
};

export const STATUS_RECOMMENDATIONS: Record<CheckStatus, string> = {
  OK: "Key works",
  INVALID: "Verify key, permissions, or API enabled",
  QUOTA_EXCEEDED: "Check billing or quota limits",
  RATE_LIMITED: "Reduce concurrency or add delay",
  NETWORK_ERROR: "Check connectivity or proxy",
  UNKNOWN_ERROR: "Retry later or inspect logs"
};

export const STATUS_TONES: Record<CheckStatus, string> = {
  OK: "text-emerald-600",
  INVALID: "text-rose-600",
  QUOTA_EXCEEDED: "text-amber-600",
  RATE_LIMITED: "text-amber-600",
  NETWORK_ERROR: "text-sky-600",
  UNKNOWN_ERROR: "text-rose-600"
};

export function isSuccess(status: CheckStatus) {
  return status === "OK";
}

export function isWarning(status: CheckStatus) {
  return status === "QUOTA_EXCEEDED" || status === "RATE_LIMITED";
}
