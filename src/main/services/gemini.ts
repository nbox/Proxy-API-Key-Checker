import type { ServiceAdapter } from "./types";
import { fetchJson, parseRetryAfterMs } from "./http";
import { sanitizeErrorMessage } from "../../shared/mask";

export const geminiAdapter: ServiceAdapter = {
  id: "gemini",
  displayName: "Gemini (Google AI)",
  docsLink: "https://ai.google.dev/api/rest",
  authScheme: "query:key",
  checkMethods: ["auth_only", "sample"],
  async executeCheck({ key, method, timeoutMs, signal }) {
    const isSample = method === "sample";
    const url = isSample
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
          key
        )}`
      : `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
          key
        )}`;
    const options: RequestInit = isSample
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }]
          })
        }
      : { method: "GET" };
    const response = await fetchJson(url, options, timeoutMs, signal);

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
    const errorStatus = error?.status as string | undefined;
    const message = (error?.message as string | undefined) || response.errorMessage;
    const errorMessage = sanitizeErrorMessage(message || "Unexpected response");

    if (
      response.ok &&
      (isSample ? Array.isArray(data?.candidates) : Array.isArray(data?.models))
    ) {
      return {
        status: "OK",
        retryable: false,
        httpStatus: response.status,
        latencyMs: response.latencyMs
      };
    }

    if (
      errorStatus === "INVALID_ARGUMENT" ||
      (message && message.toLowerCase().includes("api key not valid")) ||
      errorStatus === "PERMISSION_DENIED"
    ) {
      return {
        status: "INVALID",
        retryable: false,
        httpStatus: response.status,
        errorCode: errorStatus,
        errorMessage,
        latencyMs: response.latencyMs
      };
    }

    if (response.status === 429 || errorStatus === "RESOURCE_EXHAUSTED") {
      const isQuota = message ? message.toLowerCase().includes("quota") : false;
      return {
        status: isQuota ? "QUOTA_EXCEEDED" : "RATE_LIMITED",
        retryable: !isQuota,
        httpStatus: response.status,
        errorCode: errorStatus,
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
        errorCode: errorStatus,
        errorMessage,
        retryAfterMs: parseRetryAfterMs(response.headers),
        latencyMs: response.latencyMs
      };
    }

    return {
      status: "UNKNOWN_ERROR",
      retryable: false,
      httpStatus: response.status,
      errorCode: errorStatus,
      errorMessage,
      latencyMs: response.latencyMs
    };
  }
};
