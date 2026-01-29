import type { ProxyType } from "../../shared/types";
import { decodeProxyKey, encodeProxyKey } from "../../shared/proxy";

const SCHEME_PREFIX = /^(https?|socks4|socks5):\/\//i;
const ENTRY_PATTERN = /^(?:[^@\s]+@)?[^\s:]+:\d{2,5}$/;
const PORT_PATTERN = /^\d{2,5}$/;

export function parseAggregatorUrls(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => line.split(/\s+/)[0]?.trim())
    .filter((line): line is string => Boolean(line) && !line.startsWith("#"));
}

export function normalizeProxyLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }
  const decoded = decodeProxyKey(trimmed);
  if (decoded) {
    return encodeProxyKey(decoded.proxy, decoded.proxyType);
  }
  const schemeMatch = trimmed.match(SCHEME_PREFIX);
  const scheme = schemeMatch ? schemeMatch[1].toLowerCase() : null;
  const withoutScheme = schemeMatch ? trimmed.slice(schemeMatch[0].length) : trimmed;
  const tokens = withoutScheme.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }
  let candidate = tokens[0]?.trim();
  if (!candidate) {
    return null;
  }
  if (!ENTRY_PATTERN.test(candidate) && tokens.length >= 2 && PORT_PATTERN.test(tokens[1])) {
    candidate = `${candidate}:${tokens[1]}`;
  }
  if (!ENTRY_PATTERN.test(candidate)) {
    return null;
  }
  if (scheme && (scheme === "http" || scheme === "https" || scheme === "socks4" || scheme === "socks5")) {
    return encodeProxyKey(candidate, scheme);
  }
  return candidate;
}

export function parseProxyText(text: string) {
  return text
    .split(/\r?\n/)
    .map(normalizeProxyLine)
    .filter((entry): entry is string => Boolean(entry));
}

export function mergeProxyLists(primary: string[], extra: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const entry of [...primary, ...extra]) {
    const cleaned = entry.trim();
    if (!cleaned || seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);
    merged.push(cleaned);
  }
  return merged;
}

export function expandProxyKeys(proxies: string[], types: ProxyType[]) {
  const keys: string[] = [];
  for (const proxy of proxies) {
    if (decodeProxyKey(proxy)) {
      keys.push(proxy);
      continue;
    }
    for (const type of types) {
      keys.push(encodeProxyKey(proxy, type));
    }
  }
  return keys;
}
