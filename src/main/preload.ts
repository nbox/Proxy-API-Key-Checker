import { contextBridge, ipcRenderer } from "electron";
import type { ExportFormat, ReportPayload } from "../shared/types";

contextBridge.exposeInMainWorld("api", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  openKeyFile: (payload: { encoding: string }) => ipcRenderer.invoke("open-key-file", payload),
  selectDirectory: (payload: { title?: string }) =>
    ipcRenderer.invoke("select-directory", payload),
  fetchProxyAggregators: (payload: {
    urls: string[];
    timeoutMs?: number;
    requestId?: string;
  }) => ipcRenderer.invoke("fetch-proxy-aggregators", payload),
  cancelProxyAggregators: (payload: { requestId: string }) =>
    ipcRenderer.invoke("cancel-proxy-aggregators", payload),
  startCheck: (payload: unknown) => ipcRenderer.invoke("start-check", payload),
  pauseProcess: (processId: string) => ipcRenderer.invoke("pause-check", processId),
  resumeProcess: (processId: string) => ipcRenderer.invoke("resume-check", processId),
  stopProcess: (processId: string) => ipcRenderer.invoke("stop-check", processId),
  exportReport: (payload: {
    processId: string;
    format: ExportFormat;
    report: ReportPayload;
    defaultPath: string;
    includeFull: boolean;
  }) => ipcRenderer.invoke("export-report", payload),
  listHistory: () => ipcRenderer.invoke("list-history"),
  onProcessProgress: (callback: (data: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on("process-progress", listener);
    return () => ipcRenderer.removeListener("process-progress", listener);
  },
  onProcessLogEvent: (callback: (data: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on("process-log-event", listener);
    return () => ipcRenderer.removeListener("process-log-event", listener);
  },
  onProcessCompleted: (callback: (data: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on("process-completed", listener);
    return () => ipcRenderer.removeListener("process-completed", listener);
  }
});
