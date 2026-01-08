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
    latencies: []
  };
}

function updateStats(stats: StatsTracker, status: CheckStatus, latencyMs: number) {
  stats.latencies.push(latencyMs);
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
  const totalLatency = stats.latencies.reduce((sum, val) => sum + val, 0);
  const avgLatencyMs = stats.latencies.length ? Math.round(totalLatency / stats.latencies.length) : 0;
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

    const run = new ProcessRun({
      id: processId,
      name: payload.name,
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
