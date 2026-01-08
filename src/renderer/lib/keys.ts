const HEADER_CANDIDATES = ["key", "api_key", "token"];

export function stripBom(text: string) {
  return text.replace(/^\ufeff/, "");
}

export function normalizeKeys(keys: string[], dedupe: boolean) {
  const cleaned = keys
    .map((key) => key.trim())
    .filter((key) => key.length > 0);

  if (!dedupe) {
    return cleaned;
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const key of cleaned) {
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(key);
    }
  }
  return unique;
}

export function parseKeysFromText(text: string, dedupe: boolean) {
  const normalized = stripBom(text);
  const lines = normalized.split(/\r?\n/);
  return normalizeKeys(lines, dedupe);
}

function detectDelimiter(sample: string) {
  const counts = [",", ";", "\t"].map((delim) => ({
    delim,
    count: sample.split(delim).length - 1
  }));
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].delim : ",";
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

export function parseKeysFromCsv(text: string, dedupe: boolean) {
  const normalized = stripBom(text);
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = parseCsvLine(lines[0], delimiter).map((cell) => cell.trim().toLowerCase());
  const headerIndex = headerCells.findIndex((cell) => HEADER_CANDIDATES.includes(cell));
  const startIndex = headerIndex >= 0 ? 1 : 0;
  const keyIndex = headerIndex >= 0 ? headerIndex : 0;

  const keys: string[] = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i], delimiter);
    if (cells[keyIndex]) {
      keys.push(cells[keyIndex]);
    }
  }

  return normalizeKeys(keys, dedupe);
}

export function parseKeysFromJson(text: string, dedupe: boolean) {
  const normalized = stripBom(text);
  const data = JSON.parse(normalized) as unknown;
  const keys: string[] = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === "string") {
        keys.push(item);
      } else if (item && typeof item === "object") {
        const value = (item as Record<string, unknown>).key;
        const apiKey = (item as Record<string, unknown>).api_key;
        if (typeof value === "string") {
          keys.push(value);
        } else if (typeof apiKey === "string") {
          keys.push(apiKey);
        }
      }
    }
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.keys)) {
      for (const item of obj.keys) {
        if (typeof item === "string") {
          keys.push(item);
        }
      }
    }
  }

  return normalizeKeys(keys, dedupe);
}

export function parseKeysByExtension(
  content: string,
  extension: string,
  dedupe: boolean
) {
  const ext = extension.toLowerCase();
  if (ext === ".csv") {
    return parseKeysFromCsv(content, dedupe);
  }
  if (ext === ".json") {
    return parseKeysFromJson(content, dedupe);
  }
  return parseKeysFromText(content, dedupe);
}
