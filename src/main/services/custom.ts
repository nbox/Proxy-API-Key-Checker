import type { ServiceAdapter } from "./types";
import { fetchJson, parseRetryAfterMs } from "./http";
import { sanitizeErrorMessage } from "../../shared/mask";

export const customAdapter: ServiceAdapter = {
  id: "custom",
  displayName: "Custom / Other",
  docsLink: "",
  authScheme: "custom",
  checkMethods: ["auth_only"],
  async executeCheck({ key, timeoutMs, signal, customConfig }) {
    if (!customConfig?.baseUrl) {
      return {
        status: "UNKNOWN_ERROR",
        retryable: false,
        errorMessage: "Custom service is not configured",
        latencyMs: 0
      };
    }

    const url = new URL(customConfig.path || "/", customConfig.baseUrl);
    const headers: Record<string, string> = {};

    if (customConfig.authType === "bearer") {
      headers.Authorization = `Bearer ${key}`;
    } else if (customConfig.authType === "header") {
      const headerName = customConfig.headerName || "X-API-Key";
      headers[headerName] = key;
    } else if (customConfig.authType === "query") {
      const param = customConfig.queryParam || "key";
      url.searchParams.set(param, key);
    }

    const response = await fetchJson(
      url.toString(),
      { method: customConfig.method || "GET", headers },
      timeoutMs,
      signal
    );

    if (response.errorMessage && !response.status) {
      return {
        status: "NETWORK_ERROR",
        retryable: true,
        errorMessage: response.errorMessage,
        latencyMs: response.latencyMs
      };
    }

    const successCodes =
      customConfig.successStatusCodes && customConfig.successStatusCodes.length > 0
        ? customConfig.successStatusCodes
        : [200];

    if (response.status && successCodes.includes(response.status)) {
      return {
        status: "OK",
        retryable: false,
        httpStatus: response.status,
        latencyMs: response.latencyMs
      };
    }

    const errorMessage = sanitizeErrorMessage(response.errorMessage || "Unexpected response");

    if (response.status === 401 || response.status === 403) {
      return {
        status: "INVALID",
        retryable: false,
        httpStatus: response.status,
        errorMessage,
        latencyMs: response.latencyMs
      };
    }

    if (response.status === 429) {
      return {
        status: "RATE_LIMITED",
        retryable: true,
        httpStatus: response.status,
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
        errorMessage,
        retryAfterMs: parseRetryAfterMs(response.headers),
        latencyMs: response.latencyMs
      };
    }

    return {
      status: "UNKNOWN_ERROR",
      retryable: false,
      httpStatus: response.status,
      errorMessage,
      latencyMs: response.latencyMs
    };
  }
};
