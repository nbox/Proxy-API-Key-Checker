import type { ServiceAdapter } from "./types";
import { fetchJson, parseRetryAfterMs } from "./http";
import { sanitizeErrorMessage } from "../../shared/mask";

export const openAiAdapter: ServiceAdapter = {
  id: "openai",
  displayName: "ChatGPT / OpenAI",
  docsLink: "https://platform.openai.com/docs/api-reference/models",
  authScheme: "bearer",
  checkMethods: ["auth_only", "quota", "sample"],
  async executeCheck({ key, method, timeoutMs, signal, openAiOrgId }) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${key}`
    };
    if (openAiOrgId) {
      headers["OpenAI-Organization"] = openAiOrgId;
    }

    let url = "https://api.openai.com/v1/models";
    let options: RequestInit = { method: "GET", headers };

    if (method === "sample") {
      url = "https://api.openai.com/v1/embeddings";
      options = {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: "ping"
        })
      };
    } else if (method === "quota") {
      url = "https://api.openai.com/v1/dashboard/billing/credit_grants";
      options = { method: "GET", headers };
    }

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
    const errorCode = error?.code ?? error?.type;
    const errorMessage = sanitizeErrorMessage(
      error?.message || response.errorMessage || "Unexpected response"
    );

    if (response.ok) {
      if (method === "quota") {
        const totalAvailable =
          typeof data?.total_available === "number" ? data.total_available : undefined;
        if (typeof totalAvailable === "number") {
          const isExhausted = totalAvailable <= 0;
          return {
            status: isExhausted ? "QUOTA_EXCEEDED" : "OK",
            retryable: false,
            httpStatus: response.status,
            errorMessage: isExhausted ? "No available quota" : undefined,
            latencyMs: response.latencyMs
          };
        }
      } else if (Array.isArray(data?.data)) {
        return {
          status: "OK",
          retryable: false,
          httpStatus: response.status,
          latencyMs: response.latencyMs
        };
      }
    }

    if (response.status === 401 || errorCode === "invalid_api_key") {
      return {
        status: "INVALID",
        retryable: false,
        httpStatus: response.status,
        errorCode,
        errorMessage,
        latencyMs: response.latencyMs
      };
    }

    if (
      response.status === 429 &&
      (errorCode === "rate_limit_exceeded" || error?.type === "rate_limit_error")
    ) {
      return {
        status: "RATE_LIMITED",
        retryable: true,
        httpStatus: response.status,
        errorCode,
        errorMessage,
        retryAfterMs: parseRetryAfterMs(response.headers),
        latencyMs: response.latencyMs
      };
    }

    if (
      response.status === 429 &&
      (errorCode === "insufficient_quota" || error?.type === "insufficient_quota")
    ) {
      return {
        status: "QUOTA_EXCEEDED",
        retryable: false,
        httpStatus: response.status,
        errorCode,
        errorMessage,
        latencyMs: response.latencyMs
      };
    }

    if (response.status && response.status >= 500) {
      return {
        status: "UNKNOWN_ERROR",
        retryable: true,
        httpStatus: response.status,
        errorCode,
        errorMessage,
        retryAfterMs: parseRetryAfterMs(response.headers),
        latencyMs: response.latencyMs
      };
    }

    return {
      status: "UNKNOWN_ERROR",
      retryable: false,
      httpStatus: response.status,
      errorCode,
      errorMessage,
      latencyMs: response.latencyMs
    };
  }
};
