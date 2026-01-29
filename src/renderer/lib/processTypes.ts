import type {
  CheckMethod,
  ExportFormat,
  LogEvent,
  ProcessSettings,
  ProcessStatus,
  ReportResultItem,
  ServiceId
} from "../../shared/types";

export interface ProcessStats {
  success: number;
  invalid: number;
  quota: number;
  rateLimited: number;
  network: number;
  unknown: number;
  latencies: number[];
}

export interface ProcessUI {
  id: string;
  name: string;
  serviceId: ServiceId;
  startedAt: string;
  finishedAt?: string;
  status: ProcessStatus;
  processed: number;
  total: number;
  method: CheckMethod;
  settings: ProcessSettings;
  keys: string[];
  logs: LogEvent[];
  results: ReportResultItem[];
  stats: ProcessStats;
  expanded: boolean;
  activeTab: "logs" | "stats" | "summary";
  logFilter: "all" | "success" | "failed" | "warning";
  search: string;
  followLogs: boolean;
}

export interface ExportDialogState {
  open: boolean;
  processId?: string;
  format: ExportFormat;
  acknowledged: boolean;
}
