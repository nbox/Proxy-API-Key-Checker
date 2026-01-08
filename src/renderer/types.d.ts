import type {
  ExportFormat,
  LogEvent,
  ProcessCompletedEvent,
  ProcessProgressEvent,
  ReportPayload
} from "../shared/types";

export interface HistoryEntry {
  id: string;
  name: string;
  serviceId: string;
  startedAt: string;
  finishedAt: string;
  status: string;
  settings: unknown;
  summary: unknown;
  reportPath?: string;
}

export interface StartProcessResponse {
  processId: string;
  startedAt: string;
}

declare global {
  interface Window {
    api: {
      getAppVersion: () => Promise<string>;
      openKeyFile: (payload: { encoding: string }) => Promise<{
        canceled: boolean;
        filePath?: string;
        content?: string;
        error?: string;
      }>;
      startCheck: (payload: unknown) => Promise<StartProcessResponse>;
      pauseProcess: (processId: string) => Promise<void>;
      resumeProcess: (processId: string) => Promise<void>;
      stopProcess: (processId: string) => Promise<void>;
      exportReport: (payload: {
        processId: string;
        format: ExportFormat;
        report: ReportPayload;
        defaultPath: string;
        includeFull: boolean;
      }) => Promise<{ filePath?: string }>;
      listHistory: () => Promise<HistoryEntry[]>;
      onProcessProgress: (callback: (event: ProcessProgressEvent) => void) => () => void;
      onProcessLogEvent: (callback: (event: LogEvent) => void) => () => void;
      onProcessCompleted: (callback: (event: ProcessCompletedEvent) => void) => () => void;
    };
  }
}

export {};
