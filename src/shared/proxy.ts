import type { ProxyType } from "./types";

const PROXY_KEY_PREFIX = "proxy::";
const PROXY_KEY_SEPARATOR = "::";

export function isProxyType(value: string): value is ProxyType {
  return value === "http" || value === "https" || value === "socks4" || value === "socks5";
}

export function encodeProxyKey(proxy: string, proxyType: ProxyType) {
  return `${PROXY_KEY_PREFIX}${proxyType}${PROXY_KEY_SEPARATOR}${proxy}`;
}

export function decodeProxyKey(value: string): { proxy: string; proxyType: ProxyType } | null {
  if (!value.startsWith(PROXY_KEY_PREFIX)) {
    return null;
  }

  const rest = value.slice(PROXY_KEY_PREFIX.length);
  const separatorIndex = rest.indexOf(PROXY_KEY_SEPARATOR);
  if (separatorIndex === -1) {
    return null;
  }

  const typeCandidate = rest.slice(0, separatorIndex);
  if (!isProxyType(typeCandidate)) {
    return null;
  }

  const proxy = rest.slice(separatorIndex + PROXY_KEY_SEPARATOR.length);
  if (!proxy) {
    return null;
  }

  return { proxy, proxyType: typeCandidate };
}
