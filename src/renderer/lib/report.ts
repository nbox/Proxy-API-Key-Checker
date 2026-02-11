import type {
  CheckStatus,
  ProcessSettings,
  ReportPayload,
  ReportResultItem,
  ReportSummary,
  ServiceId,
  CheckMethod
} from "../../shared/types";
import type { ProcessStats } from "./processTypes";

function summarize(results: ReportResultItem[]): ReportSummary {
  const summary: ReportSummary = {
    total: results.length,
    success: 0,
    invalid: 0,
    quota: 0,
    rateLimited: 0,
    network: 0,
    unknown: 0,
    avgLatencyMs: 0,
    medianLatencyMs: 0
  };

  const latencies = results.map((item) => item.latencyMs).sort((a, b) => a - b);
  for (const item of results) {
    if (item.status === "OK") {
      summary.success += 1;
    } else if (item.status === "INVALID") {
      summary.invalid += 1;
    } else if (item.status === "QUOTA_EXCEEDED") {
      summary.quota += 1;
    } else if (item.status === "RATE_LIMITED") {
      summary.rateLimited += 1;
    } else if (item.status === "NETWORK_ERROR") {
      summary.network += 1;
    } else {
      summary.unknown += 1;
    }
  }

  if (latencies.length > 0) {
    const sum = latencies.reduce((acc, val) => acc + val, 0);
    summary.avgLatencyMs = Math.round(sum / latencies.length);
    const mid = Math.floor(latencies.length / 2);
    summary.medianLatencyMs =
      latencies.length % 2 === 0
        ? Math.round((latencies[mid - 1] + latencies[mid]) / 2)
        : latencies[mid];
  }

  return summary;
}

function medianLatency(latencies: number[]) {
  if (!latencies.length) {
    return 0;
  }
  const sorted = [...latencies].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

export function buildSummaryFromStats(stats: ProcessStats, totalOverride?: number): ReportSummary {
  const total =
    totalOverride ??
    stats.success +
      stats.invalid +
      stats.quota +
      stats.rateLimited +
      stats.network +
      stats.unknown;
  const avgLatencyMs = stats.latencyCount
    ? Math.round(stats.latencyTotal / stats.latencyCount)
    : 0;
  const medianLatencyMs = medianLatency(stats.latencies);

  return {
    total,
    success: stats.success,
    invalid: stats.invalid,
    quota: stats.quota,
    rateLimited: stats.rateLimited,
    network: stats.network,
    unknown: stats.unknown,
    avgLatencyMs,
    medianLatencyMs
  };
}

export function buildReportPayload(options: {
  appVersion: string;
  serviceId: ServiceId;
  checkMethod: CheckMethod;
  settings: ProcessSettings;
  startedAt: string;
  finishedAt: string;
  results: ReportResultItem[];
  summary?: ReportSummary;
}) {
  const summary = options.summary ?? summarize(options.results);
  const meta = {
    app: "Proxy & API Key Checker",
    version: options.appVersion,
    serviceId: options.serviceId,
    checkMethod: options.checkMethod,
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
    settings: options.settings
  };

  return {
    meta,
    summary,
    results: options.results
  } satisfies ReportPayload;
}

export function statusBuckets(results: ReportResultItem[]) {
  const buckets = new Map<string, number>();
  for (const item of results) {
    const key = item.errorCode || item.status;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
}

export function statusBucketsFromCounts(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
}

export function formatStatus(status: CheckStatus) {
  return status.replace(/_/g, " ");
}
