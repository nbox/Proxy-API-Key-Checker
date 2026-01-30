import { getServiceAdapter } from "../services";
import type {
  CheckStatus,
  CustomServiceConfig,
  ProcessSettings,
  ServiceId,
  ProcessStatus,
  ReportSummary
} from "../../shared/types";
import { ProcessRun } from "./processRun";
import { RateLimiter } from "./rateLimiter";
import { HistoryStore } from "../history";
import { registerHeadlessProcess, unregisterHeadlessProcess } from "../services/proxy";

const MAX_LATENCY_SAMPLES = 2000;

export interface StartProcessPayload {
  name: string;
  serviceId: ServiceId;
  keys: string[];
  settings: ProcessSettings;
  customConfig?: CustomServiceConfig;
}

interface StatsTracker {
  total: number;
  success: number;
  invalid: number;
  quota: number;
  rateLimited: number;
  network: number;
  unknown: number;
  latencies: number[];
  latencyCount: number;
  latencyTotal: number;
}

function emptyStats(total: number): StatsTracker {
  return {
    total,
    success: 0,
    invalid: 0,
    quota: 0,
    rateLimited: 0,
    network: 0,
    unknown: 0,
    latencies: [],
    latencyCount: 0,
    latencyTotal: 0
  };
}

function updateStats(stats: StatsTracker, status: CheckStatus, latencyMs: number) {
  stats.latencyCount += 1;
  stats.latencyTotal += latencyMs;
  if (stats.latencies.length < MAX_LATENCY_SAMPLES) {
    stats.latencies.push(latencyMs);
  } else {
    const replaceIndex = Math.floor(Math.random() * stats.latencyCount);
    if (replaceIndex < MAX_LATENCY_SAMPLES) {
      stats.latencies[replaceIndex] = latencyMs;
    }
  }
  if (status === "OK") {
    stats.success += 1;
  } else if (status === "INVALID") {
    stats.invalid += 1;
  } else if (status === "QUOTA_EXCEEDED") {
    stats.quota += 1;
  } else if (status === "RATE_LIMITED") {
    stats.rateLimited += 1;
  } else if (status === "NETWORK_ERROR") {
    stats.network += 1;
  } else {
    stats.unknown += 1;
  }
}

function finalizeSummary(stats: StatsTracker): ReportSummary {
  const avgLatencyMs = stats.latencyCount
    ? Math.round(stats.latencyTotal / stats.latencyCount)
    : 0;
  const sorted = [...stats.latencies].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianLatencyMs =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];

  return {
    total: stats.total,
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

export class ProcessManager {
  private history: HistoryStore;
  private runs = new Map<string, ProcessRun>();
  private stats = new Map<string, StatsTracker>();
  private meta = new Map<
    string,
    {
      name: string;
      serviceId: ServiceId;
      settings: ProcessSettings;
      startedAt: string;
      status: ProcessStatus;
    }
  >();

  constructor(
    private sendEvent: (channel: string, payload: unknown) => void,
    history: HistoryStore
  ) {
    this.history = history;
  }

  startProcess(payload: StartProcessPayload) {
    const adapter = getServiceAdapter(payload.serviceId);
    if (!adapter) {
      throw new Error(`Unknown service adapter: ${payload.serviceId}`);
    }

    const processId = `proc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rateLimiter = new RateLimiter(payload.settings.perProcessMaxRps);

    const startedAt = new Date().toISOString();
    this.meta.set(processId, {
      name: payload.name,
      serviceId: payload.serviceId,
      settings: payload.settings,
      startedAt,
      status: "Running"
    });
    this.stats.set(processId, emptyStats(payload.keys.length));

    if (payload.serviceId === "proxy" && payload.settings.proxy?.headlessBrowser) {
      const poolSize = payload.settings.proxy.headlessPoolSize ?? 0;
      registerHeadlessProcess(processId, poolSize);
    }

    const run = new ProcessRun({
      id: processId,
      name: payload.name,
      serviceId: payload.serviceId,
      keys: payload.keys,
      method: payload.settings.method,
      settings: payload.settings,
      adapter,
      customConfig: payload.customConfig,
      rateLimiter,
      events: {
        onLog: (event) => {
          const tracker = this.stats.get(event.processId);
          if (tracker) {
            updateStats(tracker, event.result.status, event.result.latencyMs);
          }
          this.sendEvent("process-log-event", event);
        },
        onProgress: (event) => {
          const meta = this.meta.get(event.processId);
          if (meta) {
            meta.status = event.status;
          }
          this.sendEvent("process-progress", event);
        },
        onCompleted: (event) => {
          const meta = this.meta.get(event.processId);
          const tracker = this.stats.get(event.processId);
          if (meta && tracker) {
            const summary = finalizeSummary(tracker);
            this.history.addEntry({
              id: event.processId,
              name: meta.name,
              serviceId: meta.serviceId,
              startedAt: meta.startedAt,
              finishedAt: event.finishedAt,
              status: event.status,
              settings: meta.settings,
              summary
            });
          }
          const serviceId = meta?.serviceId ?? payload.serviceId;
          if (serviceId === "proxy") {
            unregisterHeadlessProcess(event.processId);
          }
          this.sendEvent("process-completed", event);
          this.runs.delete(event.processId);
          this.stats.delete(event.processId);
          this.meta.delete(event.processId);
        }
      }
    });

    this.runs.set(processId, run);
    run.start();

    return { processId, startedAt };
  }

  pauseProcess(processId: string) {
    const run = this.runs.get(processId);
    run?.pause();
  }

  resumeProcess(processId: string) {
    const run = this.runs.get(processId);
    run?.resume();
  }

  stopProcess(processId: string) {
    const run = this.runs.get(processId);
    run?.stop();
  }

  updateReportPath(processId: string, reportPath: string) {
    this.history.updateReportPath(processId, reportPath);
  }

  listHistory() {
    return this.history.listEntries();
  }
}
