import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { ProcessManager } from "./engine/processManager";
import { HistoryStore } from "./history";
import { readFileWithEncoding } from "./utils";
import { saveReport } from "./report";
import { sanitizeErrorMessage } from "../shared/mask";
import type { ExportFormat, ProxyType, ReportPayload } from "../shared/types";

let mainWindow: BrowserWindow | null = null;
let processManager: ProcessManager | null = null;
const proxyAggregatorControllers = new Map<string, AbortController>();
const PROXYMANIA_BASE_URL = "https://proxymania.su/free-proxy";
const STANDARD_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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
  signal?: AbortSignal,
  headers?: Record<string, string>
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
        "User-Agent": STANDARD_USER_AGENT,
        ...headers
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  ipcMain.handle(
    "parse-proxymania",
    async (
      _event,
      payload?: { maxMs?: number; maxPages?: number; delayMs?: number }
    ) => {
      const maxMs = Math.max(100, payload?.maxMs ?? 3000);
      const maxPages = Math.min(199, Math.max(1, payload?.maxPages ?? 199));
      const delayMs = Math.max(0, payload?.delayMs ?? 250);
      const byType: Record<ProxyType, Set<string>> = {
        http: new Set(),
        https: new Set(),
        socks4: new Set(),
        socks5: new Set()
      };
      let pages = 0;

      for (let page = 1; page <= maxPages; page += 1) {
        const url = page === 1 ? PROXYMANIA_BASE_URL : `${PROXYMANIA_BASE_URL}?page=${page}`;
        const { text, error } = await fetchTextWithTimeout(url, 20000, undefined, {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html,*/*"
        });
        if (error) {
          return {
            error: `${url}: ${error}`,
            pages,
            maxMs,
            total: 0,
            byType: {
              http: [],
              https: [],
              socks4: [],
              socks5: []
            }
          };
        }

        const rowRe =
          /(\d{1,3}(?:\.\d{1,3}){3}:\d{2,5}).*?\b(HTTP|HTTPS|SOCKS5|SOCKS4)\b.*?(\d+)\s*ms/gis;
        const matches = text ? [...text.matchAll(rowRe)] : [];
        if (matches.length === 0) {
          break;
        }
        pages += 1;
        for (const match of matches) {
          const hostPort = match[1];
          const typeRaw = match[2];
          const ms = Number.parseInt(match[3], 10);
          if (!Number.isFinite(ms) || ms > maxMs) {
            continue;
          }
          const typeKey = typeRaw.toLowerCase();
          if (
            typeKey === "http" ||
            typeKey === "https" ||
            typeKey === "socks4" ||
            typeKey === "socks5"
          ) {
            byType[typeKey].add(hostPort);
          }
        }

        if (delayMs > 0 && page < maxPages) {
          await sleep(delayMs);
        }
      }

      const outputByType = {
        http: Array.from(byType.http).sort(),
        https: Array.from(byType.https).sort(),
        socks4: Array.from(byType.socks4).sort(),
        socks5: Array.from(byType.socks5).sort()
      };
      const total =
        outputByType.http.length +
        outputByType.https.length +
        outputByType.socks4.length +
        outputByType.socks5.length;

      return { pages, maxMs, total, byType: outputByType };
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
