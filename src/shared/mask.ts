export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) {
    return "****";
  }
  if (trimmed.length <= 8) {
    return `****...${trimmed.slice(-2)}`;
  }
  return `****...${trimmed.slice(-4)}`;
}

export function sanitizeErrorMessage(message: string, maxLen = 200): string {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) {
    return cleaned;
  }
  return `${cleaned.slice(0, Math.max(0, maxLen - 3))}...`;
}
