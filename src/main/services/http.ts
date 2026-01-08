import { sanitizeErrorMessage } from "../../shared/mask";

export interface FetchJsonResult {
  ok: boolean;
  status?: number;
  data?: unknown;
  text?: string;
  headers?: Headers;
  errorMessage?: string;
  aborted?: boolean;
  latencyMs: number;
}

function createCombinedSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }
  };
}

export async function fetchJson(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<FetchJsonResult> {
  const startedAt = Date.now();
  const combined = createCombinedSignal(signal, timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: combined.signal });
    const text = await response.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = undefined;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      text,
      headers: response.headers,
      latencyMs: Date.now() - startedAt
    };
  } catch (error) {
    const err = error as Error;
    return {
      ok: false,
      errorMessage: sanitizeErrorMessage(err.message || "Network error"),
      aborted: err.name === "AbortError",
      latencyMs: Date.now() - startedAt
    };
  } finally {
    combined.cleanup();
  }
}

export function parseRetryAfterMs(headers?: Headers): number | undefined {
  if (!headers) {
    return undefined;
  }
  const value = headers.get("retry-after");
  if (!value) {
    return undefined;
  }
  const seconds = Number(value);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const diff = parsed - Date.now();
    return diff > 0 ? diff : undefined;
  }
  return undefined;
}
