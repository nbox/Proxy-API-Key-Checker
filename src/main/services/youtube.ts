import type { ServiceAdapter } from "./types";
import { fetchJson, parseRetryAfterMs } from "./http";
import { sanitizeErrorMessage } from "../../shared/mask";

const INVALID_REASONS = new Set(["keyInvalid", "keyExpired", "accessNotConfigured"]);
const QUOTA_REASONS = new Set(["quotaExceeded", "dailyLimitExceeded"]);
const RATE_REASONS = new Set(["rateLimitExceeded", "userRateLimitExceeded"]);

export const youtubeAdapter: ServiceAdapter = {
  id: "youtube",
  displayName: "YouTube Data API",
  docsLink: "https://developers.google.com/youtube/v3",
  authScheme: "query:key",
  checkMethods: ["auth_only", "sample"],
  async executeCheck({ key, method, timeoutMs, signal }) {
    const part = method === "sample" ? "snippet" : "id";
    const url = `https://www.googleapis.com/youtube/v3/videos?part=${part}&id=dQw4w9WgXcQ&key=${encodeURIComponent(
      key
    )}`;
    const response = await fetchJson(url, { method: "GET" }, timeoutMs, signal);

    if (response.errorMessage && !response.status) {
      return {
        status: "NETWORK_ERROR",
        retryable: true,
        errorMessage: response.errorMessage,
        latencyMs: response.latencyMs
      };
    }

    const data = response.data as Record<string, any> | undefined;
    const error = data?.error as Record<string, any> | undefined;
    const errorDetail = Array.isArray(error?.errors) ? error?.errors[0] : undefined;
    const reason = errorDetail?.reason as string | undefined;
    const message = (error?.message as string | undefined) || response.errorMessage;
    const errorMessage = sanitizeErrorMessage(message || "Unexpected response");

    if (response.ok && Array.isArray(data?.items)) {
      return {
        status: "OK",
        retryable: false,
        httpStatus: response.status,
        latencyMs: response.latencyMs
      };
    }

    if (
      reason &&
      (INVALID_REASONS.has(reason) || QUOTA_REASONS.has(reason) || RATE_REASONS.has(reason))
    ) {
      if (INVALID_REASONS.has(reason)) {
        return {
          status: "INVALID",
          retryable: false,
          httpStatus: response.status,
          errorCode: reason,
          errorMessage,
          latencyMs: response.latencyMs
        };
      }
      if (QUOTA_REASONS.has(reason)) {
        return {
          status: "QUOTA_EXCEEDED",
          retryable: false,
          httpStatus: response.status,
          errorCode: reason,
          errorMessage,
          latencyMs: response.latencyMs
        };
      }
      return {
        status: "RATE_LIMITED",
        retryable: true,
        httpStatus: response.status,
        errorCode: reason,
        errorMessage,
        retryAfterMs: parseRetryAfterMs(response.headers),
        latencyMs: response.latencyMs
      };
    }

    if (message && message.toLowerCase().includes("api key not valid")) {
      return {
        status: "INVALID",
        retryable: false,
        httpStatus: response.status,
        errorCode: reason,
        errorMessage,
        latencyMs: response.latencyMs
      };
    }

    if (response.status === 429) {
      return {
        status: "RATE_LIMITED",
        retryable: true,
        httpStatus: response.status,
        errorCode: reason,
        errorMessage,
        retryAfterMs: parseRetryAfterMs(response.headers),
        latencyMs: response.latencyMs
      };
    }

    if (response.status && response.status >= 500) {
      return {
        status: "UNKNOWN_ERROR",
        retryable: true,
        httpStatus: response.status,
        errorCode: reason,
        errorMessage,
        retryAfterMs: parseRetryAfterMs(response.headers),
        latencyMs: response.latencyMs
      };
    }

    return {
      status: "UNKNOWN_ERROR",
      retryable: false,
      httpStatus: response.status,
      errorCode: reason,
      errorMessage,
      latencyMs: response.latencyMs
    };
  }
};
