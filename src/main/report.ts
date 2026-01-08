import fs from "fs/promises";
import path from "path";
import { dialog, BrowserWindow } from "electron";
import type { ExportFormat, ReportPayload } from "../shared/types";
import { sanitizeErrorMessage } from "../shared/mask";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/\"/g, "\"\"")}"`;
  }
  return value;
}

function buildCsv(payload: ReportPayload, includeFull: boolean) {
  const headers = [
    includeFull ? "key_full" : null,
    "key_masked",
    "status",
    "http_status",
    "latency_ms",
    "error_code",
    "error_message",
    "checked_at"
  ].filter(Boolean) as string[];

  const lines = [headers.join(",")];
  for (const item of payload.results) {
    const row: string[] = [];
    if (includeFull) {
      row.push(item.keyFull ?? "");
    }
    row.push(
      item.keyMasked,
      item.status,
      item.httpStatus ? String(item.httpStatus) : "",
      String(item.latencyMs ?? 0),
      item.errorCode ?? "",
      sanitizeErrorMessage(item.errorMessage ?? ""),
      item.checkedAt
    );
    lines.push(row.map(csvEscape).join(","));
  }

  return lines.join("\n");
}

function buildJson(payload: ReportPayload, includeFull: boolean) {
  const results = payload.results.map((item) => {
    const cleaned = {
      key_masked: item.keyMasked,
      status: item.status,
      http_status: item.httpStatus ?? null,
      latency_ms: item.latencyMs,
      error_code: item.errorCode ?? null,
      error_message: sanitizeErrorMessage(item.errorMessage ?? ""),
      checked_at: item.checkedAt
    };

    if (includeFull) {
      return { ...cleaned, key_full: item.keyFull ?? "" };
    }
    return cleaned;
  });

  return JSON.stringify(
    {
      meta: payload.meta,
      summary: payload.summary,
      results
    },
    null,
    2
  );
}


async function writeReportFile(
  window: BrowserWindow | null,
  defaultPath: string,
  content: string
) {
  const options = { defaultPath } satisfies Electron.SaveDialogOptions;
  const { canceled, filePath } = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options);
  if (canceled || !filePath) {
    return undefined;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

export async function saveReport(options: {
  window: BrowserWindow | null;
  format: ExportFormat;
  payload: ReportPayload;
  includeFull: boolean;
  defaultPath: string;
}) {
  const { window, format, payload, includeFull, defaultPath } = options;
  const content =
    format === "csv" ? buildCsv(payload, includeFull) : buildJson(payload, includeFull);
  return writeReportFile(window, defaultPath, content);
}
