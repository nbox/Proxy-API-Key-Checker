import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { ProcessManager } from "./engine/processManager";
import { HistoryStore } from "./history";
import { readFileWithEncoding } from "./utils";
import { saveReport } from "./report";
import { sanitizeErrorMessage } from "../shared/mask";
import type { ExportFormat, ReportPayload } from "../shared/types";

let mainWindow: BrowserWindow | null = null;
let processManager: ProcessManager | null = null;
const proxyAggregatorControllers = new Map<string, AbortController>();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 980,
    minHeight: 720,
    backgroundColor: "#f6f1e8",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.removeMenu();

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function requireManager() {
  if (!processManager) {
    throw new Error("Process manager is not ready yet");
  }
  return processManager;
}

async function fetchTextWithTimeout(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "API Key Health Checker"
      }
    });
    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }
    const text = await response.text();
    return { text };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    return { error: sanitizeErrorMessage(message) };
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}

function registerIpcHandlers() {
  ipcMain.handle("get-app-version", () => app.getVersion());

  ipcMain.handle("open-key-file", async (_event, payload: { encoding: string }) => {
    const options = {
      properties: ["openFile"],
      filters: [
        { name: "Text", extensions: ["txt", "csv", "json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    } satisfies Electron.OpenDialogOptions;

    const { canceled, filePaths } = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);

    if (canceled || filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = filePaths[0];
    try {
      const content = await readFileWithEncoding(filePath, payload.encoding || "utf-8");
      return { canceled: false, filePath, content };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read file";
      return { canceled: true, error: sanitizeErrorMessage(message) };
    }
  });

  ipcMain.handle("select-directory", async (_event, payload: { title?: string }) => {
    const options = {
      title: payload.title || "Select folder",
      properties: ["openDirectory", "createDirectory"]
    } satisfies Electron.OpenDialogOptions;

    const parentWindow = BrowserWindow.getFocusedWindow() ?? mainWindow;
    if (parentWindow && !parentWindow.isDestroyed()) {
      parentWindow.focus();
    }
    const { canceled, filePaths } = parentWindow
      ? await dialog.showOpenDialog(parentWindow, options)
      : await dialog.showOpenDialog(options);

    if (canceled || filePaths.length === 0) {
      return { canceled: true };
    }

    return { canceled: false, path: filePaths[0] };
  });

  ipcMain.handle("start-check", (_event, payload) => {
    return requireManager().startProcess(payload);
  });

  ipcMain.handle("pause-check", (_event, processId: string) => {
    requireManager().pauseProcess(processId);
  });

  ipcMain.handle("resume-check", (_event, processId: string) => {
    requireManager().resumeProcess(processId);
  });

  ipcMain.handle("stop-check", (_event, processId: string) => {
    requireManager().stopProcess(processId);
  });

  ipcMain.handle(
    "export-report",
    async (
      _event,
      payload: {
        processId: string;
        format: ExportFormat;
        report: ReportPayload;
        defaultPath: string;
        includeFull: boolean;
      }
    ) => {
      const filePath = await saveReport({
        window: mainWindow,
        format: payload.format,
        payload: payload.report,
        includeFull: payload.includeFull,
        defaultPath: payload.defaultPath
      });
      if (filePath) {
        requireManager().updateReportPath(payload.processId, filePath);
      }
      return { filePath };
    }
  );

  ipcMain.handle("list-history", () => requireManager().listHistory());

  ipcMain.handle(
    "fetch-proxy-aggregators",
    async (
      _event,
      payload: { urls: string[]; timeoutMs?: number; requestId?: string }
    ) => {
      const timeoutMs = Math.max(1000, payload.timeoutMs ?? 10000);
      const requestId = payload.requestId ?? "";
      const controller = new AbortController();
      if (requestId) {
        proxyAggregatorControllers.set(requestId, controller);
      }
      const results = await Promise.all(
        (payload.urls || []).map(async (url) => {
          if (controller.signal.aborted) {
            return { url, error: "Cancelled" };
          }
          try {
            new URL(url);
          } catch {
            return { url, error: "Invalid URL" };
          }
          const { text, error } = await fetchTextWithTimeout(
            url,
            timeoutMs,
            controller.signal
          );
          if (controller.signal.aborted) {
            return { url, error: "Cancelled" };
          }
          if (error) {
            return { url, error };
          }
          return { url, content: text ?? "" };
        })
      );

      if (requestId) {
        proxyAggregatorControllers.delete(requestId);
      }
      return { results, cancelled: controller.signal.aborted };
    }
  );

  ipcMain.handle("cancel-proxy-aggregators", (_event, payload: { requestId: string }) => {
    const controller = proxyAggregatorControllers.get(payload.requestId);
    if (controller) {
      controller.abort();
    }
  });
}

app.whenReady().then(() => {
  const historyStore = new HistoryStore();
  processManager = new ProcessManager((channel, payload) => {
    if (mainWindow) {
      mainWindow.webContents.send(channel, payload);
    }
  }, historyStore);

  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
