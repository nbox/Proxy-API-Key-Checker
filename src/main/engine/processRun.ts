import type {
  CheckMethod,
  CheckResult,
  LogEvent,
  ProcessProgressEvent,
  ProcessSettings,
  ProcessStatus,
  CustomServiceConfig,
  ServiceId
} from "../../shared/types";
import { maskKey, sanitizeErrorMessage } from "../../shared/mask";
import { decodeProxyKey } from "../../shared/proxy";
import type { ServiceAdapter } from "../services/types";
import { RateLimiter } from "./rateLimiter";
import { randomBetween, sleep } from "./utils";

interface ProcessEvents {
  onLog: (event: LogEvent) => void;
  onProgress: (event: ProcessProgressEvent) => void;
  onCompleted: (event: { processId: string; finishedAt: string; status: ProcessStatus }) => void;
}

export interface ProcessRunOptions {
  id: string;
  name: string;
  serviceId: ServiceId;
  keys: string[];
  method: CheckMethod;
  settings: ProcessSettings;
  adapter: ServiceAdapter;
  customConfig?: CustomServiceConfig;
  rateLimiter: RateLimiter;
  events: ProcessEvents;
}

export class ProcessRun {
  private id: string;
  private name: string;
  private keys: string[];
  private method: CheckMethod;
  private settings: ProcessSettings;
  private adapter: ServiceAdapter;
  private customConfig?: CustomServiceConfig;
  private rateLimiter: RateLimiter;
  private events: ProcessEvents;
  private isProxyService: boolean;
  private status: ProcessStatus = "Running";
  private queueIndex = 0;
  private activeCount = 0;
  private processedCount = 0;
  private paused = false;
  private stopped = false;
  private completed = false;
  private abortControllers = new Map<number, AbortController>();

  constructor(options: ProcessRunOptions) {
    this.id = options.id;
    this.name = options.name;
    this.isProxyService = options.serviceId === "proxy";
    this.keys = options.keys;
    this.method = options.method;
    this.settings = options.settings;
    this.adapter = options.adapter;
    this.customConfig = options.customConfig;
    this.rateLimiter = options.rateLimiter;
    this.events = options.events;
  }

  private buildProxyMeta(
    proxyType: CheckResult["proxyType"] | undefined,
    overrides?: { checkMode?: CheckResult["checkMode"]; targetUrl?: CheckResult["targetUrl"] }
  ) {
    if (!this.isProxyService) {
      return { proxyType };
    }
    return {
      proxyType,
      checkMode: overrides?.checkMode ?? this.settings.proxy?.checkMode,
      targetUrl: overrides?.targetUrl ?? this.settings.proxy?.targetUrl
    };
  }

  start() {
    this.status = "Running";
    this.emitProgress();
    this.schedule();
  }

  pause() {
    if (this.status !== "Running") {
      return;
    }
    this.paused = true;
    this.status = "Paused";
    this.emitProgress();
  }

  resume() {
    if (this.status !== "Paused") {
      return;
    }
    this.paused = false;
    this.status = "Running";
    this.emitProgress();
    this.schedule();
  }

  stop() {
    if (this.status === "Finished" || this.status === "Cancelled") {
      return;
    }
    this.stopped = true;
    this.status = "Cancelled";
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.emitProgress();
    this.checkCompletion();
  }

  private emitProgress() {
    this.events.onProgress({
      processId: this.id,
      processed: this.processedCount,
      total: this.keys.length,
      status: this.status
    });
  }

  private schedule() {
    if (this.stopped) {
      this.checkCompletion();
      return;
    }

    while (
      !this.paused &&
      this.activeCount < this.settings.concurrency &&
      this.queueIndex < this.keys.length
    ) {
      const keyIndex = this.queueIndex++;
      this.runKey(keyIndex);
    }

    this.checkCompletion();
  }

  private checkCompletion() {
    if (
      !this.completed &&
      this.activeCount === 0 &&
      (this.queueIndex >= this.keys.length || this.stopped)
    ) {
      if (!this.stopped && this.status !== "Cancelled") {
        this.status = "Finished";
      }
      this.completed = true;
      const finishedAt = new Date().toISOString();
      this.events.onCompleted({
        processId: this.id,
        finishedAt,
        status: this.status
      });
    }
  }

  private async runKey(keyIndex: number) {
    const key = this.keys[keyIndex];
    const controller = new AbortController();
    this.abortControllers.set(keyIndex, controller);
    this.activeCount += 1;

    const proxyInfo = decodeProxyKey(key);
    const displayKey = proxyInfo?.proxy ?? key;
    const maskedKey = this.isProxyService ? displayKey : maskKey(displayKey);
    let result: CheckResult;

    try {
      const delayMs = this.settings.randomDelay.jitter
        ? randomBetween(this.settings.randomDelay.minMs, this.settings.randomDelay.maxMs)
        : this.settings.randomDelay.minMs;
      if (delayMs > 0) {
        await sleep(delayMs);
      }

      result = await this.runWithRetries(key, controller.signal, proxyInfo ?? undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      result = {
        status: "UNKNOWN_ERROR",
        latencyMs: 0,
        errorMessage: sanitizeErrorMessage(message),
        checkedAt: new Date().toISOString(),
        ...this.buildProxyMeta(proxyInfo?.proxyType)
      };
    } finally {
      this.activeCount -= 1;
      this.processedCount += 1;
      this.abortControllers.delete(keyIndex);
    }

    this.events.onLog({
      processId: this.id,
      keyIndex,
      keyFull: displayKey,
      keyMasked: maskedKey,
      method: this.method,
      result
    });

    this.emitProgress();
    this.schedule();
  }

  private async runWithRetries(
    key: string,
    signal: AbortSignal,
    proxyInfo?: { proxyType: CheckResult["proxyType"] }
  ): Promise<CheckResult> {
    let attempt = 0;
    let lastResult: CheckResult = {
      status: "UNKNOWN_ERROR",
      latencyMs: 0,
      checkedAt: new Date().toISOString(),
      errorMessage: "No response",
      ...this.buildProxyMeta(proxyInfo?.proxyType)
    };

    while (attempt <= this.settings.retries) {
      if (this.stopped || signal.aborted) {
        return {
          status: "UNKNOWN_ERROR",
          latencyMs: 0,
          checkedAt: new Date().toISOString(),
          errorCode: "cancelled",
          errorMessage: "Cancelled by user",
          ...this.buildProxyMeta(proxyInfo?.proxyType)
        };
      }

      await this.rateLimiter.wait();
      const adapterResult = await this.adapter.executeCheck({
        key,
        method: this.method,
        timeoutMs: this.settings.timeoutMs,
        signal,
        customConfig: this.customConfig,
        openAiOrgId: this.settings.openAiOrgId,
        proxySettings: this.settings.proxy
      });

      if (this.stopped || signal.aborted) {
        return {
          status: "UNKNOWN_ERROR",
          latencyMs: 0,
          checkedAt: new Date().toISOString(),
          errorCode: "cancelled",
          errorMessage: "Cancelled by user",
          ...this.buildProxyMeta(proxyInfo?.proxyType)
        };
      }

      lastResult = {
        status: adapterResult.status,
        httpStatus: adapterResult.httpStatus,
        latencyMs: adapterResult.latencyMs,
        errorCode: adapterResult.errorCode,
        errorMessage: adapterResult.errorMessage,
        checkedAt: new Date().toISOString(),
        ...this.buildProxyMeta(adapterResult.proxyType ?? proxyInfo?.proxyType, {
          checkMode: adapterResult.checkMode,
          targetUrl: adapterResult.targetUrl
        })
      };

      if (!adapterResult.retryable || attempt === this.settings.retries) {
        break;
      }

      const baseDelay = 500 * Math.pow(2, attempt);
      const maxDelay = 10000;
      const retryAfter = adapterResult.retryAfterMs ?? 0;
      const backoff = Math.min(maxDelay, Math.max(baseDelay, retryAfter));
      const jittered = Math.floor(backoff * (0.7 + Math.random() * 0.6));
      await sleep(jittered);
      attempt += 1;
    }

    return lastResult;
  }
}
