import fs from "fs";
import path from "path";
import { app } from "electron";
import type { ProcessSettings, ReportSummary, ServiceId, ProcessStatus } from "../shared/types";

export interface HistoryEntry {
  id: string;
  name: string;
  serviceId: ServiceId;
  startedAt: string;
  finishedAt: string;
  status: ProcessStatus;
  settings: ProcessSettings;
  summary: ReportSummary;
  reportPath?: string;
}

export class HistoryStore {
  private filePath: string;
  private entries: HistoryEntry[] = [];

  constructor() {
    this.filePath = path.join(app.getPath("userData"), "history.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw) as HistoryEntry[];
        this.entries = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      this.entries = [];
    }
  }

  private save() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2));
    } catch {
      // ignore write failures
    }
  }

  addEntry(entry: HistoryEntry) {
    this.entries.unshift(entry);
    this.save();
  }

  updateReportPath(processId: string, reportPath: string) {
    const entry = this.entries.find((item) => item.id === processId);
    if (entry) {
      entry.reportPath = reportPath;
      this.save();
    }
  }

  listEntries() {
    return this.entries.slice();
  }
}
