import http from "http";
import https from "https";
import net from "net";
import tls from "tls";
import createHttpProxyAgent from "http-proxy-agent";
import { sanitizeErrorMessage } from "../../shared/mask";
import { decodeProxyKey } from "../../shared/proxy";
import type { ProxySettings, ProxyType } from "../../shared/types";
import type { ServiceAdapter } from "./types";

const DEFAULT_TARGET_URL = "https://example.com/";
const DEFAULT_HTML_TEXT = "Example Domain";
const MAX_HTML_BYTES = 65536;
const SCHEME_PREFIX = /^(https?|socks4|socks5):\/\//i;

type ProxyRequestResult = {
  statusCode?: number;
  latencyMs: number;
  error?: Error;
  bodyBytes?: number;
  textFound?: boolean;
};

type ParsedProxy = {
  host: string;
  port: number;
  username?: string;
  password?: string;
};

type ProxyErrorInfo = {
  status: "INVALID" | "NETWORK_ERROR" | "UNKNOWN_ERROR";
  errorCode: string;
  errorMessage: string;
  retryable: boolean;
};

function createProxyError(code: string, message: string) {
  const error = new Error(message) as Error & { code?: string };
  error.code = code;
  return error;
}

function parseProxyAddress(raw: string): ParsedProxy | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const withoutScheme = trimmed.replace(SCHEME_PREFIX, "");
  if (!withoutScheme) {
    return null;
  }

  const atIndex = withoutScheme.lastIndexOf("@");
  const authPart = atIndex >= 0 ? withoutScheme.slice(0, atIndex) : "";
  const hostPart = atIndex >= 0 ? withoutScheme.slice(atIndex + 1) : withoutScheme;

  let host = "";
  let portText = "";
  if (hostPart.startsWith("[")) {
    const end = hostPart.indexOf("]");
    if (end === -1) {
      return null;
    }
    host = hostPart.slice(1, end);
    portText = hostPart.slice(end + 1);
    if (portText.startsWith(":")) {
      portText = portText.slice(1);
    } else if (portText.length > 0) {
      return null;
    }
  } else {
    const colonIndex = hostPart.lastIndexOf(":");
    if (colonIndex === -1) {
      return null;
    }
    host = hostPart.slice(0, colonIndex);
    portText = hostPart.slice(colonIndex + 1);
  }

  if (!host || !portText) {
    return null;
  }

  const port = Number(portText);
  if (!Number.isInteger(port) || port <= 0) {
    return null;
  }

  let username: string | undefined;
  let password: string | undefined;
  if (authPart) {
    const colonIndex = authPart.indexOf(":");
    if (colonIndex === -1) {
      username = authPart;
    } else {
      username = authPart.slice(0, colonIndex);
      password = authPart.slice(colonIndex + 1);
    }
  }

  return { host, port, username, password };
}

function buildProxyUrl(proxy: ParsedProxy, scheme: ProxyType) {
  const proxyScheme = scheme === "https" ? "http" : scheme;
  const auth =
    proxy.username !== undefined
      ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password ?? "")}@`
      : "";
  return `${proxyScheme}://${auth}${proxy.host}:${proxy.port}`;
}

function createHttpAgent(proxyUrl: string) {
  const agent = createHttpProxyAgent(proxyUrl);
  return agent as unknown as http.Agent;
}

function requestWithAgent(options: {
  targetUrl: URL;
  agent: http.Agent;
  timeoutMs: number;
  speedLimitMs?: number;
  method?: "GET" | "HEAD";
  signal?: AbortSignal;
  expectedText?: string;
  maxBodyBytes?: number;
}): Promise<ProxyRequestResult> {
  const { targetUrl, agent, timeoutMs, signal } = options;
  const expectedText = options.expectedText?.trim();
  const searchText = expectedText ? expectedText.toLowerCase() : null;
  const maxBodyBytes = options.maxBodyBytes ?? 65536;
  const method = options.method ?? "GET";
  const speedLimitMs = options.speedLimitMs ?? 0;
  const transport = targetUrl.protocol === "https:" ? https : http;
  const startedAt = Date.now();
  const shouldSearch = Boolean(searchText);

  return new Promise((resolve) => {
    let finished = false;
    let cleanupResponse = () => {};
    const finish = (result: Omit<ProxyRequestResult, "latencyMs">) => {
      if (finished) {
        return;
      }
      finished = true;
      cleanupResponse();
      cleanup();
      resolve({ ...result, latencyMs: Date.now() - startedAt });
    };

    const req = transport.request(
      {
        method,
        protocol: targetUrl.protocol,
        hostname: targetUrl.hostname,
        port: targetUrl.port ? Number(targetUrl.port) : undefined,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        headers: {
          "User-Agent": "API Key Health Checker",
          Connection: "close",
          Accept: "*/*",
          "Accept-Encoding": "identity"
        },
        agent
      },
      (res) => {
        if (!shouldSearch) {
          finish({ statusCode: res.statusCode });
          res.resume();
          return;
        }

        let bodyBytes = 0;
        let searchBuffer = "";

        const onData = (chunk: Buffer) => {
          if (finished) {
            return;
          }
          bodyBytes += chunk.length;
          if (bodyBytes <= maxBodyBytes) {
            searchBuffer += chunk.toString("utf8").toLowerCase();
            if (searchText && searchBuffer.includes(searchText)) {
              finish({ statusCode: res.statusCode, bodyBytes, textFound: true });
              res.destroy();
              return;
            }
          }
          if (bodyBytes >= maxBodyBytes) {
            finish({ statusCode: res.statusCode, bodyBytes, textFound: false });
            res.destroy();
          }
        };

        const onEnd = () => {
          if (finished) {
            return;
          }
          finish({ statusCode: res.statusCode, bodyBytes, textFound: false });
        };

        const onError = (error: Error) => finish({ error });

        cleanupResponse = () => {
          res.off("data", onData);
          res.off("end", onEnd);
          res.off("error", onError);
        };

        res.on("data", onData);
        res.on("end", onEnd);
        res.on("error", onError);
      }
    );

    const timeoutId = setTimeout(() => {
      const error = createProxyError("timeout", "Request timeout");
      req.destroy(error);
      finish({ error });
    }, timeoutMs);
    const speedLimitId =
      speedLimitMs > 0 && speedLimitMs < timeoutMs
        ? setTimeout(() => {
            const error = createProxyError("too_slow", "Proxy too slow");
            req.destroy(error);
            finish({ error });
          }, speedLimitMs)
        : undefined;

    const onAbort = () => {
      const error = createProxyError("aborted", "Request aborted");
      req.destroy(error);
    };

    if (signal) {
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (speedLimitId) {
        clearTimeout(speedLimitId);
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    req.on("error", (error) => finish({ error }));
    req.end();
  });
}

function readBytes(socket: net.Socket, length: number, maxBytes = 4096) {
  return new Promise<Buffer>((resolve, reject) => {
    const limit = Math.max(length, maxBytes);
    const chunks: Buffer[] = [];
    let total = 0;

    const onData = (chunk: Buffer) => {
      total += chunk.length;
      if (total > limit) {
        const error = createProxyError("response_too_large", "Proxy response too large");
        cleanup();
        socket.destroy(error);
        reject(error);
        return;
      }
      chunks.push(chunk);
      if (total >= length) {
        const buffer = Buffer.concat(chunks, total);
        const result = buffer.subarray(0, length);
        const rest = buffer.subarray(length);
        if (rest.length > 0) {
          socket.unshift(rest);
        }
        cleanup();
        resolve(result);
      }
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      reject(createProxyError("connect_failed", "Socket closed"));
    };

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };

    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("close", onClose);
  });
}

function isIpv4(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function attachSocketGuards(socket: net.Socket, timeoutMs: number, signal?: AbortSignal) {
  const timeoutId = setTimeout(() => {
    socket.destroy(createProxyError("timeout", "Request timeout"));
  }, timeoutMs);

  const onAbort = () => {
    socket.destroy(createProxyError("aborted", "Request aborted"));
  };

  if (signal) {
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return () => {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
  };
}

async function connectSocks4(
  proxy: ParsedProxy,
  target: { host: string; port: number },
  timeoutMs: number,
  signal?: AbortSignal
): Promise<net.Socket> {
  const socket = net.connect(proxy.port, proxy.host);
  const cleanupGuards = attachSocketGuards(socket, timeoutMs, signal);

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });

    const userId = Buffer.from(proxy.username ?? "");
    const portBuffer = Buffer.alloc(2);
    portBuffer.writeUInt16BE(target.port);

    let request: Buffer;
    if (isIpv4(target.host)) {
      const ipParts = target.host.split(".").map((part) => Number(part));
      request = Buffer.concat([
        Buffer.from([0x04, 0x01]),
        portBuffer,
        Buffer.from(ipParts),
        userId,
        Buffer.from([0x00])
      ]);
    } else {
      request = Buffer.concat([
        Buffer.from([0x04, 0x01]),
        portBuffer,
        Buffer.from([0x00, 0x00, 0x00, 0x01]),
        userId,
        Buffer.from([0x00]),
        Buffer.from(target.host),
        Buffer.from([0x00])
      ]);
    }

    socket.write(request);
    const response = await readBytes(socket, 8);
    if (response[0] !== 0x00) {
      throw createProxyError("type_mismatch", "Invalid SOCKS4 response");
    }
    if (response[1] !== 0x5a) {
      throw createProxyError("connect_failed", "SOCKS4 connect failed");
    }

    cleanupGuards();
    return socket;
  } catch (error) {
    cleanupGuards();
    socket.destroy();
    throw error;
  }
}

async function connectSocks5(
  proxy: ParsedProxy,
  target: { host: string; port: number },
  timeoutMs: number,
  signal?: AbortSignal
): Promise<net.Socket> {
  const socket = net.connect(proxy.port, proxy.host);
  const cleanupGuards = attachSocketGuards(socket, timeoutMs, signal);

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });

    const methods = proxy.username ? [0x00, 0x02] : [0x00];
    socket.write(Buffer.from([0x05, methods.length, ...methods]));
    const greeting = await readBytes(socket, 2);
    if (greeting[0] !== 0x05) {
      throw createProxyError("type_mismatch", "Invalid SOCKS5 response");
    }
    if (greeting[1] === 0xff) {
      throw createProxyError("auth_required", "SOCKS5 auth required");
    }

    if (greeting[1] === 0x02) {
      if (!proxy.username) {
        throw createProxyError("auth_required", "SOCKS5 auth required");
      }
      const user = Buffer.from(proxy.username);
      const pass = Buffer.from(proxy.password ?? "");
      socket.write(
        Buffer.concat([
          Buffer.from([0x01, user.length]),
          user,
          Buffer.from([pass.length]),
          pass
        ])
      );
      const authResponse = await readBytes(socket, 2);
      if (authResponse[1] !== 0x00) {
        throw createProxyError("auth_required", "SOCKS5 auth failed");
      }
    }

    const hostBuffer = Buffer.from(target.host);
    const portBuffer = Buffer.alloc(2);
    portBuffer.writeUInt16BE(target.port);
    const request = Buffer.concat([
      Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuffer.length]),
      hostBuffer,
      portBuffer
    ]);
    socket.write(request);

    const header = await readBytes(socket, 4);
    if (header[0] !== 0x05) {
      throw createProxyError("type_mismatch", "Invalid SOCKS5 response");
    }
    if (header[1] !== 0x00) {
      throw createProxyError("connect_failed", "SOCKS5 connect failed");
    }

    const addressType = header[3];
    if (addressType === 0x01) {
      await readBytes(socket, 6);
    } else if (addressType === 0x03) {
      const lengthBuffer = await readBytes(socket, 1);
      await readBytes(socket, lengthBuffer[0] + 2);
    } else if (addressType === 0x04) {
      await readBytes(socket, 18);
    }

    cleanupGuards();
    return socket;
  } catch (error) {
    cleanupGuards();
    socket.destroy();
    throw error;
  }
}

function connectSocks(
  proxyType: ProxyType,
  proxy: ParsedProxy,
  target: { host: string; port: number },
  timeoutMs: number,
  signal?: AbortSignal
) {
  if (proxyType === "socks4") {
    return connectSocks4(proxy, target, timeoutMs, signal);
  }
  return connectSocks5(proxy, target, timeoutMs, signal);
}

function connectTls(socket: net.Socket, servername: string) {
  return new Promise<tls.TLSSocket>((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername });
    secureSocket.once("secureConnect", () => resolve(secureSocket));
    secureSocket.once("error", reject);
  });
}

async function requestViaSocks(options: {
  proxyType: ProxyType;
  proxy: ParsedProxy;
  targetUrl: URL;
  timeoutMs: number;
  speedLimitMs?: number;
  method?: "GET" | "HEAD";
  signal?: AbortSignal;
  expectedText?: string;
  maxBodyBytes?: number;
}): Promise<ProxyRequestResult> {
  const { proxyType, proxy, targetUrl, timeoutMs, signal } = options;
  const expectedText = options.expectedText?.trim();
  const searchText = expectedText ? expectedText.toLowerCase() : null;
  const maxBodyBytes = options.maxBodyBytes ?? 65536;
  const method = options.method ?? "GET";
  const speedLimitMs = options.speedLimitMs ?? 0;
  const startedAt = Date.now();
  const shouldSearch = Boolean(searchText);
  const targetHost = targetUrl.hostname;
  const targetPort = targetUrl.port
    ? Number(targetUrl.port)
    : targetUrl.protocol === "https:"
      ? 443
      : 80;

  let socket: net.Socket | undefined;
  const timeoutId = setTimeout(() => {
    socket?.destroy(createProxyError("timeout", "Request timeout"));
  }, timeoutMs);
  const speedLimitId =
    speedLimitMs > 0 && speedLimitMs < timeoutMs
      ? setTimeout(() => {
          socket?.destroy(createProxyError("too_slow", "Proxy too slow"));
        }, speedLimitMs)
      : undefined;

  const onAbort = () => {
    socket?.destroy(createProxyError("aborted", "Request aborted"));
  };

  if (signal) {
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }
  try {
    socket = await connectSocks(proxyType, proxy, { host: targetHost, port: targetPort }, timeoutMs, signal);
    const transport =
      targetUrl.protocol === "https:" ? await connectTls(socket, targetHost) : socket;

    const response = await new Promise<{ statusCode: number; bodyBytes: number; textFound?: boolean }>(
      (resolve, reject) => {
        let status: number | undefined;
        let resolved = false;
        let headerBuffer = Buffer.alloc(0);
        let headersComplete = false;
        let bodyBytes = 0;
        let searchBuffer = "";
        const maxHeaderBytes = Math.max(4096, maxBodyBytes);

        const resolveOnce = (value: { statusCode: number; bodyBytes: number; textFound?: boolean }) => {
          if (resolved) {
            return;
          }
          resolved = true;
          cleanup();
          resolve(value);
        };

        const rejectOnce = (error: Error) => {
          if (resolved) {
            return;
          }
          resolved = true;
          cleanup();
          reject(error);
        };

        const parseStatusLine = () => {
          const lineEnd = headerBuffer.indexOf("\r\n");
          if (lineEnd === -1) {
            return;
          }
          const line = headerBuffer.slice(0, lineEnd).toString("utf8");
          const match = line.match(/HTTP\/\d\.\d\s+(\d{3})/);
          if (match) {
            status = Number(match[1]);
          }
        };

        const finalizeResponse = () => {
          if (status === undefined) {
            rejectOnce(createProxyError("connect_failed", "No HTTP response"));
            return;
          }
          const textFound = shouldSearch && searchText
            ? searchBuffer.includes(searchText)
            : undefined;
          resolveOnce({ statusCode: status, bodyBytes, textFound });
        };

        const handleBodyChunk = (chunk: Buffer) => {
          if (!shouldSearch || !searchText) {
            return false;
          }
          if (status === undefined) {
            return false;
          }
          if (bodyBytes <= maxBodyBytes) {
            searchBuffer += chunk.toString("utf8").toLowerCase();
            if (searchBuffer.includes(searchText)) {
              resolveOnce({ statusCode: status, bodyBytes, textFound: true });
              return true;
            }
          }
          if (bodyBytes >= maxBodyBytes) {
            resolveOnce({ statusCode: status, bodyBytes, textFound: false });
            return true;
          }
          return false;
        };

        const onData = (chunk: Buffer) => {
          if (resolved) {
            return;
          }
          if (!headersComplete) {
            headerBuffer = Buffer.concat(
              [headerBuffer, chunk],
              headerBuffer.length + chunk.length
            );
            if (headerBuffer.length > maxHeaderBytes) {
              rejectOnce(createProxyError("response_too_large", "Proxy response too large"));
              return;
            }
            if (status === undefined) {
              parseStatusLine();
            }
            if (!shouldSearch && status !== undefined) {
              resolveOnce({ statusCode: status, bodyBytes });
              return;
            }
            const headerEnd = headerBuffer.indexOf("\r\n\r\n");
            if (headerEnd === -1) {
              return;
            }
            headersComplete = true;
            const bodyStart = headerEnd + 4;
            if (headerBuffer.length > bodyStart) {
              const bodyChunk = headerBuffer.subarray(bodyStart);
              bodyBytes += bodyChunk.length;
              if (handleBodyChunk(bodyChunk)) {
                return;
              }
            }
            headerBuffer = Buffer.alloc(0);
            if (status === undefined) {
              parseStatusLine();
            }
            if (!shouldSearch && status !== undefined) {
              resolveOnce({ statusCode: status, bodyBytes });
            }
            return;
          }

          bodyBytes += chunk.length;
          handleBodyChunk(chunk);
        };

        const onEnd = () => {
          if (resolved) {
            return;
          }
          if (status === undefined && headerBuffer.length > 0) {
            parseStatusLine();
          }
          finalizeResponse();
        };

        const onError = (error: Error) => {
          rejectOnce(error);
        };

        const onClose = () => {
          if (resolved) {
            return;
          }
          if (status === undefined && headerBuffer.length > 0) {
            parseStatusLine();
          }
          finalizeResponse();
        };

        const cleanup = () => {
          transport.off("data", onData);
          transport.off("end", onEnd);
          transport.off("error", onError);
          transport.off("close", onClose);
        };

        transport.on("data", onData);
        transport.on("end", onEnd);
        transport.on("error", onError);
        transport.on("close", onClose);

        const path = `${targetUrl.pathname}${targetUrl.search}`;
        const hostHeader = targetUrl.host || targetHost;
        const request = [
          `${method} ${path || "/"} HTTP/1.1`,
          `Host: ${hostHeader}`,
          "User-Agent: API Key Health Checker",
          "Connection: close",
          "Accept: */*",
          "Accept-Encoding: identity",
          "",
          ""
        ].join("\r\n");
        transport.write(request);
      }
    );

    return {
      statusCode: response.statusCode,
      bodyBytes: response.bodyBytes,
      textFound: response.textFound,
      latencyMs: Date.now() - startedAt
    };
  } catch (error) {
    return { error: error as Error, latencyMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timeoutId);
    if (speedLimitId) {
      clearTimeout(speedLimitId);
    }
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
    if (socket && !socket.destroyed) {
      socket.destroy();
    }
  }
}

function classifyProxyError(error: unknown): ProxyErrorInfo {
  const err = error as (Error & { code?: string; name?: string });
  const rawCode = typeof err.code === "string" ? err.code : undefined;
  const message = sanitizeErrorMessage(err.message || "Proxy error");

  if (rawCode === "timeout" || err.name === "AbortError" || rawCode === "ETIMEDOUT") {
    return {
      status: "NETWORK_ERROR",
      errorCode: "timeout",
      errorMessage: message,
      retryable: true
    };
  }

  if (rawCode === "auth_required") {
    return {
      status: "INVALID",
      errorCode: "auth_required",
      errorMessage: message,
      retryable: false
    };
  }

  if (rawCode === "too_slow") {
    return {
      status: "INVALID",
      errorCode: "too_slow",
      errorMessage: message,
      retryable: false
    };
  }

  if (rawCode === "type_mismatch") {
    return {
      status: "INVALID",
      errorCode: "type_mismatch",
      errorMessage: message,
      retryable: false
    };
  }

  if (rawCode === "no_body") {
    return {
      status: "INVALID",
      errorCode: "no_body",
      errorMessage: message,
      retryable: false
    };
  }

  if (rawCode === "response_too_large") {
    return {
      status: "NETWORK_ERROR",
      errorCode: "response_too_large",
      errorMessage: message,
      retryable: true
    };
  }

  if (
    rawCode === "ECONNREFUSED" ||
    rawCode === "ECONNRESET" ||
    rawCode === "EHOSTUNREACH" ||
    rawCode === "ENETUNREACH" ||
    rawCode === "ENOTFOUND" ||
    rawCode === "EPIPE"
  ) {
    return {
      status: "NETWORK_ERROR",
      errorCode: "connect_failed",
      errorMessage: message,
      retryable: true
    };
  }

  return {
    status: "NETWORK_ERROR",
    errorCode: "connect_failed",
    errorMessage: message,
    retryable: true
  };
}

function resolveProxyTarget(settings?: ProxySettings) {
  const checkMode = settings?.checkMode ?? "validity";
  const targetUrl =
    settings?.targetUrl?.trim().length ? settings.targetUrl.trim() : DEFAULT_TARGET_URL;
  const speedLimitMs = settings?.speedLimitMs ?? 0;
  const htmlCheck = Boolean(settings?.htmlCheck);
  const htmlCheckText = settings?.htmlCheckText?.trim() || DEFAULT_HTML_TEXT;
  return { checkMode, targetUrl, speedLimitMs, htmlCheck, htmlCheckText };
}

async function performProxyRequest(options: {
  proxyType: ProxyType;
  proxy: ParsedProxy;
  targetUrl: URL;
  timeoutMs: number;
  speedLimitMs?: number;
  method?: "GET" | "HEAD";
  signal?: AbortSignal;
  expectedText?: string;
}): Promise<ProxyRequestResult> {
  const { proxyType, proxy, targetUrl, timeoutMs, signal } = options;
  const speedLimitMs = options.speedLimitMs ?? 0;
  const method = options.method ?? "GET";
  const expectedText = options.expectedText;
  const maxBodyBytes = expectedText ? MAX_HTML_BYTES : undefined;
  if (proxyType === "http" || proxyType === "https") {
    const proxyUrl = buildProxyUrl(proxy, proxyType);
    const agent = createHttpAgent(proxyUrl);
    return requestWithAgent({
      targetUrl,
      agent,
      timeoutMs,
      speedLimitMs,
      method,
      signal,
      expectedText,
      maxBodyBytes
    });
  }
  return requestViaSocks({
    proxyType,
    proxy,
    targetUrl,
    timeoutMs,
    speedLimitMs,
    method,
    signal,
    expectedText,
    maxBodyBytes
  });
}

export const proxyAdapter: ServiceAdapter = {
  id: "proxy",
  displayName: "Proxy Checker",
  docsLink: "",
  authScheme: "proxy",
  checkMethods: ["auth_only"],
  async executeCheck({ key, timeoutMs, signal, proxySettings }) {
    const decoded = decodeProxyKey(key);
    const proxyType = decoded?.proxyType ?? proxySettings?.types?.[0] ?? "http";
    const proxyValue = decoded?.proxy ?? key;
    const parsedProxy = parseProxyAddress(proxyValue);
    const { checkMode, targetUrl, speedLimitMs, htmlCheck, htmlCheckText } =
      resolveProxyTarget(proxySettings);
    const effectiveHtmlCheck = checkMode === "url" && htmlCheck && htmlCheckText.length > 0;
    const useHead = checkMode === "validity" || (checkMode === "url" && !effectiveHtmlCheck);
    const method = useHead ? "HEAD" : "GET";

    if (!parsedProxy) {
      return {
        status: "INVALID",
        retryable: false,
        errorCode: "bad_proxy_format",
        errorMessage: "Invalid proxy format",
        latencyMs: 0,
        proxyType,
        checkMode,
        targetUrl
      };
    }

    let parsedTarget: URL;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      return {
        status: "INVALID",
        retryable: false,
        errorCode: "bad_target_url",
        errorMessage: "Invalid target URL",
        latencyMs: 0,
        proxyType,
        checkMode,
        targetUrl
      };
    }
    if (parsedTarget.protocol !== "http:" && parsedTarget.protocol !== "https:") {
      return {
        status: "INVALID",
        retryable: false,
        errorCode: "bad_target_url",
        errorMessage: "Unsupported target URL",
        latencyMs: 0,
        proxyType,
        checkMode,
        targetUrl
      };
    }

    let requestResult = await performProxyRequest({
      proxyType,
      proxy: parsedProxy,
      targetUrl: parsedTarget,
      timeoutMs,
      speedLimitMs,
      method,
      signal,
      expectedText: effectiveHtmlCheck ? htmlCheckText : undefined
    });

    if (
      checkMode === "url" &&
      !effectiveHtmlCheck &&
      !requestResult.error &&
      (requestResult.statusCode === 405 || requestResult.statusCode === 501)
    ) {
      requestResult = await performProxyRequest({
        proxyType,
        proxy: parsedProxy,
        targetUrl: parsedTarget,
        timeoutMs,
        speedLimitMs,
        method: "GET",
        signal,
        expectedText: undefined
      });
    }

    if (requestResult.error) {
      const errorInfo = classifyProxyError(requestResult.error);
      return {
        status: errorInfo.status,
        retryable: errorInfo.retryable,
        errorCode: errorInfo.errorCode,
        errorMessage: errorInfo.errorMessage,
        latencyMs: requestResult.latencyMs,
        proxyType,
        checkMode,
        targetUrl: parsedTarget.toString()
      };
    }

    const httpStatus = requestResult.statusCode;
    if (httpStatus === undefined) {
      return {
        status: "NETWORK_ERROR",
        retryable: true,
        errorCode: "connect_failed",
        errorMessage: "No response",
        latencyMs: requestResult.latencyMs,
        proxyType,
        checkMode,
        targetUrl: parsedTarget.toString()
      };
    }

    if (httpStatus === 407) {
      return {
        status: "INVALID",
        retryable: false,
        httpStatus,
        errorCode: "auth_required",
        errorMessage: "Proxy authentication required",
        latencyMs: requestResult.latencyMs,
        proxyType,
        checkMode,
        targetUrl: parsedTarget.toString()
      };
    }

    let status: "OK" | "INVALID" = "OK";
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    if (checkMode === "url" && (httpStatus < 200 || httpStatus >= 400)) {
      status = "INVALID";
      errorCode = "bad_status";
      errorMessage = `HTTP ${httpStatus}`;
    }

    if (status === "OK" && effectiveHtmlCheck && !requestResult.textFound) {
      status = "INVALID";
      errorCode = "text_not_found";
      errorMessage = `Text not found: ${htmlCheckText}`;
    }

    if (status === "OK" && speedLimitMs > 0 && requestResult.latencyMs > speedLimitMs) {
      status = "INVALID";
      errorCode = "too_slow";
      errorMessage = `Latency ${requestResult.latencyMs}ms exceeds ${speedLimitMs}ms`;
    }

    return {
      status,
      retryable: status !== "OK" && (errorCode === "connect_failed" || errorCode === "timeout"),
      httpStatus,
      errorCode,
      errorMessage,
      latencyMs: requestResult.latencyMs,
      proxyType,
      checkMode,
      targetUrl: parsedTarget.toString()
    };
  }
};
