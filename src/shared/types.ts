export type ServiceId = "openai" | "youtube" | "gemini" | "custom";

export type CheckMethod = "auth_only" | "quota" | "sample";

export type CheckStatus =
  | "OK"
  | "INVALID"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export type ProcessStatus =
  | "Running"
  | "Paused"
  | "Finished"
  | "Cancelled";

export type ExportFormat = "csv" | "json";

export interface RandomDelayConfig {
  minMs: number;
  maxMs: number;
  jitter: boolean;
}

export interface ProcessSettings {
  method: CheckMethod;
  randomDelay: RandomDelayConfig;
  concurrency: number;
  timeoutMs: number;
  retries: number;
  perProcessMaxRps: number;
  openAiOrgId?: string;
}

export type CustomAuthType = "bearer" | "header" | "query";

export interface CustomServiceConfig {
  baseUrl: string;
  path: string;
  method: "GET" | "POST" | "HEAD";
  authType: CustomAuthType;
  headerName?: string;
  queryParam?: string;
  successStatusCodes: number[];
}

export interface CheckResult {
  status: CheckStatus;
  httpStatus?: number;
  latencyMs: number;
  errorCode?: string;
  errorMessage?: string;
  checkedAt: string;
}

export interface LogEvent {
  processId: string;
  keyIndex: number;
  keyFull: string;
  keyMasked: string;
  method: CheckMethod;
  result: CheckResult;
}

export interface ProcessProgressEvent {
  processId: string;
  processed: number;
  total: number;
  status: ProcessStatus;
}

export interface ProcessCompletedEvent {
  processId: string;
  finishedAt: string;
  status: ProcessStatus;
}

export interface ReportMeta {
  app: string;
  version: string;
  serviceId: ServiceId;
  checkMethod: CheckMethod;
  startedAt: string;
  finishedAt: string;
  settings: ProcessSettings;
}

export interface ReportSummary {
  total: number;
  success: number;
  invalid: number;
  quota: number;
  rateLimited: number;
  network: number;
  unknown: number;
  avgLatencyMs: number;
  medianLatencyMs: number;
}

export interface ReportResultItem {
  keyMasked: string;
  keyFull?: string;
  status: CheckStatus;
  httpStatus?: number;
  latencyMs: number;
  errorCode?: string;
  errorMessage?: string;
  checkedAt: string;
}

export interface ReportPayload {
  meta: ReportMeta;
  summary: ReportSummary;
  results: ReportResultItem[];
}
